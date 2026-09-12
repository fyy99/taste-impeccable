// 引擎定位与完整性检查共用于安装和只读扫描；不执行自动下载或写入。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function engineAsset() {
  const manifest = JSON.parse(fs.readFileSync(new URL('./detector/engine.json', import.meta.url), 'utf8'));
  const platform = process.platform === 'win32' ? 'windows' : process.platform;
  const asset = manifest.assets[`${platform}-${process.arch}`];
  if (!asset) throw new Error(`Unsupported engine platform: ${platform}-${process.arch}`);
  const root = process.env.TASTE_IMPECCABLE_CACHE || path.join(os.homedir(), '.cache', 'taste-impeccable');
  const filename = path.basename(new URL(asset.url).pathname);
  return { ...asset, file: path.join(root, manifest.version, asset.sha256, filename) };
}
export function verifyEngine(asset) {
  if (!fs.existsSync(asset.file)) throw new Error('Pinned detector engine is missing; run node <skill-dir>/scripts/setup-detector.mjs before the read-only review.');
  if (sha256(fs.readFileSync(asset.file)) !== asset.sha256) throw new Error('Detector engine checksum mismatch; rerun setup-detector.mjs before review.');
}
