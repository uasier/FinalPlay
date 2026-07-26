import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "subtle" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 " +
    "disabled:hover:bg-emerald-600",
  subtle:
    "bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 active:bg-slate-100 " +
    "disabled:hover:bg-white",
  ghost: "text-slate-600 hover:bg-slate-200/60 active:bg-slate-200",
};

const SIZE: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs rounded-lg gap-1",
  md: "px-3.5 py-2 text-sm rounded-lg gap-1.5",
  lg: "px-5 py-2.5 text-sm font-semibold rounded-xl gap-2",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "subtle", size = "md", className = "", type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={[
        "inline-flex items-center justify-center font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-1",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANT[variant],
        SIZE[size],
        className,
      ].join(" ")}
      {...rest}
    />
  );
});
