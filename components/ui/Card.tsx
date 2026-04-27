import { cx, ds } from "@/lib/design-system";
import type { HTMLAttributes, ReactNode } from "react";

type CardTone = "default" | "form" | "empty" | "glass";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: CardTone;
};

const toneClasses: Record<CardTone, string> = {
  default: `${ds.panel.card} p-5`,
  form: ds.panel.form,
  empty: ds.panel.empty,
  glass: ds.panel.glass,
};

export function Card({
  children,
  className = "",
  tone = "default",
  ...props
}: CardProps) {
  return (
    <div className={cx(toneClasses[tone], className)} {...props}>
      {children}
    </div>
  );
}