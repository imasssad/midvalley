// Makes the website copy (WebP) of photos shipped in public/, with the same settings the admin uses for uploads
// (lib/images.ts: upright, at most 2560px wide, never enlarged, WebP quality 82, metadata stripped). The original
// file stays next to it as the fallback / download copy. Usage: node scripts/optimize-images.mjs public/images/a.jpg …
import path from "node:path";
import sharp from "sharp";

const MAX_WIDTH = 2560; // keep in step with OPTIMIZED_MAX_WIDTH in lib/media.ts
const QUALITY = 82; // keep in step with OPTIMIZED_QUALITY in lib/media.ts

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node scripts/optimize-images.mjs <public/…/photo.jpg> [more files]");
  process.exit(1);
}
for (const file of files) {
  const out = file.replace(/\.(jpe?g|png)$/i, ".webp");
  if (out === file) {
    console.error(`Skipped ${file}: use a JPG or PNG.`);
    process.exitCode = 1;
    continue;
  }
  const info = await sharp(file)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 4 })
    .toFile(out);
  console.log(`${path.relative(process.cwd(), out)}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
}
