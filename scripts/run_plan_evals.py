#!/usr/bin/env python3
"""运行或校验 GPT-5.6 Sol 的只读编排 plan-trace 回归。"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
RUNNER_PATH = Path(__file__).resolve()
PLUGIN_ROOT = ROOT / "plugins" / "taste-impeccable"
CASES_PATH = ROOT / "evals" / "cases.json"
SCHEMA_PATH = ROOT / "evals" / "plan-trace.schema.json"
BASELINE_PATH = ROOT / "evals" / "baselines" / "gpt-5.6-sol.json"
FAILED_RUN_PATH = ROOT / "evals" / "runs" / "last-run.json"
BASELINE_MODEL = "gpt-5.6-sol"
BASELINE_CODEX_VERSION = "codex-cli 0.145.0-alpha.30"
SAMPLES_PER_CASE = 3


class EvalError(RuntimeError):
    """可行动的评测错误。"""


def load_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise EvalError(f"无法读取 {path.relative_to(ROOT)}：{exc}") from exc
    if not isinstance(value, dict):
        raise EvalError(f"{path.relative_to(ROOT)} 顶层必须是对象")
    return value


def plugin_fingerprint(plugin_root: Path = PLUGIN_ROOT) -> str:
    digest = hashlib.sha256()
    for path in sorted(plugin_root.rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(plugin_root).as_posix()
        digest.update(relative.encode())
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def suite_fingerprint() -> str:
    digest = hashlib.sha256()
    for path in (CASES_PATH, SCHEMA_PATH, RUNNER_PATH):
        digest.update(path.name.encode())
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def validate_sample(
    case: dict[str, Any],
    result: dict[str, Any],
    sample_index: int,
    allowed_events: set[str],
    errors: list[str],
) -> None:
    case_id = case["id"]
    label = f"{case_id}[sample {sample_index}]"
    if result.get("case_id") != case_id:
        errors.append(f"{label}: case_id={result.get('case_id')} 不匹配")
    if result.get("skill_invoked") is not case["should_invoke"]:
        errors.append(
            f"{label}: skill_invoked={result.get('skill_invoked')}，"
            f"期望 {case['should_invoke']}"
        )
    if result.get("scope") != case["expected_scope"]:
        errors.append(
            f"{label}: scope={result.get('scope')}，期望 {case['expected_scope']}"
        )
    review_mode = result.get("review_mode")
    if review_mode != case["expected_review_mode"]:
        errors.append(
            f"{label}: review_mode={review_mode}，"
            f"期望 {case['expected_review_mode']}"
        )
    if not isinstance(result.get("reason"), str) or not result["reason"].strip():
        errors.append(f"{label}: reason 必须是非空字符串")

    events = result.get("events")
    if not isinstance(events, list) or not all(
        isinstance(event, str) for event in events
    ):
        errors.append(f"{label}: events 不是字符串数组")
        return
    if len(events) != len(set(events)):
        errors.append(f"{label}: events 含重复事件")
    event_set = set(events)
    unknown = event_set - allowed_events
    if unknown:
        errors.append(f"{label}: events 含 schema 外事件 {sorted(unknown)}")
    invoked_event = "design_frontend_skill_invoked" in event_set
    if invoked_event is not case["should_invoke"]:
        errors.append(
            f"{label}: design_frontend_skill_invoked 与 should_invoke 不一致"
        )
    if case["should_invoke"] and (
        not events or events[0] != "design_frontend_skill_invoked"
    ):
        errors.append(f"{label}: design_frontend_skill_invoked 必须是首事件")

    missing = set(case["required_events"]) - event_set
    forbidden = set(case["forbidden_events"]) & event_set
    if missing:
        errors.append(f"{label}: 缺少必需事件 {sorted(missing)}")
    if forbidden:
        errors.append(f"{label}: 出现禁止事件 {sorted(forbidden)}")

    positions = {event: index for index, event in enumerate(events)}
    broken_edges = [
        [before, after]
        for before, after in case["before_edges"]
        if before in positions
        and after in positions
        and positions[before] >= positions[after]
    ]
    if broken_edges:
        errors.append(
            f"{label}: 违反因果边 {broken_edges}；实际={events}"
        )

    globally_forbidden = {
        "competing_designers",
        "impeccable_as_designer",
        "impeccable_before_runtime_evidence",
        "taste_reasoning_in_review_packet",
        "impeccable_mutation",
        "p3_auto_remediation",
        "third_review_cycle",
        "reviewer_file_write",
        "unbounded_review_loop",
    }
    unsafe = event_set & globally_forbidden
    if unsafe:
        errors.append(f"{label}: 出现全局禁止事件 {sorted(unsafe)}")

    remediation_steps = [
        "taste_main_remediation",
        "runtime_evidence_refreshed",
        "review_packet_refrozen",
        "fresh_read_only_rereview",
        "rereview_gate_synthesized",
    ]
    if event_set & set(remediation_steps):
        remediation_chain = [
            "gate_synthesized",
            "accepted_findings_triaged",
            *remediation_steps,
        ]
        chain_missing = set(remediation_chain) - event_set
        if chain_missing:
            errors.append(
                f"{label}: remediation/re-review 事件必须成组，缺少 "
                f"{sorted(chain_missing)}"
            )
        else:
            chain_positions = [positions[event] for event in remediation_chain]
            if chain_positions != sorted(chain_positions):
                errors.append(
                    f"{label}: remediation/re-review 因果顺序错误；"
                    f"期望={remediation_chain} 实际={events}"
                )

    mode_events = {
        "reviewer_a_read_only",
        "reviewer_b_read_only",
        "independent_review_completed",
        "sequential_read_only_review",
        "degraded_single_context_disclosed",
        "accepted_findings_triaged",
        "taste_main_remediation",
        "runtime_evidence_refreshed",
        "review_packet_refrozen",
        "fresh_read_only_rereview",
        "rereview_gate_synthesized",
    }
    if review_mode == "sandboxed_independent":
        mode_missing = {
            "reviewer_a_read_only",
            "reviewer_b_read_only",
            "independent_review_completed",
        } - event_set
        mode_forbidden = {
            "sequential_read_only_review",
            "degraded_single_context_disclosed",
        } & event_set
        if mode_missing:
            errors.append(f"{label}: 独立审校缺少事件 {sorted(mode_missing)}")
        if mode_forbidden:
            errors.append(f"{label}: 独立审校混入降级事件 {sorted(mode_forbidden)}")
    elif review_mode == "single_context_degraded":
        mode_missing = {
            "reviewer_a_read_only",
            "reviewer_b_read_only",
            "sequential_read_only_review",
            "degraded_single_context_disclosed",
        } - event_set
        if mode_missing:
            errors.append(f"{label}: 单上下文降级缺少事件 {sorted(mode_missing)}")
        if "independent_review_completed" in event_set:
            errors.append(
                f"{label}: 单上下文降级不得声称 independent_review_completed"
            )
    elif review_mode == "not_applicable" and event_set & mode_events:
        errors.append(
            f"{label}: 不适用任务出现审校事件 {sorted(event_set & mode_events)}"
        )


def validate_results(payload: dict[str, Any]) -> None:
    cases = load_json(CASES_PATH).get("cases")
    schema = load_json(SCHEMA_PATH)
    if not isinstance(cases, list):
        raise EvalError("evals/cases.json 缺少 cases")
    allowed_values = (
        schema.get("properties", {})
        .get("events", {})
        .get("items", {})
        .get("enum")
    )
    if not isinstance(allowed_values, list):
        raise EvalError("plan-trace schema 缺少 events enum")
    allowed_events = set(allowed_values)
    if payload.get("schema_version") != 2:
        raise EvalError("baseline schema_version 必须为 2")
    if payload.get("kind") != "self-reported-plan-trace-multisample":
        raise EvalError("baseline kind 不匹配")
    if payload.get("samples_per_case") != SAMPLES_PER_CASE:
        raise EvalError(
            f"baseline 每用例必须包含 {SAMPLES_PER_CASE} 个独立样本"
        )
    if payload.get("model") != BASELINE_MODEL:
        raise EvalError(
            f"固定 baseline 必须由 {BASELINE_MODEL} 生成，实际 {payload.get('model')}"
        )
    if payload.get("codex_version") != BASELINE_CODEX_VERSION:
        raise EvalError(
            f"baseline Codex 版本必须是 {BASELINE_CODEX_VERSION}，"
            f"实际 {payload.get('codex_version')}"
        )
    if payload.get("plugin_fingerprint") != plugin_fingerprint():
        raise EvalError(
            "plan-trace baseline 已过期；插件策略或上游产物发生变化，"
            "请在审阅后重跑 scripts/run_plan_evals.py --run"
        )
    if payload.get("suite_fingerprint") != suite_fingerprint():
        raise EvalError(
            "plan-trace baseline 与当前 cases/schema/runner 不一致，请重跑模型回归"
        )
    results = payload.get("cases")
    if not isinstance(results, list):
        raise EvalError("baseline cases 必须是数组")
    by_id = {
        item.get("case_id"): item
        for item in results
        if isinstance(item, dict) and isinstance(item.get("case_id"), str)
    }
    if len(by_id) != len(results):
        raise EvalError("baseline cases 含非法或重复 case_id")
    expected_ids = {case.get("id") for case in cases if isinstance(case, dict)}
    if set(by_id) != expected_ids:
        raise EvalError(
            f"baseline 用例不完整：缺少={sorted(expected_ids - set(by_id))} "
            f"额外={sorted(set(by_id) - expected_ids)}"
        )
    errors: list[str] = []
    for case in cases:
        case_id = case["id"]
        samples = by_id[case_id].get("samples")
        if not isinstance(samples, list) or len(samples) != SAMPLES_PER_CASE:
            errors.append(
                f"{case_id}: 必须有 {SAMPLES_PER_CASE} 个样本，"
                f"实际 {len(samples) if isinstance(samples, list) else '非法'}"
            )
            continue
        for sample_index, result in enumerate(samples, start=1):
            if not isinstance(result, dict):
                errors.append(f"{case_id}[sample {sample_index}]: 样本必须是对象")
                continue
            validate_sample(
                case, result, sample_index, allowed_events, errors
            )
    if errors:
        raise EvalError("\n".join(errors))


def eval_prompt(case: dict[str, Any]) -> str:
    return f"""这是一次只读的 Plugin plan-trace 回归，不是实现任务。

