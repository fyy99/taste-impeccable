// 验证真实方向库依赖、brand keep 和源码检查的退出语义。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../plugins/taste-impeccable/skills/design-frontend/references/taste/', import.meta.url));
test('方向库能完整生成带种子的方向单并尊重既有品牌', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'taste-toolkit-'));
  try {
    const result = spawnSync(process.execPath, [path.join(root, 'scripts/draw.mjs'), '--sector', 'saas', '--brief', 'Privacy-first email', '--sections', 'features,pricing,faq,cta,footer', '--seed', '1015', '--keep', 'palette,type', '--out', dir], {
      encoding: 'utf8', cwd: dir, env: { ...process.env, TASTE_SKILL_HISTORY: path.join(dir, 'history.json') },
    });
    assert.equal(result.status, 0, result.stderr);
    const sheet = JSON.parse(fs.readFileSync(path.join(dir, 'direction.json'), 'utf8'));
    assert.equal(sheet.seed, 1015);
    assert(sheet.direction.id);
    assert.match(result.stdout, /DIRECTION SHEET/);
    assert(sheet.input.keep.includes('palette') && sheet.input.keep.includes('type'));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('源码检查真实命中已知问题，并以失败退出而非假绿', () => {
  const fixture = fileURLToPath(new URL('./fixtures/ai-slop.html', import.meta.url));
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/lint.mjs'), fixture, '--json'], { encoding: 'utf8' });
  assert.equal(result.status, 1, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert(payload.findings.some(x => x.id === 'gradient' && x.level === 'FAIL'));
});

test('应用片段方向库模块与资源齐全，保持品牌不需要切换主范围流程', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'taste-app-fragment-'));
  try {
    const kinds = JSON.parse(fs.readFileSync(path.join(root, 'library/app.json'), 'utf8')).kinds;
    const kind = Object.keys(kinds)[0];
    const result = spawnSync(process.execPath, [path.join(root, 'scripts/draw.mjs'), '--app', '--kind', kind, '--brief', 'A real email inbox fragment', '--seed', '1021', '--keep', 'palette,type', '--out', dir], {
      encoding: 'utf8', cwd: dir, env: { ...process.env, TASTE_SKILL_HISTORY: path.join(dir, 'history.json') },
    });
    assert.equal(result.status, 0, result.stderr);
    const sheet = JSON.parse(fs.readFileSync(path.join(dir, 'direction.json'), 'utf8'));
    assert.equal(sheet.kind, 'app');
    assert.equal(sheet.seed, 1021);
    for (const file of ['assets/app.css', 'assets/charts.js', 'scripts/lib/app-draw.mjs']) assert(fs.existsSync(path.join(root, file)), file);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('同类别不同宽度截图不覆盖，清理仅匹配取证工具自己的文件', async () => {
  const { screenshotLabel, isInspectionScreenshot } = await import(new URL('../plugins/taste-impeccable/skills/design-frontend/references/taste/scripts/lib/inspection-files.mjs', import.meta.url));
  const widths = [1440, 1024, 768, 390];
  const labels = widths.map(w => screenshotLabel(w, widths));
  assert.equal(new Set(labels).size, widths.length);
  assert.deepEqual(labels, ['desktop', 'tablet-1024', 'tablet-768', 'mobile']);
  assert(isInspectionScreenshot('tablet-1024-fold.jpg'));
  assert(!isInspectionScreenshot('tablet-1024-original.jpg'));
});
