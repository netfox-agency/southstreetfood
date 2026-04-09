/**
 * Import menu images from local Drive dump → Supabase Storage + link to menu_items
 *
 * Usage:
 *   1. Download Drive folder into tmp/drive-import/
 *   2. node scripts/import-drive-images.mjs            (dry-run, shows mapping)
 *   3. node scripts/import-drive-images.mjs --apply    (actually upload)
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync, existsSync } from "fs";
import { basename, extname } from "path";
import mime from "mime-types";

config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");
const ROOT = "tmp/drive-import";
const BUCKET = "menu-images";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌ Missing Supabase env vars");
  process.exit(1);
}
const supabase = createClient(url, key);

/* ─────────────────────────────────────────────
   Explicit mapping: Drive file path → menu item slugs
   (same image can be linked to multiple slugs, e.g. bowl sizes)
   ───────────────────────────────────────────── */

// Priority 1: "uber south street/" (official Uber Eats images — use these)
// Priority 2: "produits/boissons/" (drinks — not present in uber folder)
const MAPPING = {
  // ─── Burgers (uber) ───
  "uber south street/180 seul_.png": ["le-180"],
  "uber south street/big cheese seul.png": ["big-cheeseburger"],
  "uber south street/big mac seul.png": ["le-big-mc"],
  "uber south street/cheese seul.png": ["cheeseburger"],
  "uber south street/montagnard seul.png": ["montagnard-burger"],
  "uber south street/burger cheddar.png": ["cheddar-fondu"],

  // ─── Bowls (uber) — 1 image per size ───
  "uber south street/bowl L.png": ["bowl-l"],
  "uber south street/bowl m.png": ["bowl-m"],
  "uber south street/bowl XL.png": ["bowl-xl"],

  // ─── Tacos (uber) — 1 image per size + generic for specialties ───
  "uber south street/tacos l.png": ["tacos-l"],
  "uber south street/tacos m.png": ["tacos-m"],
  "uber south street/tacos xl.png": ["tacos-xl"],
  "uber south street/tacos.png": ["tacos-crispy-food", "tacos-street-spicy"],

  // ─── Wraps (uber) ───
  "uber south street/wrap poulet.png": ["wrap-poulet"],
  "uber south street/wrap steak menu_.png": ["wrap-steak"],

  // ─── Frites (uber) ───
  "uber south street/frites.png": ["frites-sale"],
  "uber south street/frites cheddar.png": ["frites-cheddar"],
  "uber south street/frites cheddar bacon.png": ["frites-cheddar-bacon"],

  // ─── Tex mex (uber) ───
  "uber south street/chili.png": ["chili-cheese-x6"],
  "uber south street/nuggets.png": ["nuggets-x6"],
  "uber south street/tenders.png": ["tenders-x5"],

  // ─── Salade (uber) ───
  "uber south street/salade.png": ["salade-cesar"],

  // ─── Desserts (uber) ───
  "uber south street/cheescecake.png": ["cheesecake"],
  "uber south street/tarte daim.png": ["tarte-daims"],
  "uber south street/tiramisu.png": ["tiramisu"],

  // ─── Boissons (from produits/ — not in uber folder) ───
  "produits/boissons/coca cola.png": ["coca-cola"],
  "produits/boissons/coca cherry.png": ["coca-cola-cherry"],
  "produits/boissons/coca zéro.png": ["coca-zero"],
  "produits/boissons/cristaline.png": ["eau-plate"],
  "produits/boissons/fanta orange.png": ["fanta"],
  "produits/boissons/hawai.png": ["hawai"],
  "produits/boissons/lipton icetea peche.png": ["ice-tea"],
  "produits/boissons/oasis fraise.png": ["oasis-fraise"],
  "produits/boissons/oasis tropical.png": ["oasis-tropical"],
  "produits/boissons/orangina.png": ["orangina"],
  "produits/boissons/red bull.png": ["red-bull"],
};

/* ─────────────────────────────────────────────
   Main
   ───────────────────────────────────────────── */

