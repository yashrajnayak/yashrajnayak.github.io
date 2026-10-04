import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
const root = process.cwd();
const config = JSON.parse(readFileSync("config.json", "utf8"));
const pages = ["index.html"];
let checked = 0;
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${page}: duplicate ids`);
  assert.equal(
    [...html.matchAll(/<h1\b/g)].length,
    1,
    `${page}: one main heading`,
  );
  assert(
    !/\/Users\/|\/var\/folders\/|file:\/\//.test(html),
    `${page}: machine-specific path`,
  );
  for (const [, attr, target] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(target)) continue;
    if (target.startsWith("#")) {
      if (target.length > 1)
        assert(
          ids.includes(target.slice(1)),
          `${page}: broken fragment ${target}`,
        );
    } else
      assert(
        existsSync(
          resolve(dirname(resolve(root, page)), target.split(/[?#]/)[0]),
        ),
        `${page}: missing ${attr} ${target}`,
      );
    checked++;
  }
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    for (const attr of ["alt", "width", "height"])
      assert(
        new RegExp(`\\b${attr}="[^"]+"`).test(tag),
        `${page}: image lacks ${attr}`,
      );
  }
}
const html = readFileSync("index.html", "utf8");
assert(html.includes(config.site.url), "Canonical domain missing");
assert(!/[↗↘]/u.test(html), "Use drawn SVG arrows to avoid emoji rendering");
assert.equal([...html.matchAll(/<video\b/g)].length, 1, "Show the highlights video only once");
const person = JSON.parse(
  html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1],
);
assert.equal(person.name, config.site.name);
assert.equal(person.worksFor.name, config.person.worksFor.name);
for (const [output, inputs] of [
  ["css/bundle.css", ["css/fonts.css", "css/atlas.css"]],
  ["js/bundle.js", ["js/atlas.js"]],
]) {
  const expected =
    inputs
      .map(
        (file) =>
          (output.startsWith("css") ? `/* ${file} */\n` : "") +
          readFileSync(file, "utf8").trim(),
      )
      .join("\n\n") + "\n";
  assert.equal(
    readFileSync(output, "utf8"),
    expected,
    `${output}: run npm run build`,
  );
}
const photos = JSON.parse(readFileSync("assets/photos/sources.json", "utf8"));
for (const photo of photos.photos)
  assert(
    existsSync(`assets/photos/${photo.file}`),
    `Missing sourced photo ${photo.file}`,
  );
for (const file of ["css/atlas.css", "css/fonts.css"]) {
  for (const [, path] of readFileSync(file, "utf8").matchAll(
    /url\(['"]?([^)'"\s]+)['"]?\)/g,
  ))
    assert(
      existsSync(resolve(dirname(resolve(root, file)), path)),
      `Missing CSS asset ${path}`,
    );
}
console.log(
  `Validated ${pages.length} pages, ${checked} local references, metadata, image attributes, ${photos.photos.length} photo sources and bundle consistency.`,
);

// Social previews must reference the actual, crawlable landscape asset.
const meta = new Map();
for (const [tag] of html.matchAll(/<meta\b[^>]*>/g)) {
  const key = tag.match(/(?:name|property)="([^"]+)"/)?.[1];
  if (!key) continue;
  assert(!meta.has(key), `Duplicate metadata: ${key}`);
  // Theme colors intentionally vary by media query.
  if (key !== 'theme-color') meta.set(key, tag.match(/content="([^"]*)"/)?.[1]);
}
const canonical = html.match(/rel="canonical" href="([^"]+)"/)[1];
assert.equal(meta.get('og:url'), canonical);
assert.equal(meta.get('twitter:url'), canonical);
assert.equal(meta.get('og:site_name'), config.site.name);
assert.equal(meta.get('twitter:card'), 'summary_large_image');
assert.equal(meta.get('description'), meta.get('og:description'));
assert.equal(meta.get('og:description'), meta.get('twitter:description'));
assert.equal(meta.get('og:image'), meta.get('twitter:image'));
assert(meta.get('og:image:alt'));
assert(meta.get('twitter:image:alt'));
const cardUrl = new URL(meta.get('og:image'));
assert.equal(cardUrl.origin, new URL(canonical).origin);
const card = readFileSync(`.${cardUrl.pathname}`);
assert.equal(card.subarray(1,4).toString(), 'PNG');
assert.equal(card.readUInt32BE(16), 1200);
assert.equal(card.readUInt32BE(20), 630);
assert.equal(meta.get('og:image:width'), '1200');
assert.equal(meta.get('og:image:height'), '630');
assert.equal(meta.get('og:image:type'), 'image/png');
const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
assert.equal(schemas.find(s=>s['@type']==='WebSite').url, canonical);
assert(readFileSync('robots.txt','utf8').includes(`Sitemap: ${canonical}sitemap.xml`));
assert(readFileSync('sitemap.xml','utf8').includes(`<loc>${canonical}</loc>`));
console.log('Validated social metadata, 1200x630 card, structured data and sitemap consistency.');
