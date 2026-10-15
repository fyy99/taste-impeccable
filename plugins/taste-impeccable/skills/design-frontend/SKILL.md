---
name: design-frontend
description: Design, implement, redesign, or materially polish expressive web frontends such as landing pages, portfolios, marketing sites, editorial pages, and brand surfaces. Use Taste as the sole design director, verify the running result at desktop and mobile sizes, then run an isolated read-only Impeccable review; scope-gate dashboards, dense data tables, multi-step product flows, code editors, native mobile UI, and realtime collaboration surfaces.
---

# Taste → Impeccable Frontend

Use one ordered workflow. Taste owns direction and implementation. Impeccable
sees only the finished artifact and returns review findings. Validation and remediation are separate transactions:
Impeccable never mutates the reviewed artifact while acting as validator, and
Taste/main owns accepted fixes in a new remediation transaction.

## Non-negotiable contract

1. Do not run Taste and Impeccable as competing design skills.
2. Do not expose Taste's rationale, self-critique, or rejected ideas to the
   Impeccable reviewers.
3. Do not start review before implementation and runtime evidence are complete.
4. Reviewer sessions are read-only and end after reporting plus workspace
   fingerprint verification. The Taste/main maker applies accepted fixes in a
   separate remediation transaction.
5. Treat detector findings as evidence, not taste law. A `slop` category alone
   is advisory.
6. Run at most two review cycles total: the first review and one re-review.
7. User requirements and the project's established design system outrank the
   vendored defaults.
8. If a request asks Taste and Impeccable to work simultaneously or compete,
   normalize it to this ordered workflow before Phase 0. Impeccable never enters
   initial design or implementation.
9. Do not load or invoke Impeccable mutation workflows such as `polish`,
   `layout`, `typeset`, `colorize`, `bolder`, or `quieter` inside a reviewer
   context. A reviewer may propose the smallest safe remedy but never executes
   it or chooses a replacement visual direction.

Tell the user that this skill is being used because it changes the design and
review sequence.

## Phase 0: establish scope and project truth

Before changing code:

1. Read repository instructions, the active implementation, routes, component
   library, tokens, fonts, assets, dependencies, and existing visual language.
2. Name the exact surface, routes, breakpoints, and states in scope. Include
   loading, empty, error, success, focus, hover, and disabled states when the
   feature can reach them.
3. Apply this scope gate:

| Classification | Examples | Action |
|---|---|---|
| `IN_SCOPE` | landing, portfolio, marketing, brand, editorial, visual redesign | Run the complete Taste → Impeccable workflow. |
| `CONDITIONAL` | ordinary product page with an established design system | Keep the project system primary; use Taste only for composition and hierarchy, then review. |
| `TASTE_OUT_OF_SCOPE` | complex dashboard, dense table, multi-step form, code editor, native mobile, realtime collaboration | Do not apply Taste's expressive defaults. If explicitly invoked, preserve the product system and run only the independent technical/UX audit; report that Taste was scope-gated. |

Do not force a redesign onto an out-of-scope surface merely because the skill
matched implicitly.

For `CONDITIONAL`, explicitly lock the existing component library and design
tokens as the primary foundation during Phase 0, before producing the Phase 1
Design Read or making any UI edit.

For `TASTE_OUT_OF_SCOPE`, skip Phases 1 and 2: use the project's normal product
UI workflow, then enter Phase 3. Keep both read-only reviewer roles, but
constrain Reviewer A to the applicable technical/UX criteria and skip expressive
style critique; Reviewer B still verifies objective evidence. Record this
technical-audit-only constraint when the scope gate is chosen, before runtime
evidence and review begin. Mark `Taste: scope-gated` in the handoff. For a task
with no user-facing interface, stop using this skill entirely.

## Phase 1: Taste design read

Read `references/taste/guide.md` before the first UI edit. In its commands,
`<skill>` means `<skill-dir>/references/taste`, the vendored builder toolkit.
Its source and scripts are builder-only; never pass them or the direction sheet's
rationale to the Impeccable reviewers. The parent phase order, role boundaries,
project constraints and two-cycle review limit override upstream defaults.

Infer the brief and inventory real subject-specific content, brand constraints,
assets and proof. Write the page's argument as claims with evidence, then deal
three researched directions using the toolkit's `scripts/draw.mjs`. Choose the
one grounded in the subject and record its seed and any justified redraw. Keep
existing palette and typography where the project fixes them. Do not use the
legacy three numeric dials: the new default uses a direction sheet.

