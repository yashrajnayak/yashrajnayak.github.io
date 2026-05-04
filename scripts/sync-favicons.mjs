import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const checkMode = process.argv.includes('--check');
const rootDir = process.cwd();
const faviconDir = path.join(rootDir, 'assets', 'favicons');
const configPath = path.join(rootDir, 'config.json');
const indexPath = path.join(rootDir, 'index.html');
const manifestPath = path.join(rootDir, 'site.webmanifest');
const sizes = [16, 32, 48, 180, 192, 512];
const icoSizes = [16, 32, 48];

async function commandExists(command) {
  try {
    await execFileAsync('sh', ['-lc', `command -v ${command}`]);
    return true;
  } catch {
    return false;
  }
}

async function imageTool() {
  if (await commandExists('magick')) {
    return 'magick';
  }

  if (await commandExists('convert')) {
    return 'convert';
  }

  if (await commandExists('sips')) {
    return 'sips';
  }

  throw new Error('ImageMagick (`magick`/`convert`) or macOS `sips` is required to resize favicons.');
}

async function loadUsername() {
  const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
  return config.github_username || process.env.GITHUB_REPOSITORY_OWNER;
}

function authHeaders() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'portfolio-favicon-sync',
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed with ${response.status}: ${url}`);
  }

  return response.json();
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'image/*',
      'User-Agent': 'portfolio-favicon-sync',
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`Avatar download failed with ${response.status}: ${url}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function fetchAvatar(username) {
  const user = await fetchJson(`https://api.github.com/users/${encodeURIComponent(username)}`);
  const avatarUrl = new URL(user.avatar_url);
  avatarUrl.searchParams.set('s', '512');

  return fetchBuffer(avatarUrl.toString());
}

async function resizeWithTool(tool, inputPath, outputPath, size) {
  if (tool === 'sips') {
    await execFileAsync('sips', ['-s', 'format', 'png', '-z', String(size), String(size), inputPath, '--out', outputPath]);
    return;
  }

  const args = [
    inputPath,
    '-auto-orient',
    '-resize',
    `${size}x${size}^`,
    '-gravity',
    'center',
    '-extent',
    `${size}x${size}`,
    outputPath,
  ];

  await execFileAsync(tool, args);
}

function createIco(entries) {
  const headerSize = 6;
  const entrySize = 16;
  const directorySize = headerSize + entries.length * entrySize;
  const header = Buffer.alloc(directorySize);
  let offset = directorySize;

  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  entries.forEach(({ size, buffer }, index) => {
    const pos = headerSize + index * entrySize;
    header.writeUInt8(size >= 256 ? 0 : size, pos);
    header.writeUInt8(size >= 256 ? 0 : size, pos + 1);
    header.writeUInt8(0, pos + 2);
    header.writeUInt8(0, pos + 3);
    header.writeUInt16LE(1, pos + 4);
    header.writeUInt16LE(32, pos + 6);
    header.writeUInt32LE(buffer.length, pos + 8);
    header.writeUInt32LE(offset, pos + 12);
    offset += buffer.length;
  });

  return Buffer.concat([header, ...entries.map(({ buffer }) => buffer)]);
}

function versionedFaviconPath(file, version) {
  return `assets/favicons/${file}?v=${version}`;
}

async function renderIndex(version) {
  const html = await fs.readFile(indexPath, 'utf8');

  return html.replace(
    /(href="assets\/favicons\/favicon(?:-\d+x\d+)?\.(?:ico|png))(?:\?v=[^"]*)?"/g,
    `$1?v=${version}"`,
  );
}

async function renderManifest(version) {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

  manifest.icons = (manifest.icons || []).map((icon) => {
    const [src] = icon.src.split('?');
    const file = path.basename(src);

    if (!src.startsWith('assets/favicons/')) {
      return icon;
    }

    return {
      ...icon,
      src: versionedFaviconPath(file, version),
    };
  });

  return `${JSON.stringify(manifest, null, 2)}\n`;
}

async function generateFavicons(avatarBuffer) {
  const tool = await imageTool();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'favicon-sync-'));
  const sourcePath = path.join(tempDir, 'avatar-source');
  await fs.writeFile(sourcePath, avatarBuffer);

  const outputs = new Map();
  const pngBuffers = new Map();

  try {
    for (const size of sizes) {
      const outputPath = path.join(tempDir, `favicon-${size}x${size}.png`);
      await resizeWithTool(tool, sourcePath, outputPath, size);
      const buffer = await fs.readFile(outputPath);
      pngBuffers.set(size, buffer);
      outputs.set(path.join(faviconDir, `favicon-${size}x${size}.png`), buffer);
    }

    outputs.set(path.join(faviconDir, 'favicon.png'), pngBuffers.get(512));
    outputs.set(
      path.join(faviconDir, 'favicon.ico'),
      createIco(icoSizes.map((size) => ({ size, buffer: pngBuffers.get(size) }))),
    );
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }

  return outputs;
}

async function differs(filePath, nextContent) {
  try {
    const current = await fs.readFile(filePath);
    const next = Buffer.isBuffer(nextContent) ? nextContent : Buffer.from(nextContent);
    return !current.equals(next);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return true;
    }

    throw error;
  }
}

async function writeIfChanged(filePath, nextContent) {
  if (!(await differs(filePath, nextContent))) {
    return false;
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, nextContent);
  return true;
}

async function main() {
  await fs.access(configPath, constants.R_OK);
  const username = await loadUsername();

  if (!username) {
    throw new Error('No GitHub username found in config.json or GITHUB_REPOSITORY_OWNER.');
  }

  const avatarBuffer = await fetchAvatar(username);
  const version = createHash('sha256').update(avatarBuffer).digest('hex').slice(0, 10);
  const outputs = await generateFavicons(avatarBuffer);
  outputs.set(indexPath, await renderIndex(version));
  outputs.set(manifestPath, await renderManifest(version));

  const changed = [];
  for (const [filePath, content] of outputs) {
    if (await differs(filePath, content)) {
      changed.push(path.relative(rootDir, filePath));
    }
  }

  if (checkMode) {
    if (changed.length > 0) {
      console.error('Favicons are not in sync with the GitHub profile picture:');
      changed.forEach((file) => console.error(`- ${file}`));
      process.exit(1);
    }

    console.log(`Favicons are in sync with ${username}'s GitHub profile picture.`);
    return;
  }

  for (const [filePath, content] of outputs) {
    await writeIfChanged(filePath, content);
  }

  if (changed.length === 0) {
    console.log(`Favicons already match ${username}'s GitHub profile picture.`);
  } else {
    console.log(`Updated favicons from ${username}'s GitHub profile picture:`);
    changed.forEach((file) => console.log(`- ${file}`));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
