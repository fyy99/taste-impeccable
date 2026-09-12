#!/usr/bin/env node
// 本项目只读适配器：不下载、不安装、不读取项目配置，只调用固定引擎的 detect。
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { engineAsset, verifyEngine } from './engine.mjs';

function fail(message) { throw new Error(message); }
const flags = new Set(['--json', '--quiet', '--no-config', '--no-inline-ignores', '--no-design-system', '--no-advisory', '--help']);
const extensions = new Set(['.html', '.htm', '.css', '.scss', '.sass', '.less', '.jsx', '.tsx', '.js', '.ts', '.mjs', '.mts', '.cjs', '.cts', '.vue', '.svelte', '.astro']);
const skipped = new Set(['node_modules', 'dist', 'build', '__pycache__']);
const hiddenSources = new Set(['.vitepress', '.vuepress', '.storybook']);
const scannable = file => extensions.has(path.extname(file).toLowerCase()) || file.toLowerCase().endsWith('.blade.php');
function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory() && !skipped.has(entry.name) && (!entry.name.startsWith('.') || hiddenSources.has(entry.name))) files.push(...walk(file));
    else if (entry.isFile() && scannable(file)) files.push(file);
  }
  return files;
}
try {
  const args = process.argv.slice(2);
  for (const arg of args) if (arg.startsWith('-') && !flags.has(arg)) fail(`unknown option: ${arg}`);
  if (args.includes('--help')) {
    process.stdout.write('Usage: node detect.mjs [--json] [--quiet] [--no-config] [--no-advisory] <local-file-or-directory...>\nConfiguration and inline ignores are always disabled. Install the pinned engine with setup-detector.mjs before review.\n');
  } else {
    const targets = args.filter(arg => !arg.startsWith('-'));
    if (!targets.length) fail('an explicit local file or directory target is required; stdin/hook input is not bundled.');
    const files = [];
    for (const target of targets) {
      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(target)) fail('URL scanning is not bundled; use browser tools for runtime evidence.');
      const resolved = path.resolve(target);
      let stat;
      try { stat = fs.statSync(resolved); } catch { fail(`cannot access ${target}`); }
      if (stat.isDirectory()) {
        const found = walk(resolved);
        if (!found.length) fail(`no scannable frontend files: ${target}`);
        files.push(...found);
      } else if (stat.isFile()) {
        if (!scannable(resolved)) fail(`unsupported frontend file type: ${target}`);
        files.push(resolved);
      } else fail(`unsupported target type: ${target}`);
    }
    const asset = engineAsset();
    verifyEngine(asset);
    const result = spawnSync(asset.file, ['detect', '--no-config', ...args.filter(arg => flags.has(arg)), ...new Set(files)], {
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    if (result.error) fail(result.error.message);
    if (result.signal) fail(`engine terminated by ${result.signal}`);
    process.exitCode = result.status ?? 1;
  }
} catch (error) {
  process.stderr.write(`Error: ${error.message}\n`);
  process.exitCode = 1;
}
