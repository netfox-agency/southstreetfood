#!/usr/bin/env node
/** Add 3 items missing from the physical menu: Roll, Wrap Kebab, Bouchée Camembert x6. */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const EUR = (n) => Math.round(n * 100);

const WRAPS_CAT = "c0836cd0-5f39-4136-b832-53948470bbb9";
const PARTAGER_CAT = "fc5df724-fa2a-4454-866d-53b2445a2908";

const NEW_ITEMS = [
  {
    slug: "roll",
    name: "Roll",
    base_price: EUR(9),
    category_id: WRAPS_CAT,
    description:
      "Un roll généreux garni de la viande de votre choix, de crudités fraîches, de cheddar et d'une sauce gourmande. Le tout dans une galette moelleuse roulée, pour un format pratique et plein de goût.",
    display_order: 3,
    is_available: true,
    // wrap-like: choose prot + crud + sauces + supplements + accomp
    groupKeys: ["prot_1", "crud_wrap", "sauces", "saveurs", "extra_cheese", "accomp", "partager", "boissons"],
  },
  {
    slug: "wrap-kebab",
    name: "Wrap Kebab",
    base_price: EUR(8),
    category_id: WRAPS_CAT,
    description:
      "Un wrap généreux garni de viande kebab savoureuse, accompagnée de crudités fraîches et de cheddar. Le tout enroulé dans une tortilla moelleuse avec une sauce gourmande, pour un format pratique et plein de goût.",
    display_order: 4,
    is_available: true,
    groupKeys: ["crud_wrap", "sauces", "saveurs", "extra_cheese", "accomp", "partager", "boissons"],
  },
  {
    slug: "bouchee-camembert-x6",
    name: "Bouchée Camembert x6",
    base_price: EUR(5.5),
    category_id: PARTAGER_CAT,
    description:
      "Six bouchées de camembert panées, croustillantes à l'extérieur et fondantes à cœur. À déguster avec une sauce gourmande pour une pause simple et plein de plaisir.",
    display_order: 4,
    is_available: true,
    groupKeys: ["accomp", "extra_cheese", "boissons"],
  },
];

// Fetch extra groups by name to build a name→id map (we can't rely on seed groupKeys directly)
// The seed creates groups with stable names; we'll match on name + min/max to identify them.
const GROUP_NAMES = {
  prot_1: { name: "👇🏼 Choisis ta prot'", max: 1 },
  crud_wrap: { name: "🥗 Choisis tes ingrédients !", max: 4 },
  sauces: { name: "🥫 Les Goûts et les Couleurs", max: 2 },
  saveurs: { name: "✨ Une Étincelle de Saveur sup'", max: 10 },
  extra_cheese: { name: "🧀 South Cheese (Raclette-Cheddar)", max: 1 },
  accomp: { name: "🍟 Accompagnement gourmand (ou pas) ?", max: 1 },
  partager: { name: "🫣 Tes sûr d'être Calé ?", max: 3996 },
  boissons: { name: "🥤 Rafraîchit Toi", max: 9990 },
};

const { data: allGroups, error: gErr } = await supabase
  .from("extra_groups")
  .select("id, name, min_selections, max_selections");
if (gErr) throw gErr;

function findGroupId(key) {
  const def = GROUP_NAMES[key];
  if (!def) return null;
  const match = allGroups.find(
    (g) => g.name === def.name && g.max_selections === def.max,
  );
  return match?.id ?? null;
}

// Check + insert each item
for (const item of NEW_ITEMS) {
  // Skip if slug exists
  const { data: existing } = await supabase
    .from("menu_items")
    .select("id")
    .eq("slug", item.slug)
    .maybeSingle();
  if (existing) {
    console.log(`⏭️  ${item.slug} already exists, skipping`);
    continue;
  }

  const { groupKeys, ...insertData } = item;
  const { data: created, error: insErr } = await supabase
    .from("menu_items")
    .insert(insertData)
    .select("id")
    .single();
  if (insErr) {
    console.error(`✗ ${item.slug}:`, insErr.message);
    continue;
  }
  console.log(`✓ Created ${item.slug} (${created.id})`);

  // Wire extra groups
  const juncRows = groupKeys
    .map((k) => findGroupId(k))
    .filter(Boolean)
    .map((gid) => ({ menu_item_id: created.id, extra_group_id: gid }));
  if (juncRows.length > 0) {
    const { error: jErr } = await supabase.from("menu_item_extra_groups").insert(juncRows);
    if (jErr) console.error(`  ✗ junctions:`, jErr.message);
    else console.log(`  ✓ wired ${juncRows.length} extra groups`);
  }
}
console.log("\nDone.");
