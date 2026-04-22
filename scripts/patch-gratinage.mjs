#!/usr/bin/env node
/**
 * Patch ciblé : transforme le groupe "🧀 Gratinage" (1 seul item "Gratiné"
 * à +2€) en un groupe à choix parmi 4 fromages (Chèvre miel / Cheddar /
 * Emmental / Raclette), tous à +2€, client choisit 1 max.
 *
 * Le script n'affecte QUE le groupe Gratinage. Les autres extras / items /
 * junctions restent intacts. Safe à runner plusieurs fois (idempotent : le
 * script supprime les anciens items Gratinage + recrée les 4 fromages à
 * chaque run).
 *
 * Usage : node scripts/patch-gratinage.mjs
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

const EUR = (e) => Math.round(e * 100);

const FROMAGES = [
  { name: "🧀 Chèvre miel", order: 0 },
  { name: "🧀 Cheddar", order: 1 },
  { name: "🧀 Emmental", order: 2 },
  { name: "🧀 Raclette", order: 3 },
];
const PRICE = EUR(2);
const GROUP_NAME = "🧀 Gratinage";

async function main() {
  console.log("\n🔧 Patch Gratinage : 4 fromages à choisir\n");

  // 1. Trouve le groupe Gratinage
  const { data: group, error: groupErr } = await supabase
    .from("extra_groups")
    .select("id, name, min_selections, max_selections")
    .eq("name", GROUP_NAME)
    .maybeSingle();

  if (groupErr) {
    console.error("Erreur lookup group:", groupErr.message);
    process.exit(1);
  }

  let groupId;
  if (!group) {
    console.log("Group non trouvé, création...");
    const { data: created, error: createErr } = await supabase
      .from("extra_groups")
      .insert({
        name: GROUP_NAME,
        min_selections: 0,
        max_selections: 1,
        display_order: 55,
      })
      .select("id")
      .single();
    if (createErr) {
      console.error("Erreur création group:", createErr.message);
      process.exit(1);
    }
    groupId = created.id;
    console.log(`  ✓ Group créé (id=${groupId})`);
  } else {
    groupId = group.id;
    console.log(`  ✓ Group trouvé (id=${groupId})`);

    // S'assure que c'est bien min 0 / max 1 (1 fromage max à choisir)
    if (group.min_selections !== 0 || group.max_selections !== 1) {
      await supabase
        .from("extra_groups")
        .update({ min_selections: 0, max_selections: 1 })
        .eq("id", groupId);
      console.log("  ✓ Group min=0, max=1 forcé");
    }
  }

  // 2. Wipe les anciens extra_items de ce groupe (ex: l'ancien "Gratiné" unique)
  //    Cascade automatique des junctions extra_item_ingredients (ON DELETE CASCADE)
  const { error: wipeErr } = await supabase
    .from("extra_items")
    .delete()
    .eq("extra_group_id", groupId);
  if (wipeErr) {
    console.error("Erreur wipe items:", wipeErr.message);
    process.exit(1);
  }
  console.log("  ✓ Anciens items du groupe supprimés");

  // 3. Insère les 4 fromages
  const rows = FROMAGES.map((f) => ({
    extra_group_id: groupId,
    name: f.name,
    price: PRICE,
    is_available: true,
    display_order: f.order,
  }));
  const { data: inserted, error: insErr } = await supabase
    .from("extra_items")
    .insert(rows)
    .select("id, name");
  if (insErr) {
    console.error("Erreur insert fromages:", insErr.message);
    process.exit(1);
  }
  console.log(`  ✓ ${inserted.length} fromages insérés :`);
  for (const r of inserted) {
    console.log(`      - ${r.name}`);
  }

  console.log("\n✅ Patch Gratinage terminé.\n");
  console.log("Tes clients verront maintenant, quand ils ajoutent");
  console.log("\"Gratinage\" sur un tacos/burger, un choix parmi 4");
  console.log("fromages, tous à +2€.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