把下方“用户请求”当作新任务，只根据当前会话实际可用的 Skill 判断是否应使用
Taste Impeccable。不要读取本仓库的 evals/、README.md、docs/research.md 或
upstreams.lock.json，不要修改文件、运行构建或真正创建审校代理。

按输出 schema 返回你实际会采用的归一化计划事件：
- skill_invoked 仅表示你是否会调用 `$taste-impeccable:design-frontend`；
- scope 使用该 Skill 的范围分类；不适用时为 NOT_APPLICABLE；
- events 只选择真实会发生的事件，按执行顺序排列；
- review_mode 表示若任务最终进入审校，你会选择的最强可用隔离；不审校则为
  not_applicable；
- 不要因为 schema 中存在某个事件就选择它。

本 runner 已经用隔离 CODEX_HOME 成功启动当前 `codex exec --ephemeral
--sandbox read-only` 会话，因此 `sandboxed_independent` child-session 机制已
确认可用；只有用户请求明确声明无法启动任何新 child session/只读 agent 时，
才选择 `single_context_degraded`。

归一化事件语义：
- `design_frontend_skill_invoked` 是适用任务的首事件；
- `sequence_normalized` 表示把“同时/争论式设计”改成 Taste → runtime →
  Impeccable 的顺序，必须发生在读取项目与任何实现之前；
