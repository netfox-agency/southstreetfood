#!/usr/bin/env node
/**
 * SEED INGREDIENTS v2 — extraction COMPLÈTE depuis seed-item-details.mjs
 *
 * Stratégie :
 *   1. Check prérequis : la table `ingredients` doit exister (migrations
 *      006/007/008 appliquées). Sinon le script print des instructions
 *      claires et exit proprement.
 *   2. Parse seed-item-details.mjs pour récupérer :
 *        - GROUPS : tous les extra_groups avec leurs items (ce sont des
 *          ingrédients sélectionnables/retirables par le client)
 *        - ITEMS : chaque menu_item avec son desc + ses groups linked
 *   3. Extrait les ingrédients candidats depuis :
 *        a. items de chaque GROUP (ex: "🧀 Cheddar" → ingrédient Cheddar)
 *        b. keyword matching dans les DESC des items (ex: "steak haché juteux"
 *           → ingrédient Steak haché, même si pas dans un group)
 *   4. Déduplique par nom normalisé (strip emojis + trim + lower).
 *   5. Upsert tous les ingrédients uniques dans la table `ingredients`.
 *   6. Link chaque menu_item à ses ingrédients (junction menu_item_ingredients)
 *      et chaque extra_item à l'ingrédient correspondant si son nom match
 *      (junction extra_item_ingredients).
 *   7. Tout est wipé + reconstruit à chaque run (idempotent).
 *
 * Usage : node scripts/seed-ingredients-v2.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌ Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

// ═══════════════════════════════════════════════════════════════
// PREREQ CHECK : migrations appliquées ?
// ═══════════════════════════════════════════════════════════════

async function checkMigrationsApplied() {
  const { error } = await supabase
    .from("ingredients")
    .select("id", { head: true, count: "exact" })
    .limit(1);

  if (
    error &&
    (error.code === "42P01" ||
      error.code === "PGRST205" ||
      /not find|does not exist/i.test(error.message || ""))
  ) {
    console.error("\n❌ MIGRATIONS PAS ENCORE APPLIQUÉES\n");
    console.error("La table `ingredients` n'existe pas. Tu dois d'abord");
    console.error("appliquer les 3 migrations SQL dans Supabase Dashboard :\n");
    console.error("  1. Ouvre https://supabase.com/dashboard/project/exwfddsyavnlntnogpoz/sql/new");
    console.error("  2. Copie le contenu de supabase/migrations/006_availability_status.sql → Run");
    console.error("  3. Copie le contenu de supabase/migrations/007_ingredients.sql → Run");
    console.error("  4. Copie le contenu de supabase/migrations/008_availability_cascade_and_cron.sql → Run");
    console.error("\nPuis re-run ce script : node scripts/seed-ingredients-v2.mjs\n");
    process.exit(1);
  }
  if (error) {
    console.error("❌ Erreur check table ingredients:", error.message);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════
// PARSE seed-item-details.mjs
// ═══════════════════════════════════════════════════════════════

// Import le module directement pour récupérer les objets JS (plus safe
// qu'un regex parser). On le charge via dynamic import.
//
// NOTE : seed-item-details.mjs n'exporte pas GROUPS/ITEMS donc on fait
// une copie locale minimaliste ici, synchronisée manuellement. Ça évite
// de dépendre d'un refactor de seed-item-details.
//
// TRUE SOURCE : on va re-lire la source comme fichier texte et eval les
// const GROUPS + const ITEMS isolément. Sans les loggers.

async function loadSeedConfig() {
  const sourcePath = join(__dirname, "seed-item-details.mjs");
  const source = readFileSync(sourcePath, "utf-8");

  // Stratégie : on wrap le fichier dans une fonction async et on eval.
  // On expose GROUPS et ITEMS.
  //
  // Pour éviter d'exécuter le main(), on splice juste les déclarations
  // qui nous intéressent.
  const groupsMatch = source.match(/const GROUPS = ({[\s\S]*?^};)$/m);
  const itemsMatch = source.match(/const ITEMS = ({[\s\S]*?^};)$/m);
  if (!groupsMatch || !itemsMatch) {
    throw new Error("Impossible de parser GROUPS/ITEMS depuis seed-item-details.mjs");
  }

  // EUR helper
  const EUR = (e) => Math.round(e * 100);

  // Eval GROUPS et ITEMS isolément
  const GROUPS = new Function("EUR", `return ${groupsMatch[1]};`)(EUR);
  const ITEMS = new Function("EUR", `return ${itemsMatch[1]};`)(EUR);

  return { GROUPS, ITEMS };
}

// ═══════════════════════════════════════════════════════════════
// NORMALISATION + KEYWORD MATCHING
// ═══════════════════════════════════════════════════════════════

/**
 * Strip les emojis + trim + lowercase + normalize accents.
 * "🧀 Cheddar Fondu" → "cheddar fondu"
 */
