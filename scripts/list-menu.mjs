// Quick utility: print all menu items (name + slug) from Supabase
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}
const supabase = createClient(url, key);

const { data, error } = await supabase
  .from("menu_items")
  .select("id, name, slug, image_url, category_id")
  .order("name", { ascending: true });

if (error) {
  console.error("Query error:", error);
  process.exit(1);
}

console.log(`\n${data.length} items in menu:\n`);
for (const item of data) {
  const img = item.image_url ? "🖼️ " : "   ";
  console.log(`${img} ${item.name.padEnd(35)} → ${item.slug}`);
}
console.log();