State exactly one concise line before implementation:

`Design Read: <surface> for <audience>, <visual language>, using <project foundation>.`

Record the subject-specific idea, honest imagery plan, full copy and applicable
working interaction. Read `references/taste/references/copy.md` and load type,
colour, layout, imagery and motion references from that directory as needed.
For an existing surface, audit and lock its real behavior and design system
before selecting refinements. Do not replace established project conventions
with the upstream house style. Add interactions or media only where they serve
the task; never invent proof, quotes, customers or results.

The toolkit writes `.taste-skill/` evidence in the builder's project. These are
implementation artifacts, never reviewer actions. Verify packages and current
APIs before adding dependencies. Ask only for a material missing fact that blocks
implementation; otherwise infer and proceed.

## Phase 2: Taste implementation

Taste remains the only creative authority during implementation:

1. Preserve product behavior, copy intent, working integrations, and existing
   design tokens unless the request changes them.
2. Build the real feature and its relevant states. Do not substitute a static
   mock for required behavior.
3. Prefer existing components and packages. Add a dependency only after
   verifying the project does not already provide the capability.
4. Keep accessibility, responsive behavior, reduced motion, performance, and
   content hierarchy in the implementation—not as later decoration.
5. Do not add a theme switch, dark mode, image generation, or another product
   capability solely because an upstream reference labels it a default. Preserve
   supported themes; test both only when the project or request includes both.
   Generate imagery only when the brief needs it and the tool is available.
6. Run the repository's formatter, typecheck, tests, and production build that
   cover the changed path.

Do not ask Impeccable for mid-build direction. When uncertain, resolve against
the brief, project truth, and Taste references.

For in-scope expressive surfaces, implement the selected direction with real
content and reduced-motion fallbacks using the toolkit references. Asset search
and download (`scripts/assets.mjs`) require real source/license review; a found
image never masquerades as the client's own product. The optional base assets
are starting points, not a replacement for project tokens.

## Phase 3: inspect the running artifact

Review source code alone only when no renderable surface exists.

For in-scope expressive surfaces, the builder may run
`node <skill-dir>/references/taste/scripts/lint.mjs <source>` and
`node <skill-dir>/references/taste/scripts/inspect.mjs <url-or-html> --out <evidence-dir>`
to collect additional evidence. The inspector needs an installed supported browser;
prefer the harness browser for interactive verification. It writes screenshots,
starts a temporary local server when needed, and is never run by a reviewer.
Treat numerical style/media/motion findings as context-dependent evidence, not an
automatic severity assignment or a reason to fabricate images, add unnecessary
motion, override accessibility or redesign an established product system.
Upstream self-critique is builder preparation only: it cannot replace Phase 5
or add extra independent review cycles.

For a viewable frontend:

1. Start the real app and navigate through the changed flow.
2. Capture the target page at a representative desktop and mobile viewport.
3. Exercise the key interactive and failure states.
4. Inventory every visible element in each required page and state. Check both
   each element and its layout relationships; a collection of correct isolated
   boxes is not proof of a correct composition.
5. At every required viewport, inspect adjacent siblings and nested content
   using rendered bounding boxes. Verify source order, intended gaps,
   alignment, and non-intersection. Verify that each wrapper's rendered height
   contains its in-flow children unless overflow is explicitly designed.
   Re-run these checks with wrapped or variable-length content when the layout
   can reflow.
   Include pseudo-elements, transparent overlays, negative insets, and expanded
   tap targets when checking whether independent controls overlap.
6. For nested scroll, carousel, disclosure, or virtualized regions, exercise
   the control to both ends and prove the first and last required item are
   reachable and visible. A rendered item count alone is insufficient.
7. Inspect computed runtime appearance for native controls in pressed,
   loading, disabled, selected, and focus states. Source tokens do not prove
   that browser or platform defaults have not overridden color, opacity,
   background, alignment, or size.
   Likewise, a desired declaration in source is not layout evidence: inspect
   the cascade when resets, utility classes, shorthands, inline styles, or
   `!important` can override component spacing and geometry.
8. Check overflow, clipping, content wrapping, focus visibility, keyboard use,
   contrast, loading stability, console errors, and failed requests. Use local
   crops or element-level inspection in addition to full-page overviews when
   spacing or state styling is too small to judge reliably at board scale.
