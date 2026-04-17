#!/usr/bin/env node
/**
 * Compresse la video hero en 720p H.264 (~3-5 MB au lieu de 34),
 * extrait la premiere frame comme poster JPG,
 * et upload les 2 sur Supabase Storage (bucket site-assets).
 *
 * Usage : node scripts/compress-upload-hero-video.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync, existsSync, statSync, unlinkSync } from "fs";
import { homedir, tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";
import { createRequire } from "module";

config({ path: ".env.local" });

const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static");

const BUCKET = "site-assets";
const SOURCE = join(homedir(), "Downloads", "videoburger ssf 1.mp4");
const TMP = tmpdir();
const TMP_VIDEO = join(TMP, "hero-compressed.mp4");
const TMP_POSTER = join(TMP, "hero-poster.jpg");
const REMOTE_VIDEO = "hero-video.mp4";
const REMOTE_POSTER = "hero-poster.jpg";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌ Missing Supabase env vars");
  process.exit(1);
}

if (!existsSync(SOURCE)) {
  console.error(`❌ Source video not found: ${SOURCE}`);
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const srcMB = (statSync(SOURCE).size / 1_000_000).toFixed(1);
console.log(`\n🎬 Source : ${SOURCE} (${srcMB} MB)\n`);

// ─────────────────────────────────────────────
// 1. Compress video : 720p H.264, no audio, faststart
//    - scale to max 1280px wide, preserve aspect ratio
//    - CRF 28 = qualite visuelle web correcte, fichier petit
//    - preset medium = balance vitesse / compression
//    - +faststart = moov atom au debut → streaming progressif
//    - pix_fmt yuv420p = compat max (Safari iOS notamment)
//    - pas d'audio (hero muted de toute facon)
// ─────────────────────────────────────────────
console.log("🎞️  Compression video → 720p H.264 sans audio...");
const compressCmd = [
  `"${ffmpegPath}"`,
  `-y`,
  `-i "${SOURCE}"`,
  `-c:v libx264`,
  `-crf 28`,
  `-preset medium`,
  `-vf "scale='min(1280,iw)':-2"`,
  `-an`,
  `-movflags +faststart`,
  `-pix_fmt yuv420p`,
  `"${TMP_VIDEO}"`,
].join(" ");

try {
  execSync(compressCmd, { stdio: "inherit" });
} catch {
  console.error("❌ ffmpeg compression a echoue");
  process.exit(1);
}

const outMB = (statSync(TMP_VIDEO).size / 1_000_000).toFixed(2);
const ratio = (statSync(SOURCE).size / statSync(TMP_VIDEO).size).toFixed(1);
console.log(`\n✅ Compressed : ${outMB} MB (${ratio}× plus petit que l'original)\n`);

// ─────────────────────────────────────────────
// 2. Extract first frame as poster JPG
// ─────────────────────────────────────────────
console.log("🖼️  Extraction premiere frame → poster JPG...");
const posterCmd = [
  `"${ffmpegPath}"`,
  `-y`,
  `-i "${SOURCE}"`,
  `-vframes 1`,
  `-q:v 3`,
  `-vf "scale='min(1280,iw)':-2"`,
  `"${TMP_POSTER}"`,
].join(" ");

try {
  execSync(posterCmd, { stdio: "inherit" });
} catch {
  console.error("❌ ffmpeg poster extraction a echoue");
  process.exit(1);
}

const posterKB = (statSync(TMP_POSTER).size / 1000).toFixed(0);
console.log(`\n✅ Poster : ${posterKB} KB\n`);

// ─────────────────────────────────────────────
// 3. Upload both to Supabase Storage
// ─────────────────────────────────────────────
console.log("📤 Upload Supabase...\n");

for (const { file, remote, contentType } of [
  { file: TMP_VIDEO, remote: REMOTE_VIDEO, contentType: "video/mp4" },
  { file: TMP_POSTER, remote: REMOTE_POSTER, contentType: "image/jpeg" },
]) {
  const buffer = readFileSync(file);
  const { error } = await supabase.storage.from(BUCKET).upload(remote, buffer, {
    contentType,
    upsert: true,
    cacheControl: "public, max-age=31536000, immutable",
  });
  if (error) {
    console.error(`❌ Upload ${remote} : ${error.message}`);
    process.exit(1);
  }
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(remote);
  console.log(`   ✅ ${remote}\n      ${pub.publicUrl}\n`);
}

// Cleanup tmp files
try {
  unlinkSync(TMP_VIDEO);
  unlinkSync(TMP_POSTER);
} catch {
  // ignore cleanup errors
}

console.log("🎉 Termine. Le hero chargera maintenant :\n");
console.log("   - Poster JPG (~50 KB) : affichage INSTANTANE de la frame 1");
console.log(`   - Video MP4 (${outMB} MB) : stream progressif, joue en ~1-2s`);
console.log("\n");