async function main() {
  console.log(
    `\n${APPLY ? "🚀 APPLY MODE — will upload to Supabase" : "🔍 DRY RUN — use --apply to actually upload"}\n`
  );

  // Fetch all menu items
  const { data: items, error } = await supabase
    .from("menu_items")
    .select("id, name, slug, image_url");

  if (error) {
    console.error("❌ Failed to fetch menu_items:", error);
    process.exit(1);
  }

  const bySlug = new Map(items.map((i) => [i.slug, i]));

  const plannedUploads = []; // { path, remoteName, itemIds[], itemLabels[] }
  const unknownSlugs = [];
  const missingFiles = [];

  for (const [filePath, slugs] of Object.entries(MAPPING)) {
    const fullPath = `${ROOT}/${filePath}`;
    if (!existsSync(fullPath)) {
      missingFiles.push(filePath);
      continue;
    }

    const itemIds = [];
    const itemLabels = [];
    for (const slug of slugs) {
      const item = bySlug.get(slug);
      if (!item) {
        unknownSlugs.push({ file: filePath, slug });
        continue;
      }
      itemIds.push(item.id);
      itemLabels.push(item.name);
    }

    if (itemIds.length === 0) continue;

    // Derive a clean remote filename from the first slug
    const ext = extname(filePath).toLowerCase();
    const remoteName = `${slugs[0]}${ext}`;

    plannedUploads.push({
      localPath: fullPath,
      relPath: filePath,
      remoteName,
      itemIds,
      itemLabels,
    });
  }

  /* ─── Report matched ─── */
  console.log(`📸 Matched (${plannedUploads.length} images → ${plannedUploads.reduce((s, u) => s + u.itemIds.length, 0)} items):\n`);
  for (const up of plannedUploads) {
    console.log(`  ${basename(up.relPath).padEnd(30)} → ${up.itemLabels.join(", ")}`);
  }

  /* ─── Report menu items with no image ─── */
  const coveredSlugs = new Set(
    plannedUploads.flatMap((u) =>
      items
        .filter((i) => u.itemIds.includes(i.id))
        .map((i) => i.slug)
    )
  );
  const missingItems = items.filter((i) => !coveredSlugs.has(i.slug));

  if (missingItems.length > 0) {
    console.log(`\n⚠️  Menu items WITHOUT image (${missingItems.length}):\n`);
    for (const item of missingItems) {
      console.log(`  ✗ ${item.name} (${item.slug})`);
    }
  }

  if (missingFiles.length > 0) {
    console.log(`\n⚠️  Files referenced in MAPPING but not found on disk:\n`);
    for (const f of missingFiles) console.log(`  ✗ ${f}`);
  }

  if (unknownSlugs.length > 0) {
    console.log(`\n⚠️  Slugs referenced in MAPPING but not in menu_items:\n`);
    for (const { file, slug } of unknownSlugs) {
      console.log(`  ✗ "${slug}" (from ${file})`);
    }
  }

  if (!APPLY) {
    console.log(`\n➡️  Re-run with --apply to upload to Supabase\n`);
    return;
  }

  /* ─── Upload + link ─── */
  console.log(`\n🚀 Uploading to Supabase Storage (bucket: ${BUCKET})...\n`);
  let okCount = 0;
  let errCount = 0;

  for (const up of plannedUploads) {
    try {
      const buffer = readFileSync(up.localPath);
      const contentType = mime.lookup(up.localPath) || "image/png";

      // Upload (upsert so re-running the script is idempotent)
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(up.remoteName, buffer, {
          contentType,
          upsert: true,
        });

      if (upErr) {
        console.log(`  ❌ upload ${up.remoteName}: ${upErr.message}`);
        errCount++;
        continue;
      }

      // Get public URL + cache-buster so browsers pick up re-uploads
      const { data: pub } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(up.remoteName);
      const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;

      // Update every linked menu item
      const { error: updErr } = await supabase
        .from("menu_items")
        .update({ image_url: publicUrl })
        .in("id", up.itemIds);

      if (updErr) {
        console.log(`  ❌ update ${up.itemLabels.join(", ")}: ${updErr.message}`);
        errCount++;
        continue;
      }

      console.log(`  ✅ ${up.remoteName} → ${up.itemLabels.join(", ")}`);
      okCount++;
    } catch (e) {
      console.log(`  ❌ ${up.remoteName}: ${e.message}`);
      errCount++;
    }
  }

  console.log(
    `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ ${okCount} images uploaded\n` +
      `❌ ${errCount} errors\n` +
      `⚠️  ${missingItems.length} items still without image\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
