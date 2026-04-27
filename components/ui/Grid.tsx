import { cx, ds } from "@/lib/design-system";
import type { HTMLAttributes, ReactNode } from "react";

type GridVariant = "home" | "cards" | "split";

type GridProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: GridVariant;
};

const variantClasses: Record<GridVariant, string> = {
  home: ds.layout.homeGrid,
  cards: ds.layout.cardGrid,
  split: ds.layout.splitGrid,
};

export function Grid({
  children,
  className = "",
  variant = "cards",
  ...props
}: GridProps) {
  return (
    <div className={cx(variantClasses[variant], className)} {...props}>
      {children}
    </div>
  );
}
