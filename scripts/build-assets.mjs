import { readFileSync, writeFileSync } from "node:fs";
// Static HTML provides all essential content; bundles contain optional enhancements.
const cssFiles = ["css/fonts.css", "css/atlas.css"];
const jsFiles = ["js/atlas.js"];
writeFileSync(
  "css/bundle.css",
  cssFiles
    .map((file) => `/* ${file} */\n${readFileSync(file, "utf8").trim()}`)
    .join("\n\n") + "\n",
);
writeFileSync(
  "js/bundle.js",
  jsFiles.map((file) => readFileSync(file, "utf8").trim()).join("\n\n") + "\n",
);
console.log("Built personal atlas styles and optional interactions.");
