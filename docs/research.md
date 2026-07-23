# Taste × Impeccable 最佳实践调研

调研快照：2026-07-23。结论用于本插件的编排和过滤规则，不等同于上游项目的官方推荐。

## 结论

最稳妥的组合不是并行调用两个“主设计师”，而是 maker-checker：

```text
范围门禁
  → Taste 独立定方向并实现
  → 构建、测试、桌面/移动浏览器证据
  → 冻结不含自我辩护的审校包
  → Impeccable 设计审校 + 证据审校（隔离、只读）
  → 仅修 P0/P1/实质性偏差
  → 重验，最多一次复审
```

Taste 是唯一创意与实现权威；Impeccable 不在前置阶段干预、不改代码、不重定方向。双审校员彼此不交换中间意见，主流程最后综合结果。这样能降低锚定、确认偏差和两个设计体系互相覆盖的风险。

角色权限按事务划分：**Impeccable reviewer 在 validation transaction 中只读**。
上游 `polish` 等 workflow 可以修改实现，但不进入 reviewer 上下文；任何写入都会
使冻结的审校对象、证据和 verdict 失效。remediation transaction 在审校裁决后
独立运行，并由 Taste/main maker 执行。

## 校验与修复的职责边界

| 证据 | 上游或业界做法 | 对本插件的决定 |
| --- | --- | --- |
| [Impeccable finish reviewer](https://github.com/pbakaus/impeccable/blob/skill-v4.0.1/skill/agents/impeccable-finish-reviewer.md) | 使用构建线程之外的新鲜视角；reviewer 不编辑，由 parent 应用修复 | reviewer 上下文只读，结束后不可续作 editor |
| [Impeccable critique](https://github.com/pbakaus/impeccable/blob/skill-v4.0.1/skill/reference/critique.md) 与 [audit](https://github.com/pbakaus/impeccable/blob/skill-v4.0.1/skill/reference/audit.md) | 隔离设计判断与 detector/browser 证据；audit 记录问题而不修复 | 设计审校和证据审校分别运行，输出结构化 findings |
| [Impeccable polish](https://github.com/pbakaus/impeccable/blob/skill-v4.0.1/skill/reference/polish.md) | 会修改代码，但要求保留既有 visual world，不能暗中重设计 | mutator 不进入 reviewer；修复在裁决后的独立事务中执行 |
| [Microsoft maker-checker](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns#maker-checker-loops) | checker 按明确标准反馈，maker 修订并重新提交；要求正式轮次、上限和回退 | Taste/main maker 修复；首审加最多一次 fresh 复审 |
| [Anthropic evaluator-optimizer](https://www.anthropic.com/engineering/building-effective-agents) | evaluator 评价并给反馈，generator 根据反馈迭代 | evaluator 与 optimizer 职责分离，审校意见不是写入命令 |
| [OpenAI Codex code review](https://learn.chatgpt.com/docs/code-review?surface=app) | dedicated reviewer 返回优先级 findings，不改变 working tree | reviewer 必须只读，finding 要有位置、证据和优先级 |
| [OpenAI Codex Security change review](https://learn.chatgpt.com/docs/security/plugin/code-changes) 与 [fix findings](https://learn.chatgpt.com/docs/security/plugin/fix-findings) | review 生成带稳定 ID、严重度、置信度、位置和 remediation 的封存结果；accepted finding 才进入独立 fix-and-verify | 审校包带指纹；主流程先 `ACCEPT/ADVISORY/REJECT`，再独立修复 |
| [AWS evaluator/refine guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns/evaluator-reflect-refine-loop-patterns.html) | 原 generator 或新的 optimizer 可吸收 evaluator 反馈，循环到通过或上限 | 受限 repair executor 使用独立角色和事务，并保持默认关闭 |

默认角色契约为：

```text
Taste 设计与实现
  → 冻结目标、证据和工作区指纹
  → Impeccable 隔离只读校验
  → 主流程裁决 findings
  → Taste/main 独立修复采纳项
  → 重取证、重新冻结、fresh re-review
```

Impeccable reviewer 可以给出“最小安全 remedy”，但不得执行。涉及构图、层级、
品牌、字体、色彩、动效或信息架构的修复继续归 Taste；纯审美分歧不能推翻已锁定
方向。任何写入都会使旧审校包失效。

受限 remediation executor 作为默认关闭的扩展槽存在。启用条件是具备支持其价值
的评测数据，并且只接收已采纳 finding ID、证据、作用域和 Taste 锁定的不变量，
只处理客观、局部问题，随后回到新的只读 reviewer。它不能复用 reviewer 上下文、
自动调用 `polish`/`layout`/`typeset` 等命令或取得设计方向权。启用属于角色契约
变更，而非普通上游同步。

## 官方依据

### OpenAI / Codex

- [GPT-5.6 model guidance](https://developers.openai.com/api/docs/guides/model-guidance?model=gpt-5.6) 建议减少重复、互相冲突的指令，只暴露相关工具，明确自主边界，并用代表性任务验证提示词；同时说明 GPT-5.6 在前端美学、布局、层级和设计判断上有提升。这支持单一公开入口和阶段化上下文，而不是全量叠加 Skills。
- [Frontend prompt guide](https://developers.openai.com/api/docs/guides/frontend-prompt) 强调沿用现有设计系统、按产品类型控制表现力、覆盖真实状态，并用 Playwright/截图验证桌面端与移动端。这直接形成“项目约束优先”和“运行证据先于审校”两条门禁。
- [Build skills](https://learn.chatgpt.com/docs/build-skills) 说明 Skill 使用渐进披露，隐式匹配由描述触发，重复 Skills 不会合并；`policy.allow_implicit_invocation: false` 仅关闭隐式调用，仍可显式调用。由此选择一个公开编排 Skill，内部参考按需加载。
- [Build plugins](https://learn.chatgpt.com/docs/build-plugins) 定义 `.codex-plugin/plugin.json`、Skills 目录和 marketplace 结构，但插件清单没有插件依赖声明。本项目因此锁定并携带经筛选的上游材料，而不是假设运行时能声明 Taste → Impeccable 依赖。
- [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents) 说明 custom agent TOML 由 `~/.codex/agents/` 或项目 `.codex/agents/` 注册，并可设置 `sandbox_mode = "read-only"`；同时，spawn 会重新应用父 turn 的 live sandbox/permission override，所以 TOML 默认值并非最终只读证明。plugin manifest 也不能自动注册这类角色。因此插件内 TOML 只作为便携 prompt source，首选 `codex exec --ephemeral --sandbox read-only` 新子会话；只有运行时能确认有效 sandbox 时才使用 custom agent，否则退化为单上下文并披露，且所有路径都用审校前后工作区指纹复核。
- [Codex code review](https://learn.chatgpt.com/docs/code-review?surface=app) 使用 dedicated reviewer，在不改变 working tree 的前提下返回按优先级排列的 findings。Codex Security 又把 [change review](https://learn.chatgpt.com/docs/security/plugin/code-changes) 和仅针对 accepted findings 的 [fix-and-verify](https://learn.chatgpt.com/docs/security/plugin/fix-findings) 分成不同入口；这直接支持“校验与修复是两个事务”。
- [Plugins](https://learn.chatgpt.com/docs/plugins) 说明安装后需在新会话中加载。README 的安装步骤据此要求新建任务。
- Codex 源码的 [plugin manifest schema](https://github.com/openai/codex/blob/4462b9deef211723b781b426f5e5d36a5777115f/codex-rs/core-plugins/src/manifest.rs#L24-L47) 未定义插件依赖；[Skill namespace](https://github.com/openai/codex/blob/4462b9deef211723b781b426f5e5d36a5777115f/codex-rs/core-skills/src/loader/namespace.rs#L10-L24) 会把插件名加入 Skill 调用名。这是 `$taste-impeccable:design-frontend` 的实现依据。

### Taste

- 官方仓库：[Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)。
- 本次调研快照为 commit [`98565e65bc3274ddf6eb0838734341714057178b`](https://github.com/Leonxlnx/taste-skill/commit/98565e65bc3274ddf6eb0838734341714057178b)；最近一次影响核心 Skill 的基线为 [`3c7017d636c3a4aad378433ea6d0cfa6c921da4a`](https://github.com/Leonxlnx/taste-skill/commit/3c7017d636c3a4aad378433ea6d0cfa6c921da4a)。上游 v2 仍以 main 迭代，没有稳定 release/tag，因此必须按 commit 锁定。
- [Taste v2 主 Skill](https://github.com/Leonxlnx/taste-skill/blob/98565e65bc3274ddf6eb0838734341714057178b/skills/taste-skill/SKILL.md) 包含 brief 推断、三个设计旋钮、设计系统映射、工程实现、动效、可访问性、暗色、反 AI 套路与预检。官方 [Guide](https://www.tasteskill.dev/guide) 的主线也是先读设计现场与旋钮，再实现和预检。
- Taste v2 明确把数据后台/表格、多步表单、代码编辑器、原生移动端和实时协作列为非主要范围，所以本插件在这些目标上先做范围门禁，而不是把 Taste 风格强加给项目。
- 上游 [progressive disclosure 讨论](https://github.com/Leonxlnx/taste-skill/issues/67) 也指出超大单文件的上下文成本；本插件按方向、基础、动效、质量、预检等主题拆分并条件加载。

### Impeccable

- 官方仓库：[pbakaus/impeccable](https://github.com/pbakaus/impeccable)。
- 本插件选择 2026-07-22 发布的稳定 Skill tag [`skill-v4.0.1`](https://github.com/pbakaus/impeccable/releases/tag/skill-v4.0.1)，其 annotated tag 解引用到 commit [`eda81f09378d32c93fec6d3cd8f1ecbf13595e15`](https://github.com/pbakaus/impeccable/commit/eda81f09378d32c93fec6d3cd8f1ecbf13595e15)。调研时 main 为 [`bdaa5a4eb9ad2f5b9ce6164a9ded049da9c00d58`](https://github.com/pbakaus/impeccable/commit/bdaa5a4eb9ad2f5b9ce6164a9ded049da9c00d58)，但生成产物持续变化，不作为稳定输入。
- [`critique`](https://github.com/pbakaus/impeccable/blob/skill-v4.0.1/skill/reference/critique.md) 要求设计评估与检测器/浏览器评估隔离，且 critic 只返回报告；无法使用子代理时必须声明 degraded。
- [`impeccable-finish-reviewer`](https://github.com/pbakaus/impeccable/blob/skill-v4.0.1/skill/agents/impeccable-finish-reviewer.md) 要求使用脱离构建上下文的“新鲜视角”、不编辑代码、由父流程决定是否修复。这正是后置独立审校契约。
- `audit` 记录问题而不修复；`polish` 和其他命令会主动修改代码。`polish` 还明确要求保持 incumbent visual world，不能把 refinement 偷换成 redesign。发行包只纳入 critique、audit、detector 和 finish-reviewer 方法，mutator 不暴露给 reviewer。

### Maker-checker / evaluator-optimizer

- [Microsoft maker-checker loop](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns#maker-checker-loops) 要求 checker 对明确验收条件做判断，maker 根据具体反馈修订并重新提交，并为循环设置上限和失败回退。
- [Anthropic evaluator-optimizer](https://www.anthropic.com/engineering/building-effective-agents) 同样把生成与评价分给不同调用，并只在存在明确标准、迭代能产生可测价值时推荐该模式。
- [AWS evaluator/refine loop](https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns/evaluator-reflect-refine-loop-patterns.html) 允许原 generator 或新的 optimizer 执行修复，但 evaluator 仍是先给 feedback 的独立阶段。这支持使用独立的受限 executor，同时不支持 reviewer 原地自批自改。
- [GitHub Copilot code review](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/use-code-review) 也把 review comment 与应用 fix 分为不同动作；变更后重新请求 review。这是工程工具中的同类实现。

## 社区实践

社区材料不是产品保证，但多处独立经验呈现一致方向：

- [Impeccable vs Taste Skill](https://viblo.asia/p/impeccable-vs-taste-skill-hai-truong-phai-chong-ai-slop-trong-vibe-coding-G24B8G2ELz3) 将 Taste 定位为方向/视觉/动效创建者，将 Impeccable 定位为 UX 审计、响应式和生产加固；也提醒 Taste 可能过度设计。
- [How to Give Coding Agents Design Taste](https://lunchpaillabs.com/blog/how-to-give-agents-design-taste) 建议先形成设计草稿，再把 Impeccable 作为批评层。
- [Taste Skill toolkit overview](https://developertoolkit.ai/en/shared-workflows/skills-ecosystem/taste-skill/) 建议先用 Taste 生成、再用 Impeccable refine，支持两者顺序使用；但它没有解决 checker 写权限或上下文隔离，所以本插件采用更严格的 maker-checker 边界。
- [LangGraph evaluator-optimizer](https://docs.langchain.com/oss/python/langgraph/workflows-agents#evaluator-optimizer) 的社区实现让 evaluator 只输出结构化 grade 与 feedback，再路由回 generator。
- [Codex 前端工作流讨论](https://www.reddit.com/r/codex/comments/1upt5ha/how_do_you_handle_frontendui_work_with_codex/) 的通行做法是先固定目标 surface/state，以现有组件为事实来源，并用桌面/移动截图闭环。
- [Design skills stacking 讨论](https://www.reddit.com/r/ClaudeCode/comments/1u8c5qi/design_skills/) 报告多个设计 Skills 叠加会有重叠并导致平庸结果；这支持明确角色而非简单合并。
- [Codex UI 成功经验讨论](https://www.reddit.com/r/codex/comments/1u7jvpj/anyone_have_genuine_success_using_codex_for_ui/) 同样强调视觉参考与截图迭代的重要性。
- [Microsoft maker-checker pattern](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns#maker-checker-loops) 建议先定义验收条件并限制循环次数；本插件据此把审校周期上限设为两次。

这些来源共同支持顺序、隔离和截图证据，但大多是方法论与经验报告，不是随机对照实验。

## 过滤决策

| 上游 | 纳入 | 排除与原因 |
| --- | --- | --- |
| Taste | v2 brief、设计旋钮、系统映射、实现约束、质量与预检 | v1/`gpt-tasteskill` 已过时；风格 preset 会覆盖 brief-first；输出、Stitch、图像生成和品牌素材链不属于本插件核心闭环 |
| Impeccable | critique、audit、detector、finish-reviewer | 顶层 Skill 也是主设计工作流；hooks 会前置干扰；`polish` 等 mutator 会修改实现；imagegen/资产能力扩大了范围 |

完整排除名：

- Taste：`taste-skill-v1`、`gpt-tasteskill`、`redesign-skill`、`soft-skill`、`minimalist-skill`、`brutalist-skill`、`output-skill`、`stitch-skill`、`imagegen-frontend-web`、`imagegen-frontend-mobile`、`brandkit`、`image-to-code-skill`。
- Impeccable：顶层 `impeccable` 主设计 Skill、hooks、imagegen/资产链，以及 `craft`、`shape`、`init`、`document`、`extract`、`live`、`polish`、`bolder`、`quieter`、`distill`、`harden`、`onboard`、`animate`、`colorize`、`typeset`、`layout`、`delight`、`overdrive`、`clarify`、`adapt`、`optimize`。

## 审校与门禁

冻结包只传事实：原始需求、已确认约束、变更路径/diff、可访问 URL、桌面/移动截图、关键状态和测试结果。它不包含 Taste 的中间推理、结论暗示或对设计的辩护。

严重度处理：

- `P0`：阻断性故障，必须修；
- `P1`：关键流程、明确需求、客观可访问性/响应式/运行错误，确认后必须修；
- `P2`：有价值但不阻断，仅在低风险且不改方向时处理；
- `P3` 与 detector 的 `slop`：建议项，不自动改。

detector 的退出码或 `slop` 标签不能单独判失败，必须由独立证据审校员确认。findings
使用稳定 ID、严重度、置信度、criterion、证据、位置/状态、影响和最小 remedy；
主流程逐项标记 `ACCEPT`、`ADVISORY` 或 `REJECT`。修复后重建、重测、重截图、
重新冻结；最多一次 fresh 复审，防止 maker-checker 无限循环和审美漂移。

上游 `audit` 曾把任意 WCAG AA violation 直接写成 P1，`heuristics` 也带有
“Fix before release / Fix if time”动作；这与本插件按可证实用户影响分级、P2/P3
保持 advisory 的统一门禁冲突。转换器 v3 会把两处表述规范到父级 P0-P3 契约，
并由生成物哈希与 validator 防止后续同步恢复冲突。

## 共存风险

Codex 不会把两个同名或相近 Skill 的规则自动合并。若用户同时安装原始 Taste、原始 Impeccable 和本插件，隐式匹配可能选择多个入口，破坏“唯一主设计师”的前提。推荐只保留本插件的公开入口；若必须共存，应显式调用 `$taste-impeccable:design-frontend`，且提示词不要再点名其他主设计 Skill。

## 升级与可复现性

`upstreams.lock.json` 记录：

- 上游 URL、ref、解析后的 commit 与调研日期；
- 允许同步的路径、明确排除清单；
- 每个生成物的 SHA-256；
- 上游许可证和本地归属文件；
- 独立于内容转换版本的 `role_contract_version`，以及默认关闭的 remediation executor 扩展点。

`scripts/sync_upstreams.py --check-updates` 只报告上游差异；发现新的 Impeccable stable tag 时，维护者先人工修改 lock 中的 `ref`。`--update` 更新允许的衍生内容、许可证原文、NOTICE pin 区块和锁文件，并设置 `pending_review=true`；脚本不会自动选择新 tag，也不会自动修改阶段顺序、严重度门禁或 reviewer 写权限。人工检查 diff、更新 SemVer/changelog 后，必须显式运行 `--accept-review` 记录日期，再执行 `--check`、GPT-5.6 Sol plan-trace 和 `scripts/validate.py`。

这种“锁定 + 可再生成 + 人工语义审查”的接口允许后续跟进 Taste v2、
Impeccable release 和 Codex plugin schema，同时避免上游更新静默改变行为。
任何开放 mutator、改变修复所有者、复审方式或 reviewer 写权限的变化都必须作为
角色契约变更审阅，并升级 `role_contract_version`。

## 未解决的证据缺口

截至调研日期，未找到针对 GPT-5.6 Sol、在相同任务集和相同预算下比较以下方案的受控 A/B：

1. 裸用 GPT-5.6 Sol；
2. 仅 Taste；
3. 仅 Impeccable；
4. Taste → 隔离 Impeccable；
5. 两者无序叠加。

因此不能声称该组合在所有项目上“已被证明最好”。当前方案是官方机制、上游契约和社区经验交叉支持的工程假设。后续应保留固定任务集、盲评截图、首轮通过率、P0/P1 数量、返工轮数与 token/时延的评测记录，用代表性任务验证每次插件升级。

Taste 和两个 Impeccable reviewer 当前都可能使用 GPT-5.6 Sol。因此“独立”只表示
上下文、权限、工具和审校事务隔离，并不表示模型统计独立或消除了同模型系统偏差。
[同模型 evaluator 实践](https://hamel.dev/blog/posts/evals-faq/#q-can-i-use-the-same-model-for-both-the-main-task-and-evaluation)
认为同模型可以承担窄范围 judge，但需要明确标准、人工标签校准和 held-out 指标；
本插件尚没有这些视觉偏好校准数据。故浏览器、构建、测试、可访问性与 detector 的
可复现证据优先，纯审美分歧保持 advisory。
