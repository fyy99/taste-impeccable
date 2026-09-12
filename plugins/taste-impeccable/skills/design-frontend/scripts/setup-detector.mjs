#!/usr/bin/env node
// 只在实现阶段显式安装引擎；写入插件专用用户缓存，审校阶段不得执行。
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { engineAsset, sha256, verifyEngine } from './engine.mjs';

let temporary;
try {
  if (process.argv.length !== 2) throw new Error('Usage: node setup-detector.mjs');
  const asset = engineAsset();
  let installed = false;
  try { verifyEngine(asset); installed = true; } catch { /* 缺失或损坏时重新下载并核验。 */ }
  if (!installed) {
    const response = await fetch(asset.url, { signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw new Error(`Engine download failed: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (sha256(bytes) !== asset.sha256) throw new Error('Downloaded engine checksum mismatch; installation refused.');
    await fs.mkdir(path.dirname(asset.file), { recursive: true });
    temporary = `${asset.file}.${randomUUID()}.tmp`;
    await fs.writeFile(temporary, bytes, { mode: 0o755, flag: 'wx' });
    await fs.rename(temporary, asset.file);
  }
  await fs.chmod(asset.file, 0o755);
  verifyEngine(asset);
  process.stdout.write('Pinned detector engine installed and SHA-256 verified.\n');
} catch (error) {
  process.stderr.write(`Error: ${error.message}\n`);
  process.exitCode = 1;
} finally {
  if (temporary) await fs.rm(temporary, { force: true });
}
