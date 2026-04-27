import { cx, ds } from "@/lib/design-system";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "dangerSolid" | "ghost" | "outlineAccent";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  fullWidth?: boolean;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: ds.button.primaryCompact,
  secondary: ds.button.secondaryCompact,
  danger: ds.button.dangerCompact,
  dangerSolid: ds.button.dangerSolidCompact,
  ghost: ds.button.ghost,
  outlineAccent: ds.button.outlineAccentCompact,
};

export function Button({
  children,
  className = "",
  fullWidth = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(ds.button.base, fullWidth && "w-full", variantClasses[variant], className)}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}