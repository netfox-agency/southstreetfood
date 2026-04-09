#!/usr/bin/env node
/**
 * Seed all menu item details (descriptions, extras, variants, junctions)
 * to match the Uber Eats configuration provided by the client.
 *
 * Idempotent: wipes extras/junctions/variants + re-creates from scratch.
 * Also updates menu_items (descriptions, prices).
 *
 * Usage:
 *   node scripts/seed-item-details.mjs --apply
 *   (dry-run by default — prints plan only)
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// ─────────────────────────────────────────────────────────────
// Prices in cents
// ─────────────────────────────────────────────────────────────
const EUR = (n) => Math.round(n * 100);

// ─────────────────────────────────────────────────────────────
// Shared extras definitions
// ─────────────────────────────────────────────────────────────

/** Every group has an internal "key" used to wire items → groups */
const GROUPS = {
  // ── Protéines (3 sizes: 1 / 1-2 / 1-3)
  prot_1: {
    name: "👇🏼 Choisis ta prot'",
    min: 1, max: 1, order: 10,
    items: [
      "🍗 Tenders de Poulet croustillant",
      "🍗 Nuggets de Poulet croustillant",
      "🍗 Cordon bleu de Dinde",
      "🍗 Escalope de Poulet mariné",
      "🥩 Viande Hachée mariné",
      "🥩 Kebab",
      "🥩 Merguez",
    ].map((n) => [n, 0]),
  },
  prot_2: {
    name: "👇🏼 Choisis tes 2 prot'",
    min: 1, max: 2, order: 10,
    items: [
      "🍗 Tenders de Poulet croustillant",
      "🍗 Nuggets de Poulet croustillant",
      "🍗 Cordon bleu de Dinde",
      "🍗 Escalope de Poulet mariné",
      "🥩 Viande Hachée mariné",
      "🥩 Kebab",
      "🥩 Merguez",
    ].map((n) => [n, 0]),
  },
  prot_3: {
    name: "👇🏼 Choisis tes 3 prot'",
    min: 1, max: 3, order: 10,
    items: [
      "🍗 Tenders de Poulet croustillant",
      "🍗 Nuggets de Poulet croustillant",
      "🍗 Cordon bleu de Dinde",
      "🍗 Escalope de Poulet mariné",
      "🥩 Viande Hachée mariné",
      "🥩 Kebab",
      "🥩 Merguez",
    ].map((n) => [n, 0]),
  },

  // ── Sauces (required, min 1 max 2)
  sauces: {
    name: "🥫 Les Goûts et les Couleurs",
    min: 1, max: 2, order: 20,
    items: [
      "Mayonnaise", "Biggy", "Algérienne", "Blanche", "Harissa",
      "Andalouse", "Brésilienne", "Chili thaï", "Samouraï",
      "Barbecue", "Ketchup", "Poivre", "Moutarde",
    ].map((n) => [n, 0]),
  },

  // ── Crudités variantes
  crud_4: {
    name: "🥗 Choisis tes ingrédients !",
    min: 0, max: 4, order: 30,
    items: [
      ["🥬 Salade", 0], ["🍅 Tomate", 0], ["🧅 Oignon", 0], ["🧀 Cheddar", 0],
    ],
  },
  crud_cornichon: {
    name: "🥗 Choisis tes ingrédients !",
    min: 0, max: 1, order: 30,
    items: [["🥒 Cornichon", 0]],
  },
  crud_bigmc: {
    name: "🥗 Choisis tes ingrédients !",
    min: 0, max: 3, order: 30,
    items: [
      ["🥬 Salade", 0], ["🧅 Oignon", 0], ["🥒 Cornichon", 0],
    ],
  },
  crud_wrap: {
    name: "🥗 Choisis tes ingrédients !",
    min: 0, max: 4, order: 30,
    items: [
      ["🥬 Salade", 0], ["🍅 Tomate", 0], ["🧅 Oignon", 0], ["🧀 Cheddar", 0],
    ],
  },
  crud_salade: {
    name: "🥗 Choisis tes ingrédients !",
    min: 0, max: 4, order: 30,
    items: [
      ["🍅 Tomate", 0], ["🧅 Oignon", 0], ["🍞 Croûton", 0], ["🌽 Maïs", 0],
    ],
  },

  // ── Ingrédients dedans tacos/bowl (gratuit)
  tacos_ingredients: {
    name: "👇🏼 Choisis tes ingrédients !",
    min: 0, max: 2, order: 35,
    items: [
      ["🧀 Sauce Fromagère", 0],
      ["🍟 Frites Dedans", 0],
    ],
  },

  // ── Choix protéine (Montagnard / Big Cheese)
  prot_choice: {
    name: "👇🏼 Choisis ta prot'",
    min: 0, max: 1, order: 15,
    items: [
      ["🥩 Steak haché 90g", 0],
      ["🍗 Filet de poulet Crunchy", 0],
    ],
  },

  // ── Suppléments steak
  sup_45: {
    name: "⚡️ Supplément infini !",
    min: 0, max: 999, order: 40,
    items: [["🥩 Supplément steak 45g", EUR(1.5)]],
  },
  sup_90: {
    name: "⚡️ Supplément infini !",
    min: 0, max: 1998, order: 40,
    items: [
      ["🥩 Supplément steak 90g", EUR(2)],
      ["🍗 Supplément Poulet Crunchy", EUR(2)],
    ],
  },
  sup_180: {
    name: "⚡️ Supplément infini !",
    min: 0, max: 999, order: 40,
    items: [["🥩 Supplément steak 180g", EUR(2.5)]],
  },

  // ── Saveurs sup (partout)
  saveurs: {
    name: "✨ Une Étincelle de Saveur sup'",
    min: 0, max: 10, order: 50,
    items: [
      "🧀 Emmental râpé", "🧀 Cheddar", "🧀 Raclette", "🧀 Fromage de chèvre",
      "🥔 Galette de Pomme de terre", "🥚 Œuf", "🥓 Bacon de Dinde",
    ].map((n) => [n, EUR(1.5)]),
  },

  // ── Extra cheese
  extra_cheese: {
    name: "🧀 Extra Cheese",
    min: 0, max: 1, order: 55,
    items: [["🧀 Cheddar Fondu", EUR(3)]],
  },

  // ── Accompagnement frites
  accomp: {
    name: "🍟 Accompagnement gourmand (ou pas) ?",
    min: 0, max: 1, order: 60,
    items: [
      ["🧂 Frites Salé", EUR(2)],
      ["🧀 Frites Cheddar", EUR(3.5)],
      ["🧀🥓 Frites Cheddar Bacon", EUR(4.5)],
    ],
  },

  // ── Boissons (partout)
  boissons: {
    name: "🥤 Rafraîchit Toi",
    min: 0, max: 9990, order: 70,
    items: [
      ["Coca-Cola", EUR(2.49)],
      ["Coca-Cola cherry", EUR(2.49)],
      ["Coca-Cola zéro", EUR(2.49)],
      ["Oasis fraise framboise", EUR(2.49)],
      ["Oasis tropical", EUR(2.49)],
      ["Hawaï", EUR(2.49)],
      ["Fanta", EUR(2.49)],
      ["Orangina", EUR(2.49)],
      ["Eau plate", EUR(1.99)],
      ["Red Bull", EUR(2.99)],
    ],
  },

  // ── À partager
  partager: {
    name: "🫣 Tes sûr d'être Calé ?",
    min: 0, max: 3996, order: 80,
    items: [
      ["🍗 Tenders croustillant x5", EUR(6)],
      ["🍗 Nuggets Croustillants x6", EUR(6)],
      ["🧀 Chili cheese x6", EUR(6)],
      ["🧀 Bouchée Camembert x6", EUR(6)],
    ],
  },

  // ── Coulis (cheesecake)
  coulis: {
    name: "🍦 Choisis ton coulis !",
    min: 0, max: 1, order: 25,
    items: [
      ["🍓 Coulis Fruits Rouge", 0],
      ["🍮 Coulis Caramel", 0],
      ["🥮 Coulis Spéculos", 0],
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// Menu items — updates (descriptions, prices) + group wiring
// ─────────────────────────────────────────────────────────────

const ITEMS = {
  // ══ COMPOSE (Tacos / Bowls) ══
  "tacos-m": {
    name: "Tacos M",
    price: EUR(9.9),
    desc: "Un tacos 1 viande généreux, garni de la viande de votre choix, accompagné de frites fondantes et d'une sauce fromagère gourmande. Le tout dans une tortilla grillée, pour un mélange savoureux et réconfortant à chaque bouchée.",
    groups: ["prot_1", "sauces", "tacos_ingredients", "saveurs", "extra_cheese", "accomp", "boissons", "partager"],
  },
  "tacos-l": {
    name: "Tacos L",
    price: EUR(11.9),
    desc: "Un tacos 2 viandes généreux, composé de deux viandes au choix, accompagné de frites fondantes et d'une sauce fromagère gourmande. Le tout dans une tortilla grillée, pour un mélange riche et savoureux à chaque bouchée.",
    groups: ["prot_2", "sauces", "tacos_ingredients", "saveurs", "extra_cheese", "accomp", "boissons", "partager"],
  },
  "tacos-xl": {
    name: "Tacos XL",
    price: EUR(13.9),
    desc: "Un tacos 3 viandes ultra généreux, composé de trois viandes au choix, accompagné de frites fondantes et d'une sauce fromagère gourmande. Le tout dans une tortilla grillée, pour une explosion de saveurs riche et irrésistible.",
    groups: ["prot_3", "sauces", "tacos_ingredients", "saveurs", "extra_cheese", "accomp", "boissons", "partager"],
  },
  "bowl-m": {
    name: "Bowl M",
    price: EUR(9.9),
    desc: "Un Bowl 1 viande généreux, garni de la viande de votre choix, accompagné de frites fondantes et d'une sauce fromagère gourmande. Le tout dans un Bowl, pour un mélange savoureux et réconfortant à chaque bouchée.",
    groups: ["prot_1", "sauces", "tacos_ingredients", "saveurs", "extra_cheese", "accomp", "boissons", "partager"],
  },
  "bowl-l": {
    name: "Bowl L",
    price: EUR(11.9),
    desc: "Un Bowl 2 viandes généreux, composé de deux viandes au choix, accompagné de frites fondantes et d'une sauce gourmande. Le tout dans un Bowl, pour un mélange riche et savoureux à chaque bouchée.",
    groups: ["prot_2", "sauces", "tacos_ingredients", "saveurs", "extra_cheese", "accomp", "boissons", "partager"],
  },
  "bowl-xl": {
    name: "Bowl XL",
    price: EUR(13.9),
    desc: "Un Bowl 3 viandes ultra généreux, composé de trois viandes au choix, accompagné de frites fondantes et d'une sauce fromagère gourmande. Le tout dans un Bowl, pour une explosion de saveurs riche et irrésistible.",
    groups: ["prot_3", "sauces", "tacos_ingredients", "saveurs", "extra_cheese", "accomp", "boissons", "partager"],
  },

  // ══ BURGERS ══
  "cheeseburger": {
    name: "Cheeseburger",
    price: EUR(5.5),
    desc: "Un cheeseburger simple et savoureux, composé d'un steak haché juteux et d'une tranche de cheddar fondante. Le tout dans un pain moelleux, relevé d'une sauce gourmande pour un classique efficace et plein de goût.",
    groups: ["crud_cornichon", "sauces", "sup_45", "saveurs", "extra_cheese", "accomp", "boissons", "partager"],
  },
  "montagnard-burger": {
    name: "Montagnard burger",
    price: EUR(12),
    desc: "Un burger montagnard au choix : 2 steak haché 90g ou 2 filet de poulet crunchy, généreusement garni de raclette fondante et de bacon croustillant. Le tout dans un pain brioché moelleux, pour une expérience gourmande, riche et réconfortante aux saveurs de la montagne.",
    groups: ["prot_choice", "crud_4", "sauces", "sup_90", "saveurs", "extra_cheese", "accomp", "partager", "boissons"],
  },
  "le-big-mc": {
    name: "Le Big Mc",
    price: EUR(8.5),
    desc: "Un Big Mc iconique composé de deux steaks hachés, de cheddar fondant, de salade croquante, d'oignons et cornichons. Le tout dans un pain en trois étages, nappé d'une sauce signature pour un goût unique et incontournable.",
    groups: ["crud_bigmc", "sauces", "sup_45", "saveurs", "extra_cheese", "accomp", "boissons", "partager"],
  },
  "big-cheeseburger": {
    name: "Big cheeseburger",
    price: EUR(9.5),
    desc: "Un Big Cheese généreux au choix : 1 steak haché 90g ou 1 poulet crunchy, accompagné de cheddar fondant. Le tout dans un pain brioché moelleux avec une sauce gourmande pour une version encore plus riche et savoureuse du classique.",
    groups: ["prot_choice", "sauces", "sup_90", "saveurs", "extra_cheese", "accomp", "boissons", "partager"],
  },
  "le-180": {
    name: "Le 180",
    price: EUR(12),
    desc: "Un burger gourmand composé d'un steak de 180g, juteux et parfaitement grillé, niché dans un pain moelleux. Accompagné de cheddar fondant, de crudités fraîches et d'une sauce savoureuse pour un équilibre parfait à chaque bouchée.",
    groups: ["crud_4", "sauces", "sup_180", "saveurs", "extra_cheese", "accomp", "boissons", "partager"],
  },
  "cheddar-fondu": {
    name: "Cheddar Fondu",
    price: EUR(3),
    desc: null,
    groups: [],
  },

  // ══ WRAPS ══
  // note: DB has wrap-poulet + wrap-steak, no wrap-kebab. We keep what exists.
  "wrap-poulet": {
    name: "Wrap poulet",
    price: EUR(9.5),
    desc: "Un wrap poulet gourmand garni de morceaux de poulet croustillant, accompagnés de crudités fraîches et de cheddar. Le tout enroulé dans une tortilla moelleuse avec une sauce onctueuse pour un équilibre parfait entre croquant et fraîcheur.",
    groups: ["crud_wrap", "sauces", "saveurs", "extra_cheese", "accomp", "partager", "boissons"],
  },
  "wrap-steak": {
    name: "Wrap steak",
    price: EUR(9.5),
    desc: "Un wrap généreux garni de deux steaks hachés de 45g, juteux et savoureux, accompagnés de cheddar fondu et de crudités fraîches. Le tout enroulé dans une tortilla moelleuse avec une sauce gourmande pour un format pratique et plein de goût.",
    groups: ["crud_wrap", "sauces", "saveurs", "extra_cheese", "accomp", "partager", "boissons"],
  },

  // ══ FIT ══
  "salade-cesar": {
    name: "Salade Cesar",
    price: EUR(7),
    desc: "Une salade César gourmande et colorée, mêlant salade croquante, tomates cerises juteuses, maïs sucré, oignons et croûtons dorés, le tout sublimé par du poulet croustillant. Un équilibre parfait entre fraîcheur et gourmandise, relevé par une sauce onctueuse pour une expérience savoureuse à chaque bouchée.",
    groups: ["crud_salade", "boissons"],
  },

  // ══ À PARTAGER ══
  "tenders-x5": {
    name: "Tenders croustillants x5",
    price: EUR(6.5),
    desc: "Des tenders de poulet croustillants à l'extérieur et fondants à l'intérieur, préparés avec un poulet savoureux. Accompagnés d'une sauce gourmande, pour une pause simple et pleine de plaisir.",
    groups: ["accomp", "extra_cheese", "boissons"],
  },
  "nuggets-x6": {
    name: "Nuggets croustillants x6",
    price: EUR(6.5),
    desc: "Des nuggets de poulet croustillants à l'extérieur et moelleux à l'intérieur, préparés à partir de poulet savoureux. À déguster avec une sauce gourmande pour un plaisir simple et efficace à chaque bouchée.",
    groups: ["accomp", "extra_cheese", "boissons"],
  },
  "chili-cheese-x6": {
    name: "Chili cheese x6",
    price: EUR(6.5),
    desc: "Des bouchées de chili cheese croustillantes à l'extérieur et fondantes à cœur, pour une touche à la fois douce et savoureuse. À déguster avec une sauce gourmande.",
    groups: ["accomp", "extra_cheese", "boissons"],
  },

  // ══ PATATE ══
  "frites-sale": {
    name: "Frites sale",
    price: EUR(2.5),
    desc: "Des frites dorées et croustillantes, légèrement salées pour révéler toute leur saveur. Fondantes à l'intérieur, elles sont l'accompagnement parfait, simple et irrésistible.",
    groups: [],
  },
  "frites-cheddar": {
    name: "Frites Cheddar",
    price: EUR(4),
    desc: "Des frites croustillantes et dorées, nappées d'un cheddar fondant et généreux. Un mélange ultra gourmand entre croquant et onctuosité pour un plaisir intense à chaque bouchée.",
    groups: [],
  },
  "frites-cheddar-bacon": {
    name: "Frites Cheddar Bacon",
    price: EUR(5),
    desc: "Des frites dorées et croustillantes, généreusement recouvertes de cheddar fondant et de bacon croustillant aux notes fumées. Un mariage intense entre fondant, croquant et gourmandise, pour une explosion de saveurs à chaque bouchée.",
    groups: [],
  },

  // ══ DESSERTS ══
  "tiramisu": {
    name: "Tiramisus",
    price: EUR(4),
    desc: "Un tiramisu onctueux aux couches généreuses de crème légère et de biscuits. Un dessert classique, doux et réconfortant, parfait pour une touche sucrée à tout moment.",
    groups: ["boissons"],
  },
  "tarte-daims": {
    name: "Tarte au daims",
    price: EUR(4),
    desc: "Une part de tarte au Daim irrésistiblement gourmande, mêlant une base croustillante à une crème fondante au caramel, parsemée d'éclats de Daim croquants. Un dessert riche et intensément savoureux, où se rencontrent douceur, croquant et notes délicatement caramélisées pour un pur moment de plaisir.",
    groups: ["boissons"],
  },
  "cheesecake": {
    name: "Cheesecake",
    price: EUR(4.99),
    desc: "Un cheesecake onctueux et fondant, reposant sur une base biscuitée croustillante. Personnalisable selon vos envies avec un coulis au choix : fruits rouges, caramel ou spéculoos, pour une touche gourmande sur mesure.",
    groups: ["coulis", "boissons"],
  },

  // ══ TACOS SIGNATURES (on garde les 2 existants, basic config: sauces + boissons)
  "tacos-crispy-food": {
    name: "Tacos Crispy Food",
    price: EUR(11.5),
    desc: "Un tacos signature crispy, généreusement garni de poulet croustillant et d'ingrédients frais, nappé d'une sauce fromagère gourmande. Une recette signature pour les amateurs de croquant et de saveurs intenses.",
    groups: ["sauces", "saveurs", "extra_cheese", "accomp", "boissons", "partager"],
  },
  "tacos-street-spicy": {
    name: "Tacos Street Spicy",
    price: EUR(11.5),
    desc: "Un tacos signature relevé, garni de viande épicée et d'ingrédients frais, pour un mélange intensément savoureux. Une explosion de piquant et de gourmandise à chaque bouchée.",
    groups: ["sauces", "saveurs", "extra_cheese", "accomp", "boissons", "partager"],
  },
};

// ─────────────────────────────────────────────────────────────
// EXECUTION
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log(APPLY ? "🚀 APPLY MODE" : "🔍 DRY-RUN (use --apply to execute)");
  console.log("");

  // Fetch current items
  const { data: items, error: itemsErr } = await supabase
    .from("menu_items")
    .select("id, slug, name");
  if (itemsErr) throw itemsErr;

  const bySlug = Object.fromEntries(items.map((i) => [i.slug, i]));

  // ── Plan summary
  const plannedSlugs = Object.keys(ITEMS);
  const unknown = plannedSlugs.filter((s) => !bySlug[s]);
  const unplanned = items.filter((i) => !ITEMS[i.slug] && !i.slug.match(/^(coca|fanta|orangina|hawai|oasis|eau|ice|red-bull)/));

  console.log("📋 Plan:");
  console.log(`  ${plannedSlugs.length} items to configure`);
  console.log(`  ${Object.keys(GROUPS).length} extra groups to create`);
  if (unknown.length) console.log(`  ⚠️  ${unknown.length} planned slugs not found in DB:`, unknown);
  if (unplanned.length) console.log(`  ℹ️  ${unplanned.length} items left untouched:`, unplanned.map((i) => i.slug).join(", "));
  console.log("");

  if (!APPLY) {
    console.log("Done (dry-run). Use --apply to execute.");
    return;
  }

  // ── 1. Wipe extras / junctions / variants
  console.log("🗑️  Wiping extras / junctions / variants…");
  // Correct deletion order: junctions → extra_items → extra_groups → variants
  const { error: juncDelErr } = await supabase
    .from("menu_item_extra_groups")
    .delete()
    .not("menu_item_id", "is", null);
  if (juncDelErr) console.warn("  junctions delete:", juncDelErr.message);

  const { error: eiDelErr } = await supabase
    .from("extra_items")
    .delete()
    .not("id", "is", null);
  if (eiDelErr) console.warn("  extra_items delete:", eiDelErr.message);

  const { error: egDelErr } = await supabase
    .from("extra_groups")
    .delete()
    .not("id", "is", null);
  if (egDelErr) console.warn("  extra_groups delete:", egDelErr.message);

  const { error: vDelErr } = await supabase
    .from("menu_item_variants")
    .delete()
    .not("id", "is", null);
  if (vDelErr) console.warn("  variants delete:", vDelErr.message);

  // ── 2. Create all groups (+ items)
  console.log("➕ Creating extra_groups + extra_items…");
  const groupIds = {}; // key → db id

  for (const [key, g] of Object.entries(GROUPS)) {
    const { data: gData, error: gErr } = await supabase
      .from("extra_groups")
      .insert({
        name: g.name,
        min_selections: g.min,
        max_selections: g.max,
        display_order: g.order,
      })
      .select("id")
      .single();
    if (gErr) {
      console.error(`  ✗ group ${key}:`, gErr.message);
      continue;
    }
    groupIds[key] = gData.id;

    const itemRows = g.items.map(([name, price], idx) => ({
      extra_group_id: gData.id,
      name,
      price,
      display_order: idx,
    }));
    if (itemRows.length > 0) {
      const { error: eiErr } = await supabase.from("extra_items").insert(itemRows);
      if (eiErr) console.error(`  ✗ items for ${key}:`, eiErr.message);
    }
    console.log(`  ✓ ${key} (${g.items.length} items)`);
  }

  // ── 3. Update menu_items + create junctions
  console.log("");
  console.log("✏️  Updating menu_items + wiring junctions…");
  let updated = 0;
  let junctions = 0;
  for (const [slug, cfg] of Object.entries(ITEMS)) {
    const item = bySlug[slug];
    if (!item) continue;

    // update description + price
    const { error: upErr } = await supabase
      .from("menu_items")
      .update({ description: cfg.desc, base_price: cfg.price })
      .eq("id", item.id);
    if (upErr) {
      console.error(`  ✗ update ${slug}:`, upErr.message);
      continue;
    }
    updated++;

    if (cfg.groups.length === 0) continue;

    const juncRows = cfg.groups
      .map((gKey) => groupIds[gKey])
      .filter(Boolean)
      .map((gid) => ({ menu_item_id: item.id, extra_group_id: gid }));
    if (juncRows.length > 0) {
      const { error: jErr } = await supabase
        .from("menu_item_extra_groups")
        .insert(juncRows);
      if (jErr) {
        console.error(`  ✗ junctions ${slug}:`, jErr.message);
      } else {
        junctions += juncRows.length;
      }
    }
    console.log(`  ✓ ${slug} (${cfg.groups.length} groups)`);
  }

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ ${updated} items updated`);
  console.log(`✅ ${Object.keys(groupIds).length} extra groups created`);
  console.log(`✅ ${junctions} junctions wired`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((e) => {
  console.error("💥 ERROR:", e);
  process.exit(1);
});
