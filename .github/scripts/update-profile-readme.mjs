import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const start = '<!-- TOP-REPOS:START -->';
const end = '<!-- TOP-REPOS:END -->';
const generatedPath = resolve(process.argv[2] || 'dist/profile-readme.md');
const profilePath = resolve(process.argv[3] || 'profile-repo/README.md');
const generated = readFileSync(generatedPath, 'utf8');
const current = readFileSync(profilePath, 'utf8');

function markerBlock(markdown) {
  const first = markdown.indexOf(start);
  const last = markdown.indexOf(end);
  if (first === -1 || last === -1 || last < first) return null;
  return markdown.slice(first, last + end.length);
}

const existingFeed = markerBlock(current);
const generatedFeed = markerBlock(generated);
if (!generatedFeed) throw new Error('Generated profile README is missing repository feed markers.');
const next = existingFeed ? generated.replace(generatedFeed, existingFeed) : generated;
writeFileSync(profilePath, next);
console.log(`Updated ${profilePath} from the portfolio schema${existingFeed ? ' and preserved the existing repository feed' : ''}.`);
