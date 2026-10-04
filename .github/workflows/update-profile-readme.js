#!/usr/bin/env node
// Backward-compatible CLI; content and rendering live with the website.
(async () => {
 const fs = require('fs');
 const path = require('path');
 const {renderProfile} = await import('../../scripts/render-site.mjs');
 const config = JSON.parse(fs.readFileSync('config.json','utf8'));
 const output = process.argv[2] || 'profile-repo/README.md';
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,renderProfile(config));
 console.log('Profile README rendered from website configuration.');
})().catch(error=>{console.error(error);process.exitCode=1;});
