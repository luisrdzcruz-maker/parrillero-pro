import { cx, ds } from "@/lib/design-system";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: string;
};

export function Input({
  className = "",
  error,
  id,
  label,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div>
      {label && (
        <label className={ds.input.label} htmlFor={inputId}>
          {label}
        </label>
      )}

      <input
        className={cx(ds.input.field, error && "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/10", className)}
        id={inputId}
        {...props}
      />

      {error && <p className="mt-2 text-xs font-medium text-red-300">{error}</p>}
    </div>
  );
}