9. Record the exact commands, URLs, viewport sizes, artifact paths, and source
   fingerprint used for every capture.

Missing required runtime or screenshot evidence is not a pass. State the exact
environmental limitation instead of claiming visual verification.

Before freezing the packet, the builder runs
`node <skill-dir>/scripts/setup-detector.mjs` to prepare the pinned native detector
in the user cache and verify its SHA-256. This is an implementation-stage setup
step, never a reviewer action. If setup fails, record the concrete failure as a
detector evidence gap; do not claim a clean scan. Reviewers only use `detect.mjs`,
which never downloads or installs anything and always disables project config.

## Phase 4: freeze the review packet

Create an immutable review packet containing only:

- the original user request;
- confirmed constraints and the scope classification;
- changed file paths or diff;
- running URL when available;
- desktop and mobile screenshots plus relevant state captures;
- build, test, browser, and console evidence;
- a page/state/element coverage matrix, including sibling-gap, containment,
  overlap, endpoint-reachability, and native-state checks where applicable;
- known environmental limitations.

Exclude Taste's reasoning, self-assessment, rejected alternatives, and desired
review outcome. Also exclude detector output: Reviewer A must finish its
unanchored assessment before detector findings enter the parent synthesis.
Review the artifact, not its author's defense. The packet remains valid only
while the reviewed artifact and recorded workspace fingerprint remain
unchanged.

## Phase 5: isolated Impeccable review

Read:

- `references/impeccable/review-method.md`
- `references/impeccable/technical-audit.md`

Load rubric details only when needed:

- `references/impeccable/cognitive-load.md`
- `references/impeccable/heuristics.md`
- `references/impeccable/personas.md`

Run two fresh reviewers with no conversation history. Select the strongest
available isolation in this order:

1. Two new local Codex child sessions using the bundled launcher below. It
   invokes `codex exec --ephemeral --sandbox read-only` with approvals disabled,
   each receiving one portable TOML instruction body plus the frozen packet.
   Never use a sandbox-bypass flag. Do not invoke a bare `codex` from PATH:
   another machine may have a stale standalone CLI alongside a current app.

   Prepare separate prompt files for A and B containing the role's
   `developer_instructions`, the self-contained packet and relevant references.
   Keep prompts and reports in a temporary evidence directory outside the product
   workspace. Run each reviewer through:

   ```bash
   node <skill-dir>/scripts/review.mjs --project <project> --prompt-file <reviewer-packet.txt> --output <reviewer-report.txt>
   ```

   The launcher discovers installed app and PATH runtimes, compares their actual
   `--version` output, and tries the newest first. A custom installation can be
   selected with `--codex <executable>` or `TASTE_CODEX_BIN`; the explicit option
   limits execution to that runtime. App discovery includes current and legacy
   macOS bundle layouts; on Windows/Linux use an executable on PATH or the
   explicit option. It never installs or upgrades anything.

   Preserve the user's selected review model with `--model <model>` when one is
   explicitly specified; otherwise retain Codex's configured/default model.
   Never guess a model name from the parent session or silently substitute a
   different model/provider. On a definite compatibility error, the launcher
   tries another installed runtime with the same model and read-only policy.
   Authentication, network, quota and sandbox errors are reported, not treated
   as model incompatibility. Record the actual CLI path/version and failure.
   Exhaust installed compatible runtimes and the read-only custom-agent route
   before declaring independent review unavailable. If none works, report the
   exact gap and follow the existing degraded contract; do not claim isolation.
2. Runtime-registered custom agents only when the runtime explicitly confirms
   their effective sandbox remains read-only after applying the parent turn's
   live permission overrides. A TOML default alone is not proof.

Plugin-local TOML files are portable prompt sources, not automatically
registered Codex roles. Before launching reviewers, stop all implementation
writers and record a workspace fingerprint: repository status, the current diff
checksum, and hashes for reviewed untracked artifacts. Compare it after both
reviews even when a sandbox is enforced. Any review-time file drift invalidates
the read-only claim and fails the review.

### Reviewer A — fresh-eyes design review

Use the instructions in
`agents/impeccable_design_reviewer.toml`. Pass only the frozen packet and
applicable rubric references. This reviewer judges hierarchy, composition,
clarity, interaction, cognitive load, responsive behavior, accessibility, and
brief fit. It must not edit.

### Reviewer B — evidence review

