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
