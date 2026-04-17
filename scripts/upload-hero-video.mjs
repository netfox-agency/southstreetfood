#!/usr/bin/env node
/**
 * Upload la video hero sur Supabase Storage (bucket site-assets, public).
 * Garde le repo git leger (34 MB hors git).
 *
 * Cree le bucket site-assets s'il n'existe pas encore (public, videos + images OK).
 *
 * Usage : node scripts/upload-hero-video.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync, existsSync, statSync } from "fs";
import { homedir } from "os";
import { join } from "path";

config({ path: ".env.local" });

const BUCKET = "site-assets";
const LOCAL = join(homedir(), "Downloads", "videoburger ssf 1.mp4");
const REMOTE = "hero-video.mp4";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌ Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

if (!existsSync(LOCAL)) {
  console.error(`❌ File not found: ${LOCAL}`);
  process.exit(1);
}

// Ensure bucket exists (public, allows video + image)
const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
if (listErr) {
  console.error(`❌ List buckets: ${listErr.message}`);
  process.exit(1);
}

const existing = buckets.find((b) => b.name === BUCKET);
if (!existing) {
  console.log(`📦 Creating bucket "${BUCKET}" (public)...`);
  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    allowedMimeTypes: ["video/mp4", "video/webm", "image/*"],
    fileSizeLimit: 52_428_800, // 50 MB
  });
  if (createErr) {
    console.error(`❌ Create bucket: ${createErr.message}`);
    process.exit(1);
  }
}

const sizeMB = (statSync(LOCAL).size / 1_000_000).toFixed(1);
console.log(`\n📤 Uploading ${LOCAL} (${sizeMB} MB) → ${BUCKET}/${REMOTE}\n`);

const buffer = readFileSync(LOCAL);
const { error: upErr } = await supabase.storage
  .from(BUCKET)
  .upload(REMOTE, buffer, {
    contentType: "video/mp4",
    upsert: true,
    cacheControl: "public, max-age=31536000, immutable",
  });

if (upErr) {
  console.error(`❌ Upload failed: ${upErr.message}`);
  process.exit(1);
}

const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(REMOTE);
console.log(`✅ Uploaded. Public URL :\n\n${pub.publicUrl}\n`);
