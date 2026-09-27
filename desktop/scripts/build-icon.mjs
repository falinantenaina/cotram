import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "..", "frontend", "public", "logo.webp");
const out = path.join(root, "assets", "icon.png");

const size = 512;

await sharp(src)
  .resize(size, size, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile(out);

console.log(`Icon generated: ${out} (${size}x${size})`);
