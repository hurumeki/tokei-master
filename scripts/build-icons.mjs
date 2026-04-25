// Rasterize public/icons/icon.svg into the PNGs referenced by the manifest.
// Run on demand (or pre-build) — the generated PNGs are committed.

import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const srcSvg = resolve(root, "public/icons/icon.svg");
const svg = await readFile(srcSvg);

async function rasterize(out, size, opts = {}) {
  const dest = resolve(root, "public/icons", out);
  let img = sharp(svg, { density: 384 }).resize(size, size, {
    background: opts.bg || { r: 0, g: 0, b: 0, alpha: 0 },
    fit: "contain",
  });
  if (opts.padBg) {
    // Maskable icon: paint a solid square underneath so safe-area cropping works.
    const buf = await img.png().toBuffer();
    img = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: opts.padBg,
      },
    }).composite([{ input: buf }]);
  }
  await img.png().toFile(dest);
  console.log("wrote", dest);
}

await rasterize("icon-192.png", 192);
await rasterize("icon-512.png", 512);
await rasterize("icon-maskable-512.png", 512, {
  padBg: { r: 254, g: 246, b: 228, alpha: 1 }, // var(--bg)
});
