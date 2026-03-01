import { useEffect, useMemo, useRef } from "react";
import { PlayType } from "../solver/types";
import { PLAY_TYPES, PLAY_TYPE_LABEL } from "../solver/playtype-meta";
import { RuleConfig } from "../solver/rule-config";

type ToggleDef = {
  id: string;
  label: string;
  types: PlayType[];
  hint?: string;
};

const TOGGLES: ToggleDef[] = [
  { id: "single", label: "单", types: ["single"] },
  { id: "pair", label: "对", types: ["pair"] },
  { id: "triple", label: "三", types: ["triple"] },
  { id: "triple_single", label: "三带一", types: ["triple_single"] },
  { id: "triple_pair", label: "三带二", types: ["triple_pair"] },
  { id: "straight", label: "顺子", types: ["straight"] },
  { id: "straight_pairs", label: "连对", types: ["straight_pairs"] },
  {
    id: "airplane_all",
    label: "飞机（含带翅膀）",
    types: ["airplane", "airplane_single", "airplane_pair"],
    hint: "飞机 / 飞机带单 / 飞机带对"
  },
  { id: "four_two", label: "四带二", types: ["four_two"] },
  { id: "four_two_pairs", label: "四带两对", types: ["four_two_pairs"] },
  { id: "bomb", label: "炸弹", types: ["bomb"] },
  { id: "rocket", label: "王炸", types: ["rocket"] }
];

const BASIC_TYPES: PlayType[] = ["single", "pair", "triple"];

function triStateFor(types: PlayType[], config: RuleConfig): "all" | "none" | "some" {
  let enabled = 0;
  for (const t of types) enabled += config.allow[t] ? 1 : 0;
  if (enabled === 0) return "none";
  if (enabled === types.length) return "all";
  return "some";
}

function TriCheckbox({
  state,
  label,
  hint,
  disabled,
  onToggle
}: {
  state: "all" | "none" | "some";
  label: string;
  hint?: string;
  disabled?: boolean;
  onToggle: (checked: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.indeterminate = state === "some";
  }, [state]);

  return (
    <label className="flex items-start gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-sm transition hover:bg-white/5">
      <input
        ref={ref}
        type="checkbox"
        className="mt-0.5 h-4 w-4 accent-base-cta"
        checked={state === "all"}
        onChange={(e) => onToggle(e.currentTarget.checked)}
        disabled={disabled}
      />
      <span className="min-w-0">
        <span className="block text-slate-100">{label}</span>
        {hint ? <span className="block text-xs text-slate-400">{hint}</span> : null}
      </span>
    </label>
  );
}

function setTypes(config: RuleConfig, types: PlayType[], enabled: boolean): RuleConfig {
  const next = { ...config.allow };
  for (const t of types) next[t] = enabled;
  return { allow: next };
}

export function RuleConfigPanel({
  config,
  onChange,
  disabled
}: {
  config: RuleConfig;
  onChange: (next: RuleConfig) => void;
  disabled?: boolean;
}) {
  const enabledCount = useMemo(() => PLAY_TYPES.filter((t) => config.allow[t]).length, [config]);

  return (
    <details className="mt-4 rounded-xl border border-white/10 bg-black/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-cta/60">
        <span className="font-display tracking-wide">规则配置</span>
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-300">
          已启用 {enabledCount}/{PLAY_TYPES.length}
        </span>
      </summary>
      <div className="border-t border-white/10 px-3 pb-3 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onChange(setTypes(config, PLAY_TYPES, true))}
            disabled={disabled}
          >
            全选
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onChange(setTypes(config, PLAY_TYPES, false))}
            disabled={disabled}
          >
            清空
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() =>
              onChange(
                setTypes(
                  setTypes(config, PLAY_TYPES, false),
                  BASIC_TYPES,
                  true,
                ),
              )
            }
            disabled={disabled}
            title="只保留 单/对/三"
          >
            仅基础
          </button>
        </div>

        {enabledCount === 0 ? (
          <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 p-2 text-xs text-amber-100">
            当前未启用任何牌型，先手将无法出牌，求解必定失败。
          </div>
        ) : null}

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TOGGLES.map((t) => {
            const state = triStateFor(t.types, config);
            return (
              <TriCheckbox
                key={t.id}
                state={state}
                label={t.label}
                hint={t.hint}
                disabled={disabled}
                onToggle={(checked) => onChange(setTypes(config, t.types, checked))}
              />
            );
          })}
        </div>

        <div className="mt-3 text-xs text-slate-400">
          说明：禁用某些牌型会改变求解规则；求解结果仅在当前配置下成立。
          <span className="ml-1 text-slate-500">
            （例如禁用炸弹/王炸会显著改变必胜判断）
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          当前启用：{PLAY_TYPES.filter((t) => config.allow[t]).map((t) => PLAY_TYPE_LABEL[t]).join(" / ") || "无"}
        </div>
      </div>
    </details>
  );
}
