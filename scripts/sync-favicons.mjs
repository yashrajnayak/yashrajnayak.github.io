import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

// A deterministic YN monogram. No remote profile image, font or rasterizer.
const rows = [
  "10001010001",
  "10001011001",
  "01010011001",
  "00100010101",
  "00100010011",
  "00100010011",
  "00100010001",
];
const background = [11, 32, 38];
const foreground = [249, 247, 244];
const check = process.argv.includes("--check");
const mark = JSON.stringify({ rows, background, foreground });
const version = createHash("sha256").update(mark).digest("hex").slice(0, 10);
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}
function png(size) {
  const pixels = Buffer.alloc((size * 3 + 1) * size);
  const cell = size / 16;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const gx = Math.floor(x / cell - 2),
        gy = Math.floor(y / cell - 4);
      const ink =
        gy >= 0 && gy < 7 && gx >= 0 && gx < 11 && rows[gy][gx] === "1";
      const color = ink ? foreground : background;
      const at = y * (size * 3 + 1) + 1 + x * 3;
      color.forEach((c, i) => {
        pixels[at + i] = c;
      });
    }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
function save(path, data) {
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (check) {
    if (!existsSync(path) || !readFileSync(path).equals(bytes))
      throw new Error(`${path} differs; run npm run sync:favicons`);
  } else writeFileSync(path, bytes);
}
mkdirSync("assets/favicons", { recursive: true });
for (const size of [16, 32, 48, 180, 192, 512])
  save(`assets/favicons/favicon-${size}x${size}.png`, png(size));
save("assets/favicons/favicon.png", png(512));
const sizes = [16, 32, 48],
  images = sizes.map(png),
  header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((image, i) => {
  const at = 6 + i * 16;
  header[at] = sizes[i];
  header[at + 1] = sizes[i];
  header.writeUInt16LE(1, at + 4);
  header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(image.length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += image.length;
});
save("assets/favicons/favicon.ico", Buffer.concat([header, ...images]));
let blocks = "";
rows.forEach((row, y) =>
  [...row].forEach((v, x) => {
    if (v === "1")
      blocks += `<rect x="${x + 2}" y="${y + 4}" width="1" height="1"/>`;
  }),
);
save(
  "assets/favicons/favicon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="#0b2026"/><g fill="#f9f7f4">${blocks}</g></svg>\n`,
);
const html = readFileSync("index.html", "utf8");
const revised = html.replace(
  /(assets\/favicons\/favicon[^"?\s]*)(?:\?v=[a-f0-9]+)?/g,
  `$1?v=${version}`,
);
save("index.html", revised);
const manifest = JSON.parse(readFileSync("site.webmanifest", "utf8"));
manifest.description =
  "Developer programs, communities and tools by Yashraj Nayak";
manifest.background_color = "#f2efeb";
manifest.theme_color = "#28191e";
manifest.icons = [192, 512].map((size) => ({
  src: `assets/favicons/favicon-${size}x${size}.png?v=${version}`,
  sizes: `${size}x${size}`,
  type: "image/png",
}));
save("site.webmanifest", JSON.stringify(manifest, null, 2) + "\n");
console.log(
  check
    ? "YN monogram favicons verified."
    : "Generated YN monogram favicons and refreshed references.",
);
