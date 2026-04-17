#!/usr/bin/env node
/**
 * Upload les 2 images manquantes (Roll + Wrap Kebab) sur Supabase Storage
 * et met à jour image_url dans menu_items.
 *
 * Les fichiers sources sont pris directement depuis ~/Downloads
 * (pas besoin de les déplacer). Idempotent : ré-exécution safe.
 *
 * Usage :
 *   node scripts/upload-roll-wrap-images.mjs            (dry run)
 *   node scripts/upload-roll-wrap-images.mjs --apply    (upload + update)
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");
const BUCKET = "menu-images";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌ Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const DOWNLOADS = join(homedir(), "Downloads");

// Mapping local file → slug DB + nom remote dans le bucket
const UPLOADS = [
  {
    localPath: join(DOWNLOADS, "roll.png"),
    slug: "roll",
    remoteName: "roll.png",
  },
  {
    localPath: join(DOWNLOADS, "wrap kebab seul.png"),
    slug: "wrap-kebab",
    remoteName: "wrap-kebab.png",
  },
];

async function main() {
  console.log(
    `\n${APPLY ? "🚀 APPLY MODE — upload + update DB" : "🔍 DRY RUN — use --apply to actually push"}\n`,
  );

  // 1. Vérifier que les fichiers existent
  for (const up of UPLOADS) {
    if (!existsSync(up.localPath)) {
      console.error(`❌ Fichier introuvable : ${up.localPath}`);
      process.exit(1);
    }
  }

  // 2. Fetch les items correspondants en DB
  const slugs = UPLOADS.map((u) => u.slug);
  const { data: items, error: fetchErr } = await supabase
    .from("menu_items")
    .select("id, slug, name, image_url")
    .in("slug", slugs);

  if (fetchErr) {
    console.error("❌ Fetch menu_items :", fetchErr.message);
    process.exit(1);
  }

  const bySlug = new Map(items.map((i) => [i.slug, i]));

  // 3. Plan
  console.log("📋 Plan :\n");
  for (const up of UPLOADS) {
    const item = bySlug.get(up.slug);
    if (!item) {
      console.log(`  ❌ ${up.slug} introuvable en DB`);
      continue;
    }
    const hasImg = item.image_url ? "🖼️  (existante)" : "   (aucune)";
    console.log(`  ${hasImg}  ${item.name.padEnd(15)} ← ${up.localPath}`);
  }

  if (!APPLY) {
    console.log("\n➡️  Re-run avec --apply pour effectuer l'upload\n");
    return;
  }

  // 4. Upload + update
  console.log("\n🚀 Upload vers le bucket Storage + update image_url...\n");

  let ok = 0;
  let errors = 0;

  for (const up of UPLOADS) {
    const item = bySlug.get(up.slug);
    if (!item) {
      errors++;
      continue;
    }

    try {
      const buffer = readFileSync(up.localPath);

      // Upload (upsert = ré-exécution safe)
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(up.remoteName, buffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (upErr) {
        console.log(`  ❌ upload ${up.remoteName} : ${upErr.message}`);
        errors++;
        continue;
      }

      // Public URL + cache-buster pour que le browser repull
      const { data: pub } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(up.remoteName);
      const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;

      // Update DB
      const { error: updErr } = await supabase
        .from("menu_items")
        .update({ image_url: publicUrl })
        .eq("id", item.id);

      if (updErr) {
        console.log(`  ❌ update ${item.name} : ${updErr.message}`);
        errors++;
        continue;
      }

      console.log(`  ✅ ${item.name.padEnd(15)} → ${publicUrl}`);
      ok++;
    } catch (e) {
      console.log(`  ❌ ${up.slug} : ${e.message}`);
      errors++;
    }
  }

  console.log(
    `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ ${ok} images uploadées + linkées\n` +
      `${errors > 0 ? `❌ ${errors} erreurs\n` : ""}` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
