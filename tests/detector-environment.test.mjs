// 验证真正派生的检测进程不继承上游登录后的云同步或 Pro 分派设置。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('检测子进程强制本地开源扫描，覆盖父环境中的启用项', { skip: process.platform === 'win32' }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'taste-detector-env-'));
  try {
    const scripts = path.join(dir, 'scripts'); fs.mkdirSync(path.join(scripts, 'detector'), { recursive: true });
    const source = fileURLToPath(new URL('../plugins/taste-impeccable/skills/design-frontend/scripts/', import.meta.url));
    for (const name of ['detect.mjs', 'engine.mjs']) fs.copyFileSync(path.join(source, name), path.join(scripts, name));
    const engine = `#!/usr/bin/env node\nconsole.log(JSON.stringify([{argv:process.argv.slice(2), values:Object.fromEntries(['DO_NOT_TRACK','IMPECCABLE_NO_TELEMETRY','IMPECCABLE_PRO','CI'].map(k=>[k,process.env[k]]))}]));\n`;
    const hash = createHash('sha256').update(engine).digest('hex');
    const asset = `impeccable-${process.platform}-${process.arch}`;
    fs.writeFileSync(path.join(scripts, 'detector/engine.json'), JSON.stringify({ version: 'test', assets: { [`${process.platform}-${process.arch}`]: { url: `https://example.test/${asset}`, sha256: hash } } }));
    const cache = path.join(dir, 'cache'); const file = path.join(cache, 'test', hash, asset); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, engine, { mode: 0o755 });
    const html = path.join(dir, 'index.html'); fs.writeFileSync(html, '<h1>Test</h1>');
    const result = spawnSync(process.execPath, [path.join(scripts, 'detect.mjs'), '--json', html], {
      cwd: dir, encoding: 'utf8', env: { ...process.env, TASTE_IMPECCABLE_CACHE: cache, DO_NOT_TRACK: '0', IMPECCABLE_NO_TELEMETRY: '0', IMPECCABLE_PRO: 'on', CI: '' },
    });
    assert.equal(result.status, 0, result.stderr);
    const [record] = JSON.parse(result.stdout);
    assert.deepEqual(record.values, { DO_NOT_TRACK: '1', IMPECCABLE_NO_TELEMETRY: '1', IMPECCABLE_PRO: 'off', CI: '1' });
    assert.deepEqual(record.argv, ['detect', '--no-config', '--json', html]);
    assert.equal(fs.readFileSync(html, 'utf8'), '<h1>Test</h1>');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
