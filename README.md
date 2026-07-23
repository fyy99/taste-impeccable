# Taste Impeccable

[中文](#中文) · [English](#english)

<a id="中文"></a>

## 中文

面向 Codex / GPT-5.6 Sol 的前端设计编排插件：**Taste 负责设计方向、实现与采纳项修复，Impeccable 负责实现完成后的隔离只读校验**。两者通过阶段化角色契约协作，每个阶段只加载完成该职责所需的能力。

设计、校验与修复分别运行在独立事务中。Impeccable 根据冻结的运行证据返回结构化 findings 和最小安全修复建议；主流程完成裁决后，由 Taste/main 处理采纳项。任何产品写入都会使既有审校包失效，并要求重新取证与复审。

## 工作流

1. **范围门禁**：确认页面、关键状态、既有设计系统和验收标准；项目现有约束优先。
2. **Taste 主设计**：读取现场，设定设计强度、动效和密度，形成方向后实现。
3. **运行证据**：执行构建与测试，用浏览器验证桌面端、移动端和关键状态。
4. **冻结审校包**：只包含原始需求、约束、变更、页面地址、截图和测试结果；不传入 Taste 的解释或自我辩护。
5. **Impeccable 隔离双审校**：
   - 设计审校员以“新鲜视角”检查层级、认知负荷、交互与视觉完整性；
   - 证据审校员独立检查浏览器证据、响应式、运行错误、可访问性和规则检测结果。
6. **裁决 findings**：主流程按原始 brief、项目系统和证据接受、降级或拒绝 finding；审校意见不会自动变成改写命令。
7. **独立修复事务**：Taste/main 修复全部已确认 P0/P1，并只处理低风险、实质性的 P2；P3 不自动返工。
8. **重新冻结与复审**：任何写入都会使旧审校包失效。修复后重跑证据、重新冻结，并用新的只读 reviewer 最多复审一次。

审校结论为 `PASS`、`PASS_WITH_ADVISORIES` 或 `FAIL`。任何有证据的 P0/P1、关键流程损坏、实质性 brief 偏离或缺少必需证据都会阻断通过；P2/P3 为建议项。

## 角色分工

| 角色 | 负责 | 不负责 |
| --- | --- | --- |
| Taste/main maker | brief 推断、设计方向、构图、交互、实现，以及采纳 finding 后的修复 | 给自己的实现做最终通行裁决 |
| Impeccable Reviewer A | 以 fresh-eyes 方式审查设计、UX、认知负荷与 brief fit，提出最小 remedy | 改文件、运行 detector、另选视觉方向 |
| Impeccable Reviewer B | 核验构建、测试、浏览器、响应式、可访问性与 detector 证据 | 审美重设计、读取 Reviewer A 结论、改文件 |
| 主编排流程 | 冻结证据、合并去重、裁决严重度、控制一次修复与一次复审 | 用多数票替代证据，或让 reviewer 自批自改 |

## 能力编排

插件提供一个公开 Skill，并按阶段加载各角色所需能力，以保持单一设计权威和清晰上下文。Taste 与 Impeccable 上游中的其他入口不会进入同一工作上下文。

保留：

- Taste v2 的 brief 推断、设计旋钮、设计系统映射、实现约束、质量检查和预检；
- Impeccable 的 `critique`、`audit`、确定性检测器及“只读 finish reviewer”方法。

排除：

- Taste 的其他设计入口与风格预设：`taste-skill-v1`、`gpt-tasteskill`、`redesign-skill`、`soft-skill`、`minimalist-skill`、`brutalist-skill`；
- Taste 的输出/素材链：`output-skill`、`stitch-skill`、`imagegen-frontend-web`、`imagegen-frontend-mobile`、`brandkit`、`image-to-code-skill`；
- Impeccable 的顶层主设计流程、hooks、图像生成，以及 `craft`、`shape`、`init`、`document`、`extract`、`live` 等工作流；
- Impeccable 的所有主动改写命令，包括 `polish`、`bolder`、`quieter`、`distill`、`harden`、`onboard`、`animate`、`colorize`、`typeset`、`layout`、`delight`、`overdrive`、`clarify`、`adapt`、`optimize`。

`polish` 及其他代码改写型 Impeccable workflows 不加载到 reviewer 上下文；所有采纳项由 Taste/main 在独立修复事务中处理。

## 适用范围

完整流程适用于强调视觉表现的 Web 前端，包括落地页、作品集、营销与品牌页面、编辑内容页和消费级产品界面。

以下场景先触发范围门禁：数据密集型后台、复杂表格、多步表单、代码编辑器、原生移动端和实时协作界面。Taste v2 将这些列为非主要适用范围；插件不会强行套用其视觉语言，而会保留现有产品系统，必要时只运行技术与 UX 审校，并明确披露范围门禁结果。

如果无法创建隔离审校员，插件会继续完成同样的只读检查，但必须标记 `⚠️ DEGRADED: single-context`。这种模式不能声称具备上下文隔离。
如果可视目标无法使用浏览器验证，还必须标记 `⚠️ DEGRADED: no-browser`，不得声称
完成视觉运行态检查。

`skills/design-frontend/agents/*.toml` 是可移植的 reviewer 定义，不会被
plugin manifest 自动注册为 Codex custom agent。首选机制是两个
`codex exec --ephemeral --sandbox read-only` 子会话。custom agent 只有在运行时
能确认父 turn 权限覆盖后仍为只读时才可使用；仅写在 TOML 中不算证明。无法机械
保证只读时不创建通用可写 reviewer，而是明确退化为单上下文顺序检查，最终最高
只能是 `PASS_WITH_ADVISORIES`。所有路径都会在审校前后比较工作区状态、diff 与
文件哈希；发生任何审校期写入都必须判失败。

## 安装

```bash
codex plugin marketplace add /path/to/taste-impeccable
codex plugin add taste-impeccable@taste-impeccable
```

安装后新建 Codex 任务，再显式调用：

```text
$taste-impeccable:design-frontend 重新设计并实现这个页面，验证桌面端和移动端。
```

推荐显式调用。若已安装原始 Taste 或 Impeccable 插件，多个相似 Skill 的隐式匹配不会自动合并，可能互相竞争。请优先停用/卸载重叠入口，或始终显式指定本插件；不要同时点名原始主设计 Skill。

## 升级上游

`upstreams.lock.json` 锁定上游引用、精确 commit、纳入/排除清单、许可证和生成物哈希。更新不是自动覆盖：

```bash
python3 scripts/sync_upstreams.py --check-updates
# 若出现新的 Impeccable stable tag，先人工修改 upstreams.lock.json 中的 ref
python3 scripts/sync_upstreams.py --update
git diff
# 审阅生成内容、过滤边界、LICENSE/NOTICE 与 THIRD_PARTY_NOTICES 后：
python3 scripts/sync_upstreams.py --accept-review
python3 scripts/sync_upstreams.py --check
python3 scripts/run_plan_evals.py --run --model gpt-5.6-sol
python3 -m pip install --disable-pip-version-check -r requirements-dev.txt
python3 scripts/validate.py
```

`--update` 会同步白名单产物、许可证原文和 NOTICE pin 区块，并把锁文件标记为
`pending_review=true`；只有显式 `--accept-review` 才记录审阅日期并解除 CI 门禁。
维护者必须先人工审阅 diff，特别检查职责边界、审校只读性和过滤清单，再按 SemVer
提升 manifest 版本、更新 changelog，最后重跑绑定完整插件指纹的 plan-trace：

- `PATCH`：等价内容修正、检测器兼容或文档修正；
- `MINOR`：向后兼容的新规则、新条件参考或新证据检查；
- `MAJOR`：公开 Skill 名、调用方式、阶段顺序、门禁或审校契约发生不兼容变化。

同步脚本只搬运和校验允许的上游内容，不自动改变编排策略、开放 mutation
capabilities、放宽 reviewer 权限或选择新的 Impeccable stable tag。这是后续升级
的稳定接口。

`upstreams.lock.json` 还单独维护 `role_contract_version`，并预留默认关闭的受限
remediation executor 扩展槽。该角色只能在审校结束后接收已采纳 finding ID、证据、
作用域和 Taste 锁定的不变量；不得复用 reviewer 上下文、取得设计方向权或跳过
fresh re-review。启用扩展槽必须显式提升角色契约版本、更新 SemVer 和回归集，
上游同步不得自动开启。

`evals/cases.json` 定义正向触发、负向触发、范围门禁、执行顺序、只读审校、修复
所有权、fresh 复审和降级披露等编排回归契约。GPT-5.6 Sol plan-trace 绑定完整插件
指纹，用于验证计划顺序和角色边界；真实 UI 质量由代表性项目中的构建、浏览器
交互、截图和盲评验证。详见 [evals/README.md](evals/README.md)。

## 证据边界

官方文档和社区实践都支持“明确职责、先实现后审校、修复另开事务、截图闭环、限制迭代”的方向，但目前没有受控 A/B 基准证明本组合在所有任务上都优于单独使用 Taste、Impeccable 或 GPT-5.6 Sol。两个 reviewer 若都使用 GPT-5.6 Sol，只能称为上下文、权限和事务隔离，不能声称模型统计独立。完整调研、精确上游版本和证据缺口见 [docs/research.md](docs/research.md)。

## 许可

本项目自有代码采用 MIT；衍生的 Taste 内容遵循 MIT，衍生的 Impeccable 内容遵循 Apache-2.0 并保留 NOTICE。详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 和 `LICENSES/`。

---

<a id="english"></a>

## English

Taste Impeccable is a frontend-design orchestration plugin for Codex / GPT-5.6 Sol: **Taste owns design direction, implementation, and accepted remediation; Impeccable owns isolated read-only validation after implementation.** A phased role contract loads only the capabilities required by each stage.

Design, validation, and remediation run as separate transactions. Impeccable returns structured findings and the smallest safe remedies against a frozen runtime-evidence packet. After adjudication, Taste/main remediates accepted findings. Any product write invalidates the existing packet and requires fresh evidence and re-review.

### Workflow

1. **Scope gate:** identify the surface, states, existing design system, and acceptance criteria; project truth wins.
2. **Taste design and build:** infer the brief, set the design dials, commit to one direction, and implement it.
3. **Runtime evidence:** run the relevant build and tests; inspect desktop, mobile, and key states in a browser.
4. **Freeze the review packet:** include only the request, constraints, diff, URLs, screenshots, and test evidence—never Taste's rationale or self-defense.
5. **Isolated Impeccable review:**
   - Reviewer A evaluates hierarchy, cognitive load, interaction, visual integrity, and brief fit with fresh eyes.
   - Reviewer B independently verifies browser, responsive, runtime, accessibility, test, and detector evidence.
6. **Adjudicate findings:** the parent accepts, downgrades, or rejects findings against the brief, project system, and evidence. Review findings never become automatic mutation commands.
7. **Separate remediation:** Taste/main fixes confirmed P0/P1 findings and only material, low-risk P2 findings. P3 is never auto-applied.
8. **Refreeze and re-review:** any write invalidates the old packet. Refresh evidence, freeze a new packet, and run at most one fresh re-review.

The final gate is `PASS`, `PASS_WITH_ADVISORIES`, or `FAIL`. Any supported P0/P1, broken critical flow, material brief miss, or missing required evidence fails the gate. P2/P3 findings remain advisory.

### Role contract

| Role | Owns | Must not own |
| --- | --- | --- |
| Taste/main maker | brief inference, direction, composition, interaction, implementation, and accepted remediation | final approval of its own work |
| Impeccable Reviewer A | fresh-eyes design/UX/cognitive-load review and the smallest safe remedy | file writes, detector output, or a replacement visual direction |
| Impeccable Reviewer B | build, test, browser, responsive, accessibility, and detector evidence | aesthetic redesign, Reviewer A's output, or file writes |
| Parent orchestrator | frozen evidence, deduplication, severity adjudication, one remediation pass, and one re-review | majority voting without evidence or reviewer self-remediation |

### Capability composition

The plugin exposes exactly one public skill and loads each role's capabilities by phase, preserving a single design authority and a focused context. Other upstream Taste and Impeccable entry points do not enter the same working context.

Included:

- Taste v2 brief inference, design dials, design-system mapping, implementation constraints, quality guidance, and preflight;
- Impeccable `critique`, `audit`, the deterministic detector, and the read-only finish-reviewer method.

Excluded:

- other Taste design entry points and style presets: `taste-skill-v1`, `gpt-tasteskill`, `redesign-skill`, `soft-skill`, `minimalist-skill`, and `brutalist-skill`;
- Taste output and asset pipelines: `output-skill`, `stitch-skill`, both image-generation skills, `brandkit`, and `image-to-code-skill`;
- Impeccable's top-level design-director workflow, hooks, image generation, and workflows such as `craft`, `shape`, `init`, `document`, `extract`, and `live`;
- all Impeccable mutation commands, including `polish`, `bolder`, `quieter`, `distill`, `harden`, `onboard`, `animate`, `colorize`, `typeset`, `layout`, `delight`, `overdrive`, `clarify`, `adapt`, and `optimize`.

`polish` and other code-mutating Impeccable workflows never enter a reviewer context. Taste/main handles every accepted finding in a separate remediation transaction.

### Scope and degraded modes

The full workflow targets expressive web frontends such as landing pages, portfolios, marketing surfaces, editorial pages, and consumer interfaces.

Dense dashboards, complex tables, multi-step forms, code editors, native mobile UI, and realtime collaboration first pass through a scope gate. Taste v2 does not primarily target those surfaces, so the plugin preserves the existing product system, may run technical/UX review only, and explicitly discloses the scope-gate result.

If isolated reviewers are unavailable, the workflow performs the two read-only passes sequentially and reports `⚠️ DEGRADED: single-context`. It must not claim context isolation, and its strongest possible final gate is `PASS_WITH_ADVISORIES`. If a viewable target cannot be inspected in a browser, it reports `⚠️ DEGRADED: no-browser` and must not claim visual runtime verification.

The TOML files under `skills/design-frontend/agents/` are portable reviewer prompt sources; the plugin manifest does not register them as custom agents. The preferred implementation is two `codex exec --ephemeral --sandbox read-only` child sessions. Runtime-registered custom agents are allowed only when their effective inherited permission mode is confirmed read-only. When read-only access cannot be mechanically guaranteed, the workflow does not create a generally writable reviewer; it degrades to sequential single-context review, with `PASS_WITH_ADVISORIES` as the strongest possible gate. Every route fingerprints the workspace before and after review; any review-time product-workspace drift fails the review.

### Install

```bash
codex plugin marketplace add /path/to/taste-impeccable
codex plugin add taste-impeccable@taste-impeccable
```

Start a new Codex task after installation and invoke the skill explicitly:

```text
$taste-impeccable:design-frontend Redesign and implement this page, then verify desktop and mobile.
```

Explicit invocation is recommended. Similar skills from separately installed Taste or Impeccable plugins do not merge automatically and may compete. Disable or uninstall overlapping public entries when practical, or always name this plugin and do not name another design-director skill in the same prompt.

### Upstream upgrades

`upstreams.lock.json` pins upstream refs, exact commits, allowlists, denylists, licenses, and generated artifact hashes:

```bash
python3 scripts/sync_upstreams.py --check-updates
# If a new stable Impeccable skill tag exists, update its ref manually first.
python3 scripts/sync_upstreams.py --update
git diff
# After reviewing generated content, role boundaries, LICENSE/NOTICE, and filters:
python3 scripts/sync_upstreams.py --accept-review
python3 scripts/sync_upstreams.py --check
python3 scripts/run_plan_evals.py --run --model gpt-5.6-sol
python3 -m pip install --disable-pip-version-check -r requirements-dev.txt
python3 scripts/validate.py
```

`--update` synchronizes allowlisted artifacts, license texts, and the NOTICE pin block, then sets `pending_review=true`; only `--accept-review` records the review date and clears the CI gate. Maintainers must review the diff—especially role boundaries, reviewer read-only behavior, and filters—then apply the appropriate SemVer change, update the changelog, and rerun the plan trace bound to the complete plugin fingerprint.

Use SemVer for the public contract:

- `PATCH` for equivalent wording, detector compatibility, or documentation fixes;
- `MINOR` for backward-compatible rules, conditional references, or evidence checks;
- `MAJOR` for incompatible changes to the public skill name, invocation, phase order, gate, or reviewer contract.

The synchronizer only moves and validates allowed upstream content. It cannot change orchestration, open mutation capabilities, relax reviewer permissions, or choose a new stable Impeccable tag. This is the stable interface for upstream upgrades.

`role_contract_version` is independent of the upstream `transform_version`. The lock file reserves a disabled-by-default, bounded remediation-executor extension point. This post-review role may receive only accepted finding IDs, evidence, scope, and Taste-locked invariants. It must never reuse a reviewer context, take design authority, or skip a fresh re-review. Enabling it requires an explicit role-contract version bump, SemVer change, and updated regression suite.

`evals/cases.json` defines the orchestration regression contract for positive and negative invocation, scope gates, ordering, read-only review, remediation ownership, re-review behavior, and degraded disclosure. The GPT-5.6 Sol plan trace is bound to the complete plugin fingerprint and verifies planned ordering and role boundaries; real UI quality is verified in representative projects through builds, browser interaction, screenshots, and blind review. See [evals/README.md](evals/README.md).

### Evidence limits

Official documentation and community practice support explicit roles, implementation-before-review, separate remediation, screenshot evidence, and bounded loops. There is still no controlled A/B benchmark proving that this composition always beats Taste alone, Impeccable alone, or bare GPT-5.6 Sol. When both reviewers use GPT-5.6 Sol, “independent” means isolated context, permissions, and transactions—not statistical model independence. See [docs/research.md](docs/research.md) for sources, exact upstream pins, and open evidence gaps.

### License

Original project code is MIT licensed. Derived Taste content remains under MIT; derived Impeccable content remains under Apache-2.0 with NOTICE preserved. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and `LICENSES/`.
