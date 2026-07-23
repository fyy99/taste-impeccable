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

Read these references before the first UI edit:

- `references/taste/direction.md`
- `references/taste/foundation.md`
- `references/taste/quality.md`
- `references/taste/preflight.md`

Infer the brief from page kind, audience, brand assets, references, content,
and accessibility or regulatory constraints. Then state exactly one concise
line:

`Design Read: <surface> for <audience>, <visual language>, using <project foundation>.`

Set the three canonical dials without inventing aliases:

- `DESIGN_VARIANCE: 1..10`
- `MOTION_INTENSITY: 1..10`
- `VISUAL_DENSITY: 1..10`

Ask one clarifying question only when two materially different directions remain
equally plausible. Otherwise infer and proceed.

Load conditional references only when they apply:

- `references/taste/motion.md` when motion is requested or
  `MOTION_INTENSITY > 3`.
- `references/taste/redesign.md` for an existing surface.
- `references/taste/design-systems.md` only when selecting or verifying an
  official design system.

The references are contextual constraints, not a command to overwrite the
project stack. Verify packages and current APIs before adding dependencies.

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

## Phase 3: inspect the running artifact

Review source code alone only when no renderable surface exists.

For a viewable frontend:

1. Start the real app and navigate through the changed flow.
2. Capture the target page at a representative desktop and mobile viewport.
3. Exercise the key interactive and failure states.
4. Check overflow, clipping, content wrapping, focus visibility, keyboard use,
   contrast, loading stability, console errors, and failed requests.
5. Record the exact commands, URLs, viewport sizes, and artifact paths.

Missing required runtime or screenshot evidence is not a pass. State the exact
environmental limitation instead of claiming visual verification.

## Phase 4: freeze the review packet

Create an immutable review packet containing only:

- the original user request;
- confirmed constraints and the scope classification;
- changed file paths or diff;
- running URL when available;
- desktop and mobile screenshots plus relevant state captures;
- build, test, browser, and console evidence;
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

1. Two new local Codex child sessions using `codex exec --ephemeral --sandbox
   read-only -C <project>`, each receiving one portable TOML instruction body
   plus the frozen packet. Never use a sandbox-bypass flag.
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

- scope and final Design Read/dials;
- changed surfaces and states;
- build/test/runtime evidence;
- adjudicated finding IDs and P0/P1 findings fixed;
- unresolved advisories or explicit degraded-mode gaps.

Do not present `PASS` without the evidence packet required above.
