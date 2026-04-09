// Audit: list all categories + all items with their image status
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: cats } = await supabase
  .from("categories")
  .select("id, name, slug, display_order")
  .order("display_order");

const { data: items } = await supabase
  .from("menu_items")
  .select("id, name, slug, image_url, category_id, display_order")
  .order("display_order");

console.log(`\n${cats.length} categories, ${items.length} items\n`);

for (const cat of cats) {
  const catItems = items.filter((i) => i.category_id === cat.id);
  const withImage = catItems.filter((i) => i.image_url).length;
  console.log(
    `\n━━━ ${cat.name.padEnd(30)} (${withImage}/${catItems.length} with image) ━━━`
  );
  for (const item of catItems) {
    const mark = item.image_url ? "🖼️ " : "   ";
    console.log(`${mark} ${item.name.padEnd(35)} → ${item.slug}`);
  }
}

// Orphans (items with no category or category not in list)
const orphans = items.filter(
  (i) => !cats.find((c) => c.id === i.category_id)
);
if (orphans.length > 0) {
  console.log(`\n━━━ ORPHANS (no category) ━━━`);
  for (const item of orphans) {
    console.log(`  ${item.name} → ${item.slug} (cat_id=${item.category_id})`);
  }
}
console.log();
