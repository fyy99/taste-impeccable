# 升级回归集

`cases.json` 是插件编排行为的稳定测试接口，不是美学得分榜。每次上游同步、
编排规则修改或模型升级后，用同一模型配置和同一测试仓库运行这些提示，保存完整
trace、截图、门禁结果、token 与耗时，再比较：

- 是否只触发 `$taste-impeccable:design-frontend`；
- 是否正确做范围门禁；
- Taste 是否在首次 UI 修改前完成 Design Read；
- Impeccable 是否只在实现与运行证据完成后启动；
- reviewer 是否隔离且没有写文件；
- P0/P1 是否阻断，P2/P3 是否保持 advisory；
- 首审 finding 是否先裁决，再由 Taste/main 在独立修复事务中处理；
- 修复后是否重取证、重新冻结并使用 fresh read-only reviewer；
- 是否禁止 reviewer 自己改写、P3 自动返工和第三轮审校；
- 缺少 subagent 或浏览器时是否输出对应 `DEGRADED` 标记。

`required_events` 和 `forbidden_events` 是可机器检查的事件集合；
`before_edges` 只表达必须成立的因果先后关系。它不会把 Reviewer A/B 这类彼此
独立的事件强行排成全序，从而避免模型用等价计划顺序自报时产生假回归。建议后续
评测工具继续把 Codex trace 归一化为这些事件，而不是匹配自然语言措辞。视觉质量
仍需对匿名截图做盲评，不能从 detector 命中数反推。

本仓库提供可直接重跑的只读 plan-trace：

```bash
python3 scripts/run_plan_evals.py --run --model gpt-5.6-sol
python3 scripts/run_plan_evals.py --check
```

每个用例都在新的 `codex exec --ephemeral --sandbox read-only` 会话中运行。
每个用例固定运行 3 个独立样本，全部样本都必须满足必需事件、禁止事件和因果边；
失败运行的完整样本保存在忽略提交的 `evals/runs/last-run.json`，避免只留下某次
偶然通过的结果。baseline 记录全部 24 个样本、模型、Codex 版本和完整插件指纹；
suite 指纹同时覆盖 cases、输出 schema 和 runner 自身，所以 prompt、采样、隔离
安装或校验逻辑变化也会使旧 baseline 失效。runner 还固定受支持的 Codex CLI
精确版本；升级 CLI 时必须先修改该常量并重跑。Skill、reviewer、引用、detector、
manifest、CLI 或评测器任一相关内容变化都要求重新跑模型回归。

这仍是模型“计划事件”的自报告，不等于真实 UI 执行 trace。CI 只验证已提交
baseline 未过期且满足门禁，不持有模型凭证，也不会假装在线重跑。发布前仍需在
代表性前端仓库执行真实构建、浏览器交互、截图盲评和 reviewer 文件指纹检查。

新增或删除用例属于插件行为变更；修改既有用例的验收条件时，应在 PR 中解释原因。
不要为了让新版本通过而静默放宽门禁。
