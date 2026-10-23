import { readFileSync } from "node:fs";

const lenis = "assets/vendor/lenis/1.3.27";
export const cssFiles = [`${lenis}/lenis.css`, "css/fonts.css", "css/atlas.css"];
export const jsFiles = [`${lenis}/lenis.min.js`, "js/smooth-scroll.js", "js/atlas.js"];

export function bundle(files, css = false) {
  return files.map((file) => {
    // The upstream map describes its standalone file, not our combined bundle.
    const content = readFileSync(file, "utf8").replace(/^\/\/# sourceMappingURL=.*$/gm, "").trim();
    return (css ? `/* ${file} */\n` : "") + content;
  }).join("\n\n") + "\n";
}
