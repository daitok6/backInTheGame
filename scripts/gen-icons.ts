/**
 * One-off icon generator: a teal rounded square with a white up-arrow,
 * matching the app's manifest theme color (#0E7C66). Run with:
 *   npx tsx scripts/gen-icons.ts
 * Outputs committed PNGs to public/icons/.
 */
import sharp from "sharp";
import { mkdirSync } from "fs";
import path from "path";

const OUT_DIR = path.join(__dirname, "..", "public", "icons");
mkdirSync(OUT_DIR, { recursive: true });

function svg(size: number, opts: { maskableSafeArea?: boolean } = {}): string {
  const arrowScale = opts.maskableSafeArea ? 0.42 : 0.5;
  const cx = size / 2;
  const cy = size / 2;
  const armLen = size * arrowScale;
  const strokeWidth = size * 0.09;
  const cornerRadius = opts.maskableSafeArea ? 0 : size * 0.22;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="#0E7C66" />
  <g stroke="#FFFFFF" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <line x1="${cx}" y1="${cy + armLen / 2}" x2="${cx}" y2="${cy - armLen / 2}" />
    <line x1="${cx - armLen * 0.32}" y1="${cy - armLen / 2 + armLen * 0.32}" x2="${cx}" y2="${cy - armLen / 2}" />
    <line x1="${cx + armLen * 0.32}" y1="${cy - armLen / 2 + armLen * 0.32}" x2="${cx}" y2="${cy - armLen / 2}" />
  </g>
</svg>`.trim();
}

async function main() {
  const targets: Array<{ name: string; size: number; maskable?: boolean }> = [
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "icon-maskable-512.png", size: 512, maskable: true },
    { name: "apple-touch-icon.png", size: 180 },
  ];

  for (const t of targets) {
    const buf = Buffer.from(svg(t.size, { maskableSafeArea: t.maskable }));
    await sharp(buf).png().toFile(path.join(OUT_DIR, t.name));
    console.log("wrote", t.name);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
