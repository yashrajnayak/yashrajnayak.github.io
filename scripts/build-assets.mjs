import {renderSite, renderProfile, escape} from "./render-site.mjs";
import { readFileSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { cssFiles, jsFiles, bundle } from "./asset-sources.mjs";
// Static HTML provides all essential content; bundles contain optional enhancements.
writeFileSync("css/bundle.css", bundle(cssFiles, true));
writeFileSync("js/bundle.js", bundle(jsFiles));
console.log("Built personal atlas styles and optional interactions.");

const config = JSON.parse(readFileSync('config.json','utf8'));
writeFileSync('index.html',renderSite(config));
writeFileSync('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(config.site.url)}</loc><lastmod>${escape(config.site.updated)}</lastmod></url></urlset>
`);
writeFileSync('robots.txt',`User-agent: *
Allow: /

Sitemap: ${config.site.url}sitemap.xml
`);
mkdirSync('generated',{recursive:true});
writeFileSync('generated/profile-README.md',renderProfile(config));
if(process.argv.includes('--output')) {
 const out=process.argv[process.argv.indexOf('--output')+1];
 if(!out || out==='.' || out.includes('..') || out.startsWith('/')) throw Error('Use a relative output directory');
 mkdirSync(out,{recursive:true});
 for(const dir of ['css','js']) { mkdirSync(`${out}/${dir}`,{recursive:true}); cpSync(`${dir}/bundle.${dir}`,`${out}/${dir}/bundle.${dir}`); }
 for(const file of ['index.html','assets','site.webmanifest','sitemap.xml','robots.txt','CNAME']) cpSync(file,`${out}/${file}`,{recursive:true});
}
console.log('Rendered website and profile README from config.json.');
