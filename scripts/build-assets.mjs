import { readFileSync, writeFileSync } from 'node:fs';

const cssFiles = [
  'css/base.css',
  'css/components.css',
  'css/loading.css',
  'css/theme.css',
  'css/scroll-to-top.css',
  'css/print.css',
  'css/header.css',
  'css/about.css',
  'css/skills.css',
  'css/experience.css',
  'css/projects.css',
  'css/footer.css',
  'css/animations.css',
  'css/responsive.css'
];

const jsFiles = [
  'js/config-manager.js',
  'js/seo-manager.js',
  'js/theme-manager.js',
  'js/loading-manager.js',
  'js/section-manager.js',
  'js/header-manager.js',
  'js/github-projects-manager.js',
  'js/footer-manager.js',
  'js/main.js'
];

const cssBundle = cssFiles
  .map(file => `/* ${file} */\n${readFileSync(file, 'utf8').trim()}`)
  .join('\n\n');

const jsBundle = jsFiles
  .map(file => readFileSync(file, 'utf8')
    .replace(/^import .+;\n/gm, '')
    .replace(/^export class /gm, 'class ')
    .trim())
  .join('\n\n');

writeFileSync('css/bundle.css', `${cssBundle}\n`);
writeFileSync('js/bundle.js', `${jsBundle}\n`);
