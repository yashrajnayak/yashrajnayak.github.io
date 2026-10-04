import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
const root = process.cwd();
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
assert(html.includes("https://yashrajnayak.com/"), "Canonical domain missing");
const person = JSON.parse(
  html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1],
);
assert.equal(person.name, "Yashraj Nayak");
assert.equal(person.worksFor.name, "Databricks");
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
