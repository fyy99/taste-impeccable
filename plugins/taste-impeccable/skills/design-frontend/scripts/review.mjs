#!/usr/bin/env node
// 在已安装的运行时中选择较新的 CLI；不安装 CLI、不替换模型、不放宽只读权限。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function discoverCli(env = process.env) {
  const candidates = [];
  if (env.TASTE_CODEX_BIN) candidates.push(env.TASTE_CODEX_BIN);
  for (const root of ['/Applications', path.join(os.homedir(), 'Applications')]) {
    for (const app of ['ChatGPT.app', 'Codex.app']) {
      for (const relative of ['codex-cli/bin/codex', 'codex']) {
        candidates.push(path.join(root, app, 'Contents/Resources', relative));
      }
    }
  }
  // 显式应用路径适用于自定义安装位置、Windows 或 Linux。
  if (env.CODEX_CLI_PATH) candidates.push(env.CODEX_CLI_PATH);
  for (const dir of (env.PATH || '').split(path.delimiter).filter(Boolean)) {
    candidates.push(path.join(dir, process.platform === 'win32' ? 'codex.exe' : 'codex'));
  }
  return candidates;
}

export function availableCli(paths, execute = spawnSync) {
  const seen = new Set();
  const candidates = [];
  for (const file of paths) {
    let real;
    try { real = fs.realpathSync(file); } catch { continue; }
    if (seen.has(real)) continue;
    seen.add(real);
    const result = execute(file, ['--version'], { encoding: 'utf8', timeout: 5000 });
    const match = result.stdout?.match(/codex-cli (\d+)\.(\d+)\.(\d+)(?:-alpha\.(\d+)(?:\.(\d+))?)?/);
    if (result.status !== 0 || !match) continue;
    candidates.push({ file, version: match[0], order: match.slice(1).map((v, i) => v === undefined ? (i === 3 ? Number.MAX_SAFE_INTEGER : 0) : Number(v)) });
  }
  return candidates.sort((a, b) => {
    for (let i = 0; i < a.order.length; i++) if (a.order[i] !== b.order[i]) return b.order[i] - a.order[i];
    return 0;
  });
}

export function runReview({ project, prompt, output, model, candidates }, execute = spawnSync) {
  if (!candidates.length) throw new Error('No usable Codex CLI found. Install a compatible CLI or set TASTE_CODEX_BIN to its executable.');
  for (const [index, cli] of candidates.slice(0, 4).entries()) {
    // 每次尝试隔离结果文件，拒绝旧报告冒充此次成功输出。
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'taste-review-'));
    const report = path.join(temp, 'report.txt');
    try {
      const args = ['-a', 'never', 'exec', '--ephemeral', '--sandbox', 'read-only', '-C', project, '--output-last-message', report];
      if (model) args.push('--model', model);
      args.push('-');
      process.stderr.write(`Reviewer runtime: ${cli.file} (${cli.version}); model: ${model || 'Codex configuration/default'}\n`);
      const result = execute(cli.file, args, { input: prompt, encoding: 'utf8', timeout: 600000, maxBuffer: 16 * 1024 * 1024 });
      const logs = `${result.stdout || ''}\n${result.stderr || ''}`;
      if (!result.error && result.status === 0) {
        if (!fs.existsSync(report) || !fs.readFileSync(report, 'utf8').trim()) throw new Error('CLI returned success without a fresh review report.');
        const content = fs.readFileSync(report);
        fs.writeFileSync(output, content);
        return { cli: cli.file, version: cli.version };
      }
      const compatibility = /requires a newer version of codex|model[^\n]*(?:not supported|unsupported|not found)|unknown (?:option|argument).*ephemeral/i.test(logs);
      // 只对明确的版本/模型不兼容尝试另一个现有运行时；认证、网络、限流不反复重试。
      if (!compatibility || index === Math.min(candidates.length, 4) - 1) {
        throw new Error(`${cli.version}: ${result.error?.message || `exit ${result.status}`}\n${logs.slice(-6000)}`);
      }
      process.stderr.write(`CLI compatibility failure; trying the next installed runtime with the same model and read-only policy.\n${logs.slice(-2000)}\n`);
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  }
}

function main() {
  const options = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const flag = process.argv[i];
    if (!['--project', '--prompt-file', '--output', '--model', '--codex'].includes(flag) || !process.argv[i + 1]) throw new Error(`Unknown or incomplete option: ${flag}`);
    if (options[flag]) throw new Error(`Repeated option: ${flag}`);
    options[flag] = process.argv[i + 1];
  }
  for (const flag of ['--project', '--prompt-file', '--output']) if (!options[flag]) throw new Error(`Required: ${flag}`);
  const project = fs.realpathSync(options['--project']);
  const output = path.resolve(options['--output']);
  const relative = path.relative(project, output);
  if (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative)) throw new Error('Review output must be outside the product workspace; use a temporary evidence directory.');
  const paths = options['--codex'] ? [options['--codex']] : discoverCli();
  runReview({ project, output, prompt: fs.readFileSync(options['--prompt-file'], 'utf8'), model: options['--model'], candidates: availableCli(paths) });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { process.stderr.write(`Review launch failed: ${error.message}\n`); process.exitCode = 1; }
}