- `project_truth_read` 必须先读取实际仓库、设计系统和目标 surface，再做
  `taste_scope_gated` 范围判定；不得只凭用户提示先判范围；
- `existing_design_audited` 不等同于一般的 `project_truth_read`：它表示对现有
  页面渲染、组件、交互状态与视觉语言做了专门审计。凡用户要求“现有页面”、
  “重做”或“改版”，都必须在 Design Read、范围门禁或技术审计约束之前选择它；
- `project_design_system_primary` 表示保留并锁定现有组件库与 tokens。对
  `CONDITIONAL` 表面，它发生在 Design Read 之前；对 `TASTE_OUT_OF_SCOPE`
  表面，只要计划保留既有产品系统，也必须选择该事件，并在技术审计约束与
  runtime evidence 之前完成；
- `technical_ux_audit_only` 表示在范围门禁时选定“仅技术/UX 审计”的约束，
  它发生在 runtime evidence 与 reviewer 执行之前；
- `desktop_mobile_evidence` 表示实际捕获完成；`runtime_evidence_frozen` 表示
  随后把运行证据冻结进审校包，不能颠倒；
- `sequential_read_only_review` 表示先选定单上下文顺序审校模式；随后记录
  workspace fingerprint，再执行 Reviewer A/B。`degraded_single_context_disclosed`
  表示两个 pass 与 `gate_synthesized` 完成后，在最终报告首行披露降级；
- Reviewer A 与 Reviewer B 的完成顺序没有要求，但两者都必须在合成前完成；
- `independent_review_completed` 只表示隔离的 Reviewer A、Reviewer B 都已
  完成；单上下文降级绝不能选择它；
- `gate_synthesized` 是首轮审校的合成门禁；
- `accepted_findings_triaged` 表示主流程已把 finding 明确标为接受、建议或拒绝；
  reviewer 报告本身不是自动改写命令；
