import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderSite,renderProfile,validateConfig} from './render-site.mjs';
const source=JSON.parse(readFileSync('config.json','utf8'));
test('project additions and edits flow into both surfaces',()=>{
 const c=structuredClone(source);
 c.tools.projects.push({name:'New project <test>',description:'A & B',url:'https://example.com/project',tags:'TEST'});
 const html=renderSite(c),md=renderProfile(c);
 assert(html.includes('New project &lt;test&gt;'));
 assert(html.includes('A &amp; B'));
 assert(md.includes('New project \\<test\\>'));
 assert(md.includes('https://example.com/project'));
 assert(!md.includes('TOP-REPOS'));
 assert(!md.includes('Most Starred'));
});
test('stories and career entries are extensible without code edits',()=>{
 const c=structuredClone(source);
 c.work.stories.push({...structuredClone(c.work.stories[1]),id:'new-story',title:'A new story'});
 c.about.career.push({...structuredClone(c.about.career[0]),name:'New Company',role:'New role'});
 assert(renderSite(c).includes('id="new-story"'));
 assert(renderProfile(c).includes('A new story'));
 assert(renderSite(c).includes('New role'));
});
test('rejects unsafe links, missing assets and duplicate anchors',()=>{
 for(const mutate of [c=>c.tools.projects[0].url='javascript:alert(1)',c=>c.download.path='assets/missing.pdf',c=>c.work.stories[0].id='tools']) {
  const c=structuredClone(source);mutate(c);assert.throws(()=>validateConfig(c));
 }
});
test('download can be disabled and content is available without a fetch',()=>{
 const c=structuredClone(source);c.download.enabled=false;
 assert(!renderSite(c).includes('class="profile-download"'));
 assert(!renderProfile(c).includes(c.download.label));
 assert(renderSite(c).includes(c.hero.intro));
 assert(renderSite(c).includes('id="site-data"'));
});
test('generation stays deterministic and mirrors every website project',()=>{
 assert.equal(renderSite(source),renderSite(source));
 const md=renderProfile(source);
 for(const p of source.tools.projects) {assert(md.includes(p.name));assert(md.includes(p.description));assert(md.includes(p.url));}
});
