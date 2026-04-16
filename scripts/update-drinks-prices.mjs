#!/usr/bin/env node
/** Update standalone drink menu_items to physical card prices. */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: all } = await supabase.from("menu_items").select("id, slug, name, base_price");
const drinks = all.filter((i) => i.slug.match(/^(coca|fanta|orangina|hawai|oasis|eau|ice|red-bull)/));
console.log("Drinks found:", drinks.map((d) => `${d.slug} (${d.base_price}¢)`).join(", "));

for (const d of drinks) {
  let newPrice;
  if (d.slug.startsWith("red-bull")) newPrice = 299;
  else if (d.slug.startsWith("eau")) newPrice = 150;
  else newPrice = 200; // all standard sodas → 2€
  const { error } = await supabase.from("menu_items").update({ base_price: newPrice }).eq("id", d.id);
  if (error) console.error(`  ✗ ${d.slug}:`, error.message);
  else console.log(`  ✓ ${d.slug} → ${newPrice}¢`);
}
console.log("Done.");