- `taste_main_remediation` 表示 Taste/main maker 在审校事务结束后另开修复事务，
  只处理已接受项；`impeccable_mutation` 表示 reviewer 自己改写，是禁止行为；
- 修复发生后，依次使用 `runtime_evidence_refreshed`、
  `review_packet_refrozen`、`fresh_read_only_rereview` 和
  `rereview_gate_synthesized`。旧 reviewer 上下文不得复用。只要选择
  `taste_main_remediation` 到 `rereview_gate_synthesized` 中任何一个事件，就
  必须完整选择 `gate_synthesized` → `accepted_findings_triaged` → 上述整组事件，
  不得把 `review_packet_refrozen` 等事件用于首轮审校；
- `p3_auto_remediation` 表示自动修 P3，`third_review_cycle` 表示第三轮审校，
  两者都是禁止行为。只有请求明确给出首审 finding 或要求修后复审时，才选择这些
  修复与复审事件。

case_id 必须原样返回：{case['id']}

用户请求：
{case['prompt']}
"""


def run_checked(
    command: list[str],
    *,
    env: dict[str, str],
    label: str,
    timeout: int = 120,
) -> str:
    result = subprocess.run(
        command,
        cwd=ROOT,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
        timeout=timeout,
    )
    if result.returncode != 0:
        raise EvalError(f"{label} 失败（{result.returncode}）：\n{result.stdout[-4000:]}")
    return result.stdout


def install_isolated_plugin(codex: str, codex_home: Path) -> dict[str, str]:
    source_home = Path(
        os.environ.get("CODEX_HOME", str(Path.home() / ".codex"))
    ).expanduser()
    auth_source = source_home / "auth.json"
    if not auth_source.is_file():
        raise EvalError(f"缺少 Codex 认证文件：{auth_source}")
    codex_home.mkdir(parents=True, exist_ok=True)
    shutil.copy2(auth_source, codex_home / "auth.json")
    env = os.environ.copy()
    env["CODEX_HOME"] = str(codex_home)
    run_checked(
        [codex, "plugin", "marketplace", "add", str(ROOT), "--json"],
        env=env,
        label="隔离 marketplace 安装",
    )
    run_checked(
        [codex, "plugin", "add", "taste-impeccable@taste-impeccable", "--json"],
        env=env,
        label="隔离 plugin 安装",
    )
    installed_roots = []
    for manifest in codex_home.rglob(".codex-plugin/plugin.json"):
        try:
            metadata = json.loads(manifest.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if metadata.get("name") == "taste-impeccable":
            installed_roots.append(manifest.parent.parent)
    if len(installed_roots) != 1:
        raise EvalError(
            f"隔离环境应只有一个 taste-impeccable 缓存，实际 {len(installed_roots)}"
        )
    installed_fingerprint = plugin_fingerprint(installed_roots[0])
    source_fingerprint = plugin_fingerprint()
    if installed_fingerprint != source_fingerprint:
        raise EvalError(
            "隔离环境安装的 plugin 与当前工作树指纹不一致，拒绝生成无效 baseline"
        )
    print("已在隔离 CODEX_HOME 安装并核对当前工作树 plugin 指纹。", flush=True)
    return env


def run_case(
    codex: str,
    model: str,
    case: dict[str, Any],
    env: dict[str, str],
) -> dict[str, Any]:
    with tempfile.TemporaryDirectory(prefix="taste-impeccable-eval-") as temp:
        output = Path(temp) / "result.json"
        command = [
            codex,
            "exec",
            "--ephemeral",
            "--sandbox",
            "read-only",
            "--cd",
            str(ROOT),
            "--model",
            model,
            "--output-schema",
            str(SCHEMA_PATH),
            "--output-last-message",
            str(output),
            eval_prompt(case),
        ]
        result = subprocess.run(
            command,
            cwd=ROOT,
            env=env,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=False,
            timeout=600,
        )
        if result.returncode != 0:
            raise EvalError(
                f"{case['id']} Codex 运行失败（{result.returncode}）：\n"
                f"{result.stdout[-4000:]}"
            )
        try:
            value = json.loads(output.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise EvalError(
                f"{case['id']} 未产生合法结构化输出：{exc}\n"
                f"{result.stdout[-2000:]}"
            ) from exc
        if not isinstance(value, dict):
            raise EvalError(f"{case['id']} 输出顶层不是对象")
        return value


def write_run_checkpoint(
    payload: dict[str, Any],
    *,
    status: str,
    failure: dict[str, Any] | None = None,
) -> None:
    checkpoint: dict[str, Any] = {
        "checkpoint_status": status,
        "updated_at": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat(),
        "payload": payload,
    }
    if failure is not None:
        checkpoint["failure"] = failure
    FAILED_RUN_PATH.parent.mkdir(parents=True, exist_ok=True)
    FAILED_RUN_PATH.write_text(
        json.dumps(checkpoint, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def command_run(model: str) -> None:
    if model != BASELINE_MODEL:
        raise EvalError(
            f"固定 baseline 只接受 {BASELINE_MODEL}；其他模型需新增独立 baseline"
        )
    codex = shutil.which("codex")
    if not codex:
        raise EvalError("未找到 codex CLI，无法运行 plan-trace")
    cases = load_json(CASES_PATH).get("cases")
    if not isinstance(cases, list):
        raise EvalError("evals/cases.json 缺少 cases")
    with tempfile.TemporaryDirectory(prefix="taste-impeccable-codex-home-") as temp:
        env = install_isolated_plugin(codex, Path(temp))
        version = run_checked(
            [codex, "--version"],
            env=env,
            label="读取 Codex 版本",
        ).strip()
        if version != BASELINE_CODEX_VERSION:
            raise EvalError(
                f"本评测固定 {BASELINE_CODEX_VERSION}，实际 {version}；"
                "升级 Codex CLI 时先审阅行为变化、更新常量并重跑 baseline"
            )
        results = [
            {"case_id": case["id"], "samples": []}
            for case in cases
        ]
        payload = {
            "schema_version": 2,
            "kind": "self-reported-plan-trace-multisample",
            "model": model,
            "codex_version": version,
            "generated_at": dt.datetime.now(dt.UTC)
            .replace(microsecond=0)
            .isoformat(),
            "samples_per_case": SAMPLES_PER_CASE,
            "plugin_fingerprint": plugin_fingerprint(),
            "suite_fingerprint": suite_fingerprint(),
            "cases": results,
        }
        total_samples = len(cases) * SAMPLES_PER_CASE
        completed = 0
        for case, case_result in zip(cases, results, strict=True):
            for sample_index in range(1, SAMPLES_PER_CASE + 1):
                completed += 1
                print(
                    f"[{completed}/{total_samples}] {case['id']} "
                    f"sample {sample_index}/{SAMPLES_PER_CASE}",
                    flush=True,
                )
                try:
                    sample = run_case(codex, model, case, env)
                except KeyboardInterrupt:
                    write_run_checkpoint(
                        payload,
                        status="sampling_interrupted",
                        failure={
                            "case_id": case["id"],
                            "sample": sample_index,
                            "error": "KeyboardInterrupt",
                        },
                    )
                    raise
                except (EvalError, OSError, subprocess.TimeoutExpired) as exc:
                    write_run_checkpoint(
                        payload,
                        status="sampling_failed",
                        failure={
                            "case_id": case["id"],
                            "sample": sample_index,
                            "error": str(exc),
                        },
                    )
                    raise EvalError(
                        f"{exc}\n已完成样本与失败位置已保存到 "
                        f"{FAILED_RUN_PATH.relative_to(ROOT)}"
                    ) from exc
                case_result["samples"].append(sample)
                write_run_checkpoint(payload, status="in_progress")
    try:
        validate_results(payload)
    except EvalError as exc:
        write_run_checkpoint(payload, status="validation_failed")
        raise EvalError(
            f"{exc}\n完整失败样本已保存到 {FAILED_RUN_PATH.relative_to(ROOT)}"
        ) from exc
    if FAILED_RUN_PATH.is_file():
        FAILED_RUN_PATH.unlink()
    BASELINE_PATH.parent.mkdir(parents=True, exist_ok=True)
    BASELINE_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"plan-trace 通过并写入 {BASELINE_PATH.relative_to(ROOT)}")


def command_check() -> None:
    validate_results(load_json(BASELINE_PATH))
    print("plan-trace baseline 通过，且与当前插件指纹一致。")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--run", action="store_true", help="在新只读 Codex 会话中重跑全部用例")
    mode.add_argument("--check", action="store_true", help="离线校验已提交 baseline")
    parser.add_argument("--model", default="gpt-5.6-sol", help="评测模型")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.run:
            command_run(args.model)
        else:
            command_check()
        return 0
    except (EvalError, OSError, subprocess.TimeoutExpired) as exc:
        print(f"评测失败：{exc}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print(
            f"评测已中断；已完成样本与中断位置保存在 "
            f"{FAILED_RUN_PATH.relative_to(ROOT)}",
            file=sys.stderr,
        )
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