function normalize(name) {
  if (!name) return "";
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/\p{Extended_Pictographic}/gu, "") // strip emojis
    .replace(/[^\w\s]/g, " ") // strip ponctuation
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Format display name : strip emojis du début, trim, capitalize first.
 * "🧀 Cheddar" → "Cheddar"
 * "🥩 Steak haché 90g" → "Steak haché 90g"
 */
function displayName(name) {
  if (!name) return "";
  const clean = String(name)
    .replace(/^\s*\p{Extended_Pictographic}[\s️]*/gu, "") // strip leading emoji
    .trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Dictionnaire d'ingrédients canoniques à chercher dans les descriptions.
 * Pour chaque ingrédient "implicite" qui n'apparaît pas forcément dans un
 * extra_group, on définit ses patterns de matching.
 *
 * L'ordre matter : les plus spécifiques d'abord (ex: "poulet crunchy"
 * AVANT "poulet"), pour que le match catch le plus descriptif.
 */
const DESC_KEYWORDS = [
  // Protéines + viandes
  { name: "Steak haché 180g", patterns: ["steak de 180", "steak 180"] },
  { name: "Steak haché 90g", patterns: ["steak haché 90", "steak haché de 90"] },
  { name: "Steak haché 45g", patterns: ["steak haché 45", "steaks hachés de 45"] },
  { name: "Steak haché", patterns: ["steak haché", "steaks hachés"] },
  { name: "Poulet crunchy", patterns: ["poulet crunchy", "poulet croustillant", "filet de poulet crunchy"] },
  { name: "Poulet grillé", patterns: ["poulet grillé", "poulet mariné", "escalope de poulet"] },
  { name: "Tenders de poulet", patterns: ["tenders"] },
  { name: "Nuggets de poulet", patterns: ["nuggets"] },
  { name: "Cordon bleu", patterns: ["cordon bleu"] },
  { name: "Viande hachée", patterns: ["viande hachée"] },
  { name: "Viande kebab", patterns: ["kebab", "doner"] },
  { name: "Merguez", patterns: ["merguez"] },
  { name: "Bacon", patterns: ["bacon"] },
  { name: "Œuf", patterns: ["œuf", "oeuf"] },

  // Fromages
  { name: "Cheddar", patterns: ["cheddar"] },
  { name: "Raclette", patterns: ["raclette"] },
  { name: "Emmental", patterns: ["emmental", "emmenthal"] },
  { name: "Chèvre", patterns: ["chèvre", "chevre"] },
  { name: "Chèvre miel", patterns: ["chèvre miel", "chevre miel"] },
  { name: "Mozzarella", patterns: ["mozzarella", "mozza"] },
  { name: "Camembert", patterns: ["camembert"] },

  // Pains/enveloppes
  { name: "Pain brioché", patterns: ["pain brioché", "pain brioche"] },
  { name: "Pain moelleux", patterns: ["pain moelleux"] },
  { name: "Tortilla", patterns: ["tortilla"] },
  { name: "Bowl (base)", patterns: ["dans un bowl"] },

  // Crudités + légumes
  { name: "Salade", patterns: ["salade"] },
  { name: "Tomate", patterns: ["tomate", "tomates cerises"] },
  { name: "Oignon", patterns: ["oignon"] },
  { name: "Cornichon", patterns: ["cornichon"] },
  { name: "Croûton", patterns: ["croûton", "crouton"] },
  { name: "Maïs", patterns: ["maïs", "mais"] },
  { name: "Champignons", patterns: ["champignon"] },
  { name: "Ananas", patterns: ["ananas"] },

  // Accompagnements / composants
  { name: "Frites", patterns: ["frites fondantes", "frites dedans"] },
  { name: "Sauce fromagère", patterns: ["sauce fromagère", "sauce fromagere"] },
  { name: "Galette pomme de terre", patterns: ["galette de pomme de terre", "galette pomme"] },
];

/**
 * Retourne les noms d'ingrédients canoniques matchés dans un texte.
 */
function keywordsFromText(text) {
  if (!text) return [];
  const normText = normalize(text);
  const found = new Set();
  for (const kw of DESC_KEYWORDS) {
    if (kw.patterns.some((p) => normText.includes(normalize(p)))) {
      found.add(kw.name);
    }
  }
  return Array.from(found);
}

// ═══════════════════════════════════════════════════════════════
// EXTRACTION des ingrédients uniques
// ═══════════════════════════════════════════════════════════════

/**
 * Pour chaque entrée des GROUPS, décide si ses items doivent devenir
 * des ingrédients. On SKIP les groupes qui ne sont pas des ingrédients
 * à proprement parler :
 *   - "boissons" → les boissons sont des items séparés, pas des ingrédients
 *   - "partager" → idem
 *   - "accomp" → ce sont des extras frites, pas des ingrédients (à débattre)
 *   - "coulis" → pour cheesecake, skip
 *
 * En revanche, les fromages du group "saveurs" SONT des ingrédients
 * (Emmental, Cheddar, etc).
 */
const SKIP_GROUPS = new Set([
  "boissons",
  "partager",
  "coulis",
]);

function extractIngredientsFromGroup(groupKey, group) {
  if (SKIP_GROUPS.has(groupKey)) return [];
  const out = [];
  for (const itemDef of group.items || []) {
    const [rawName] = itemDef;
    const name = displayName(rawName);
    if (!name || name.length < 2) continue;
    // Skip les "Supplément steak" génériques — ils référencent un steak
    // déjà présent via desc matching. Pour éviter les doublons confus.
    if (/^suppl[eé]ment/i.test(name)) continue;
    out.push(name);
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log("\n🌱 Seed ingredients v2 — extraction complète\n");

  // 0. Check migrations
  await checkMigrationsApplied();
  console.log("  ✓ Table ingredients accessible");

  // 1. Load config
  const { GROUPS, ITEMS } = await loadSeedConfig();
  console.log(`  ✓ Loaded ${Object.keys(GROUPS).length} groups, ${Object.keys(ITEMS).length} items depuis seed-item-details.mjs`);

  // 2. Build canonical ingredients map :
  //    normalized_name → { display, sources: Set of group keys OR "desc" }
  const ingredientsMap = new Map();

  // 2a. Depuis les GROUPS
  for (const [groupKey, group] of Object.entries(GROUPS)) {
    const names = extractIngredientsFromGroup(groupKey, group);
    for (const name of names) {
      const norm = normalize(name);
      if (!ingredientsMap.has(norm)) {
        ingredientsMap.set(norm, { display: name, sources: new Set() });
      }
      ingredientsMap.get(norm).sources.add(`group:${groupKey}`);
    }
  }

  // 2b. Depuis les DESC des items
  for (const [slug, item] of Object.entries(ITEMS)) {
    const keywords = keywordsFromText(item.desc);
    for (const kw of keywords) {
      const norm = normalize(kw);
      if (!ingredientsMap.has(norm)) {
        ingredientsMap.set(norm, { display: kw, sources: new Set() });
      }
      ingredientsMap.get(norm).sources.add(`desc:${slug}`);
    }
  }

  console.log(`  ✓ ${ingredientsMap.size} ingrédients uniques extraits`);

  // 3. Fetch existing menu_items + extra_items pour ensuite faire les links
  const [itemsRes, extrasRes] = await Promise.all([
    supabase.from("menu_items").select("id, slug, name, description"),
    supabase.from("extra_items").select("id, extra_group_id, name"),
  ]);
  if (itemsRes.error || extrasRes.error) {
    console.error("❌ Erreur fetch items:", (itemsRes.error || extrasRes.error)?.message);
    process.exit(1);
  }
  const dbItems = itemsRes.data || [];
  const dbExtras = extrasRes.data || [];

  // Fetch extra_groups avec leur name pour pouvoir retrouver quel extra
  // appartient à quel groupe du seed config.
  const { data: dbGroups } = await supabase
    .from("extra_groups")
    .select("id, name");
  const dbGroupsMap = new Map();
  for (const g of dbGroups || []) {
    dbGroupsMap.set(normalize(g.name), g.id);
  }

  // 4. Upsert tous les ingredients (by name)
  //    On met un display_order basé sur l'ordre d'apparition dans le map
  console.log("  → Upsert ingredients...");
  const ingredientsArray = Array.from(ingredientsMap.entries()).map(
    ([, info], idx) => ({
      name: info.display,
      display_order: idx * 10,
    }),
  );

  const { data: upserted, error: upsertErr } = await supabase
    .from("ingredients")
    .upsert(ingredientsArray, { onConflict: "name", ignoreDuplicates: false })
    .select("id, name");
  if (upsertErr) {
    console.error("❌ Upsert ingredients:", upsertErr.message);
    process.exit(1);
  }
  console.log(`  ✓ ${upserted?.length || 0} ingrédients présents en DB`);

  // Build name → id map
  const ingredientIdByNorm = new Map();
  for (const row of upserted || []) {
    ingredientIdByNorm.set(normalize(row.name), row.id);
  }

  // 5. Build les junction links
  //
  // 5a. menu_item_ingredients : RÈGLE CLÉE — la cascade vers un menu_item
  //     doit se faire UNIQUEMENT pour les ingrédients qui font partie
  //     intrinsèque de la recette (mentionnés dans la DESC), pas les
  //     options/suppléments.
  //
  //     Exemple : le Cheeseburger a "cheddar fondant" dans sa desc → si
  //     cheddar OOS, cheeseburger indispo (cascade OK). Mais il a aussi le
  //     supplément "Emmental râpé" dans le group saveurs — on NE cascade
  //     PAS emmental vers le cheeseburger (c'est optionnel). On cascade
  //     emmental vers l'extra_item correspondant (5b ci-dessous).
  //
  //     On complète desc avec 2 sources explicites :
  //       - prot_choice : "Choisis ta prot'" sur certains burgers
  //         (Montagnard, Big cheeseburger) — ces protéines FONT partie
  //         du plat (le client doit en choisir 1, pas optionnel).
  //         Mais chacune est un choix parmi 2 → pas de cascade si UNE
  //         est OOS (l'autre reste dispo).
  //     Conclusion : seule la DESC garantit que l'ingrédient est cascade.
  console.log("  → Build menu_item ↔ ingredient links (via desc keywords)...");
  const menuLinks = [];
  for (const [slug, itemDef] of Object.entries(ITEMS)) {
    const dbItem = dbItems.find((i) => i.slug === slug);
    if (!dbItem) {
      console.warn(`    ⚠ Pas de menu_item en DB pour slug "${slug}" (skip)`);
      continue;
    }

    const itemIngredients = new Set();

    // Ingrédients cascade = uniquement ceux mentionnés dans la desc
    // (c'est-à-dire dans la recette intrinsèque du plat).
    for (const kw of keywordsFromText(itemDef.desc)) {
      const ingId = ingredientIdByNorm.get(normalize(kw));
      if (ingId) itemIngredients.add(ingId);
    }

    for (const ingId of itemIngredients) {
      menuLinks.push({ menu_item_id: dbItem.id, ingredient_id: ingId });
    }
  }
  console.log(`  ✓ ${menuLinks.length} liens menu_item ↔ ingredient (cascade) calculés`);

  // 5b. extra_item_ingredients : pour chaque extra_item en DB, si son
  //     nom match un ingrédient connu, link.
  console.log("  → Build extra ↔ ingredient links...");
  const extraLinks = [];
  for (const ex of dbExtras) {
    const norm = normalize(ex.name);
    const ingId = ingredientIdByNorm.get(norm);
    if (!ingId) continue;
    extraLinks.push({ extra_id: ex.id, ingredient_id: ingId });
  }
  console.log(`  ✓ ${extraLinks.length} liens extra ↔ ingredient calculés`);

  // 6. Wipe les junctions existantes (seulement pour les ingredients
  //    qu'on gère) puis insert les nouveaux links
  console.log("  → Sync junctions (wipe + insert)...");
  const allIngIds = Array.from(ingredientIdByNorm.values());
  if (allIngIds.length > 0) {
    await supabase
      .from("menu_item_ingredients")
      .delete()
      .in("ingredient_id", allIngIds);
    await supabase
      .from("extra_item_ingredients")
      .delete()
      .in("ingredient_id", allIngIds);
  }

  if (menuLinks.length > 0) {
    const { error } = await supabase
      .from("menu_item_ingredients")
      .insert(menuLinks);
    if (error) {
      console.error("❌ Insert menu links:", error.message);
      process.exit(1);
    }
  }
  if (extraLinks.length > 0) {
    const { error } = await supabase
      .from("extra_item_ingredients")
      .insert(extraLinks);
    if (error) {
      console.error("❌ Insert extra links:", error.message);
      process.exit(1);
    }
  }

  // 7. Print résumé
  console.log("\n✅ Seed ingredients v2 terminé.\n");
  console.log("Résumé :");
  console.log(`  - ${ingredientsMap.size} ingrédients dans la table`);
  console.log(`  - ${menuLinks.length} liens menu_item ↔ ingredient`);
  console.log(`  - ${extraLinks.length} liens extra ↔ ingredient`);
  console.log("\nTu peux maintenant :");
  console.log("  - Marquer un ingrédient OOS dans /kitchen/menu onglet Ingredients");
  console.log("  - Voir la liste complète + éditer dans /admin/ingredients");
  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
