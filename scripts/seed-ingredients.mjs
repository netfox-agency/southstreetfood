#!/usr/bin/env node
/**
 * Seed les ingredients "scarce" + auto-link aux menu_items / extra_items en
 * fonction des mots-cles presents dans les noms et descriptions.
 *
 * Idempotent : upsert par nom. Les liens sont recalcules a chaque run
 * (les anciens liens sont effaces puis reconstruits pour rester aligne
 * avec le keyword mapping courant).
 *
 * Usage : node scripts/seed-ingredients.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

/**
 * Liste des ingredients "scarce" a tracker + mots-cles qui doivent matcher
 * le nom ou la description d'un item/extra pour auto-creer le lien.
 *
 * Chaque entree : { name, displayOrder, keywords: string[] }
 * Matching case-insensitive sur name + description de l'item/extra.
 */
const SCARCE_INGREDIENTS = [
  { name: "Bacon", displayOrder: 10, keywords: ["bacon"] },
  { name: "Raclette", displayOrder: 20, keywords: ["raclette"] },
  { name: "Cheddar", displayOrder: 30, keywords: ["cheddar"] },
  { name: "Steak hache 90g", displayOrder: 40, keywords: ["steak hache 90", "steak hache", "steak haché 90", "steak haché"] },
  { name: "Steak 180g", displayOrder: 50, keywords: ["steak de 180", "steak 180"] },
  { name: "Filet de poulet crunchy", displayOrder: 60, keywords: ["filet de poulet crunchy", "filet de poulet", "poulet crunchy"] },
  { name: "Tenders de poulet", displayOrder: 70, keywords: ["tenders"] },
  { name: "Nuggets de poulet", displayOrder: 80, keywords: ["nuggets"] },
  { name: "Viande kebab", displayOrder: 90, keywords: ["kebab", "doner", "döner"] },
  { name: "Chevre", displayOrder: 100, keywords: ["chevre", "chèvre"] },
  { name: "Camembert", displayOrder: 110, keywords: ["camembert", "bouchée camembert", "bouchee camembert"] },
  { name: "Mozzarella", displayOrder: 120, keywords: ["mozzarella", "mozza"] },
  { name: "Chili", displayOrder: 130, keywords: ["chili"] },
  { name: "Sauce fromagere", displayOrder: 140, keywords: ["sauce fromagere", "sauce fromagère"] },
  { name: "Sauce samourai", displayOrder: 150, keywords: ["samourai", "samouraï"] },
  { name: "Sauce blanche", displayOrder: 160, keywords: ["sauce blanche"] },
  { name: "Sauce algerienne", displayOrder: 170, keywords: ["algerienne", "algérienne"] },
  { name: "Sauce biggy", displayOrder: 180, keywords: ["biggy"] },
  { name: "Thon", displayOrder: 190, keywords: ["thon"] },
  { name: "Saumon", displayOrder: 200, keywords: ["saumon"] },
  { name: "Ananas", displayOrder: 210, keywords: ["ananas"] },
  { name: "Champignons", displayOrder: 220, keywords: ["champignon"] },
];

function norm(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function keywordsMatch(text, keywords) {
  const t = norm(text);
  return keywords.some((k) => t.includes(norm(k)));
}

async function main() {
  console.log("\nSeed ingredients + auto-mapping\n");

  // 1. Upsert ingredients (insert si absent, no-op si existe avec meme nom)
  console.log("Step 1 : upsert ingredients");
  const insertRows = SCARCE_INGREDIENTS.map((ing) => ({
    name: ing.name,
    display_order: ing.displayOrder,
  }));

  const { data: upserted, error: upErr } = await supabase
    .from("ingredients")
    .upsert(insertRows, { onConflict: "name", ignoreDuplicates: false })
    .select("id, name");

  if (upErr) {
    console.error("Upsert error:", upErr.message);
    process.exit(1);
  }
  console.log(`   ${upserted?.length || 0} ingredients presents en DB`);

  // Build nameToId
  const nameToId = new Map();
  for (const ing of upserted || []) {
    nameToId.set(ing.name, ing.id);
  }

  // 2. Fetch all menu_items + extra_items
  console.log("Step 2 : fetch items + extras");
  const [itemsRes, extrasRes] = await Promise.all([
    supabase.from("menu_items").select("id, name, description"),
    supabase.from("extra_items").select("id, name"),
  ]);

  const items = itemsRes.data || [];
  const extras = extrasRes.data || [];
  console.log(`   ${items.length} menu_items / ${extras.length} extras`);

  // 3. Compute links via keyword matching
  console.log("Step 3 : keyword matching");
  const menuLinks = [];
  const extraLinks = [];

  for (const scarce of SCARCE_INGREDIENTS) {
    const ingId = nameToId.get(scarce.name);
    if (!ingId) continue;

    for (const item of items) {
      const text = `${item.name} ${item.description || ""}`;
      if (keywordsMatch(text, scarce.keywords)) {
        menuLinks.push({
          menu_item_id: item.id,
          ingredient_id: ingId,
        });
      }
    }

    for (const extra of extras) {
      if (keywordsMatch(extra.name, scarce.keywords)) {
        extraLinks.push({
          extra_id: extra.id,
          ingredient_id: ingId,
        });
      }
    }
  }

  console.log(`   ${menuLinks.length} liens menu_item<->ingredient`);
  console.log(`   ${extraLinks.length} liens extra<->ingredient`);

  // 4. Wipe old links + insert new
  // Wipe seulement les liens qui concernent les ingredients qu'on gere
  // (= ceux qu'on vient d'upserter). Laisse tranquille les liens manuels
  // que l'admin aurait pu creer pour d'autres ingredients hors de la liste.
  console.log("Step 4 : sync links (wipe + insert pour ingredients seed)");
  const seedIngIds = Array.from(nameToId.values());

  await supabase
    .from("menu_item_ingredients")
    .delete()
    .in("ingredient_id", seedIngIds);
  await supabase
    .from("extra_item_ingredients")
    .delete()
    .in("ingredient_id", seedIngIds);

  if (menuLinks.length > 0) {
    const { error: insErr1 } = await supabase
      .from("menu_item_ingredients")
      .insert(menuLinks);
    if (insErr1) {
      console.error("Insert menuLinks error:", insErr1.message);
      process.exit(1);
    }
  }
  if (extraLinks.length > 0) {
    const { error: insErr2 } = await supabase
      .from("extra_item_ingredients")
      .insert(extraLinks);
    if (insErr2) {
      console.error("Insert extraLinks error:", insErr2.message);
      process.exit(1);
    }
  }

  console.log("\nTermine. Verifie les liens dans /admin/ingredients.\n");
  console.log("Tu peux editer manuellement les cas faux (l'auto-mapping");
  console.log("se plante toujours sur ~10% des cas : ex. un burger qui a");
  console.log("du bacon mais ne le mentionne pas dans la description).");
  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