Use the instructions in
`agents/impeccable_evidence_reviewer.toml`. Pass the frozen packet plus the
local detector target, but not Reviewer A's output. Let it inspect the running
surface and execute the bundled detector when applicable:

```bash
node <skill-dir>/scripts/detect.mjs --json --no-config <target>
```

The detector may return a non-zero exit status when it finds issues. Parse its
JSON; do not treat its exit code or any stylistic `slop` finding as an automatic
failure. Pass only local markup files or directories. For a running URL, use
the runtime's browser tools and screenshots—the bundled detector deliberately
rejects URL targets instead of pretending Puppeteer is available. Reviewer B
must not edit.

The reviewers must not see each other's work. Reviewer A's assessment must be
complete before detector findings enter the parent's synthesis.

If fresh subagents are unavailable, perform the two passes sequentially and
prefix the result:

`⚠️ DEGRADED: single-context (independent reviewer unavailable)`

This fallback also cannot return a gate stronger than
`PASS_WITH_ADVISORIES`.

If a browser is unavailable for a viewable target, also state:

`⚠️ DEGRADED: no-browser (visual runtime evidence unavailable)`

Never silently claim independent or visual review in either degraded mode.

## Phase 6: synthesize and gate

Normalize every supported finding to:

`[stable id][P0|P1|P2|P3][confidence] criterion — evidence — location/state — impact — smallest safe remedy`

Discard unsupported opinions and duplicate findings. Resolve disagreements from
the artifact and original brief, not by majority vote.

| Gate | Criteria |
|---|---|
| `FAIL` | Any supported P0/P1; critical flow failure; material brief miss; or missing evidence required by the task. |
| `PASS_WITH_ADVISORIES` | No P0/P1 and evidence is complete, but supported P2/P3 or stylistic detector advisories remain. |
| `PASS` | Evidence is complete and no supported P0-P3 finding or unresolved detector advisory remains. |

P0/P1 examples include unusable flows, crashes, severe brief violations,
unreadable content, keyboard blockers, and broken target viewports. P2 is a
material but non-blocking UX defect. P3 is optional refinement.

After assigning the gate, create an explicit adjudication record for every
finding: `ACCEPT`, `ADVISORY`, or `REJECT`, with a short evidence-based reason.
Only `ACCEPT` findings can enter remediation. Reviewer output is never an
automatic mutation command.

Do not return `PASS` when only individual element presence or dimensions were
checked. Required layout relationships must also pass, and all runtime evidence
must share the post-write workspace fingerprint. Any product write invalidates
all earlier screenshots and review packets, even when the edited selector seems
unrelated. Screenshot stability proves repeatability, not correctness.

## Phase 7: separate remediation, then verify

The Taste/main implementation agent:

1. Fixes every supported P0/P1.
2. Fixes P2 only when it is material and low-risk.
3. Does not automatically apply P3 or detector taste preferences.
4. Receives the adjudicated finding IDs, evidence, scope, original brief,
   project design system, and locked Taste direction. It does not resume either
   reviewer as an editor.
5. Preserves the chosen direction unless evidence proves it misses the brief.
   Any composition, hierarchy, brand, typography, color, motion, or information
   architecture decision remains Taste's responsibility.
6. Re-runs affected tests, build, browser flow, and screenshots after every
   product write.
7. Invalidates the old packet, records a new workspace fingerprint, and freezes
   a new packet before re-review.
8. Runs one fresh read-only re-review cycle with new reviewer contexts whenever
   remediation changes the reviewed artifact. Never reuse either first-round
   reviewer context.

Stop after the second review cycle. If a blocker remains, report it with
evidence instead of looping or hiding it.

Reserved extension point — remediation executor (disabled): a future contract
version may delegate accepted, objective, local fixes to a new bounded executor.
It must not be either reviewer, must receive only adjudicated findings and
Taste-locked invariants, must not choose design direction, and must always return
to a fresh read-only review. Enabling it requires a role-contract version bump,
SemVer change, and updated evals; upstream synchronization never enables it.

## Handoff

Lead with the delivered result and final gate. Include:

- scope, final Design Read, direction seed and any justified redraws;
- changed surfaces and states;
- build/test/runtime evidence;
- adjudicated finding IDs and P0/P1 findings fixed;
- unresolved advisories or explicit degraded-mode gaps.

Do not present `PASS` without the evidence packet required above.
