export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

/** 分段选择器：一组互斥选项（如 A/B 选牌、结果页签）。 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className = "",
  activeClassName,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
  size?: "sm" | "md";
  className?: string;
  /** 自定义选中态样式（如玩家色）。按 value 返回类名。 */
  activeClassName?: (value: T) => string;
}) {
  const pad = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  return (
    <div
      className={`inline-flex shrink-0 items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 ${className}`}
      role="group"
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        const activeCls = selected
          ? activeClassName?.(opt.value) ?? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-800";
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            disabled={opt.disabled}
            className={[
              "rounded-[10px] font-medium transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              pad,
              activeCls,
            ].join(" ")}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
