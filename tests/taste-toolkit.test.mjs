// 验证真实配色依赖、门禁隔离和文案检查的退出语义。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../plugins/taste-impeccable/skills/design-frontend/references/taste/', import.meta.url));

test('配色与字体工具可正常出方案，且不会启用上游完成门禁', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'taste-toolkit-'));
  try {
    const result = spawnSync(process.execPath, [path.join(root, 'scripts/start.mjs'), 'deal', '--page', 'software', '--no-recent'], { encoding: 'utf8', cwd: dir });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /PALETTE/);
    assert.match(result.stdout, /TYPE for software/);
    assert(!fs.existsSync(path.join(dir, '.taste-skill/build.json')));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('文案检查命中测试页真实陈词，并明确失败', () => {
  const fixture = fileURLToPath(new URL('./fixtures/ai-slop.html', import.meta.url));
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/copy-lint.mjs'), fixture, '--kind', 'software', '--json'], { encoding: 'utf8' });
  assert.equal(result.status, 1, result.stderr);
  const { files } = JSON.parse(result.stdout);
  assert(files[0].findings.some(x => x.id === 'copy-slop-word' && x.sev === 'FAIL'));
});
