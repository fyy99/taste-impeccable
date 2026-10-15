// 用可控 CLI 响应覆盖多运行时与失败路径，避免依赖测试机的模型目录。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { availableCli, runReview, resolveReviewModel } from '../plugins/taste-impeccable/skills/design-frontend/scripts/review.mjs';

function fixture(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'taste-launcher-test-'));
  try { fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
const cli = (file, version) => ({ file, version });
const success = args => {
  fs.writeFileSync(args[args.indexOf('--output-last-message') + 1], 'review complete');
  return { status: 0, stdout: '', stderr: '' };
};
test('旧 PATH CLI 与新应用共存时选择较新运行时，去重同一二进制', () => fixture(dir => {
  const old = path.join(dir, 'old'); const app = path.join(dir, 'app');
  fs.writeFileSync(old, ''); fs.writeFileSync(app, '');
  const result = availableCli([old, app, app], file => ({ status: 0, stdout: `codex-cli ${file === old ? '0.146.0' : '0.162.0-alpha.17.2'}` }));
  assert.deepEqual(result.map(x => x.file), [app, old]);
}));
test('兼容失败后换运行时，模型、只读和禁审批契约保持一致', () => fixture(dir => {
  const calls = [];
  runReview({ project: dir, prompt: 'private packet', output: path.join(dir, 'out'), model: 'user-selected-model', candidates: [cli('first', 'v1'), cli('second', 'v2')] }, (file, args, options) => {
    calls.push({ file, args, options });
    if (file === 'first') return { status: 1, stderr: "The model is not supported when using Codex with a ChatGPT account." };
    return success(args);
  });
  assert.equal(calls.length, 2);
  for (const { args, options } of calls) {
    assert.deepEqual(args.slice(0, 6), ['-a', 'never', 'exec', '--ephemeral', '--sandbox', 'read-only']);
    assert.equal(args[args.indexOf('--model') + 1], 'user-selected-model');
    assert.equal(options.input, 'private packet');
    assert.equal(args.at(-1), '-');
    assert(!args.some(x => x.includes('bypass')));
  }
}));
test('认证错误不更换模型或盲试其它运行时', () => fixture(dir => {
  let count = 0;
  assert.throws(() => runReview({ project: dir, prompt: 'p', model: 'task-model', output: path.join(dir, 'out'), candidates: [cli('a', 'v1'), cli('b', 'v2')] }, () => {
    count++; return { status: 1, stderr: '401 Unauthorized' };
  }), /401 Unauthorized/);
  assert.equal(count, 1);
}));
test('已选任务模型保持显式传递；旧报告不能掩盖空成功', () => fixture(dir => {
  const output = path.join(dir, 'out'); fs.writeFileSync(output, 'old review');
  assert.throws(() => runReview({ project: dir, prompt: 'p', model: 'task-model', output, candidates: [cli('a', 'v1')] }, (file, args) => {
    assert.equal(args[args.indexOf('--model') + 1], 'task-model'); return { status: 0 };
  }), /without a fresh review report/);
  assert.equal(fs.readFileSync(output, 'utf8'), 'old review');
}));
test('所有运行时不兼容时保留真实原因并拒绝输出成功报告', () => fixture(dir => {
  const output = path.join(dir, 'out');
  assert.throws(() => runReview({ project: dir, prompt: 'p', model: 'task-model', output, candidates: [cli('a', 'v1')] }, () => ({ status: 1, stderr: 'Model requires a newer version of Codex' })), /requires a newer version/);
  assert(!fs.existsSync(output));
}));

const thread = '11111111-1111-4111-8111-111111111111';
function runtime(dir, turns, owner = thread) {
  const sessions = path.join(dir, 'sessions'); fs.mkdirSync(sessions, { recursive: true });
  const file = path.join(sessions, `rollout-test-${thread}.jsonl`);
  fs.writeFileSync(file, [
    { type: 'session_meta', payload: { id: owner } },
    ...turns.map(model => ({ type: 'turn_context', payload: { model } })),
  ].map(x => JSON.stringify(x)).join('\n') + '\n');
  fs.writeFileSync(path.join(dir, 'config.toml'), 'model = "different-global-model"');
  return { CODEX_HOME: dir, CODEX_THREAD_ID: thread };
}
test('默认继承当前任务最新模型，覆盖早期模型且不受全局配置影响', () => fixture(dir => {
  const env = runtime(dir, ['earlier-model', 'current-task-model']);
  assert.equal(resolveReviewModel(undefined, env), 'current-task-model');
  assert.equal(resolveReviewModel('explicit-review-model', env), 'explicit-review-model');
}));
test('不能用其它任务文件中的父历史冒充当前模型', () => fixture(dir => {
  const env = runtime(dir, ['wrong-model'], '22222222-2222-4222-8222-222222222222');
  assert.throws(() => resolveReviewModel(undefined, env), /No runtime record/);
}));
test('最新任务记录没有模型时拒绝沿用旧模型或全局设置', () => fixture(dir => {
  const env = runtime(dir, ['old-model', undefined]);
  assert.throws(() => resolveReviewModel(undefined, env), /Latest current-task turn has no model/);
}));
test('无当前任务标识时明确失败，显式模型仍可用于无持久记录的会话', () => fixture(dir => {
  assert.throws(() => resolveReviewModel(undefined, { CODEX_HOME: dir }), /identity unavailable/);
  assert.equal(resolveReviewModel('runtime-verified-model', {}), 'runtime-verified-model');
}));
