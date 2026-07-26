import { useMemo } from "react";
import { PlayType } from "../solver/types";
import { PLAY_TYPES, PLAY_TYPE_LABEL, PLAY_TYPE_GROUPS } from "../solver/playtype-meta";
import { RuleConfig } from "../solver/rule-config";
import { Button } from "../ui/Button";

const BASIC_TYPES: PlayType[] = ["single", "pair", "triple"];

function setTypes(config: RuleConfig, types: PlayType[], enabled: boolean): RuleConfig {
  const next = { ...config.allow };
  for (const t of types) next[t] = enabled;
  return { allow: next };
}

/** 单个牌型的开关胶囊。 */
function TypePill({
  type,
  enabled,
  disabled,
  onToggle,
}: {
  type: PlayType;
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      disabled={disabled}
      onClick={onToggle}
      className={[
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        enabled
          ? "border-emerald-600 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
          : "border-slate-300 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700",
      ].join(" ")}
    >
      {PLAY_TYPE_LABEL[type]}
    </button>
  );
}

/** 规则配置：按组展示的牌型开关，默认收起。 */
export function RuleConfigPanel({
  config,
  onChange,
  disabled,
}: {
  config: RuleConfig;
  onChange: (next: RuleConfig) => void;
  disabled?: boolean;
}) {
  const enabledCount = useMemo(() => PLAY_TYPES.filter((t) => config.allow[t]).length, [config]);

  return (
    <details className="group rounded-xl border border-slate-200 bg-slate-50/60">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <svg
            className="h-3.5 w-3.5 text-slate-400 transition-transform duration-150 group-open:rotate-90"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden
          >
            <path d="M6 3.5 11 8l-5 4.5v-9z" />
          </svg>
          规则配置
        </span>
        <span
          className={[
            "rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums",
            enabledCount === 0
              ? "border-amber-300 bg-amber-50 text-amber-700"
              : "border-slate-200 bg-white text-slate-500",
          ].join(" ")}
        >
          已启用 {enabledCount}/{PLAY_TYPES.length}
        </span>
      </summary>

      <div className="border-t border-slate-200 px-3 pb-3 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={disabled} onClick={() => onChange(setTypes(config, PLAY_TYPES, true))}>
            全选
          </Button>
          <Button
            size="sm"
            disabled={disabled}
            title="只保留 单 / 对 / 三"
            onClick={() => onChange(setTypes(setTypes(config, PLAY_TYPES, false), BASIC_TYPES, true))}
          >
            仅基础
          </Button>
          <Button size="sm" disabled={disabled} onClick={() => onChange(setTypes(config, PLAY_TYPES, false))}>
            清空
          </Button>
        </div>

        {enabledCount === 0 && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            未启用任何牌型时先手无法出牌，求解必定失败。
          </p>
        )}

        <div className="mt-3 space-y-3">
          {PLAY_TYPE_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-wrap items-center gap-2">
              <span className="w-8 shrink-0 text-xs text-slate-400">{group.title}</span>
              {group.types.map((t) => (
                <TypePill
                  key={t}
                  type={t}
                  enabled={config.allow[t]}
                  disabled={disabled}
                  onToggle={() => onChange(setTypes(config, [t], !config.allow[t]))}
                />
              ))}
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-slate-400">
          禁用牌型会改变求解规则，结果仅在当前配置下成立（如禁用炸弹会显著改变必胜判断）。
        </p>
      </div>
    </details>
  );
}
