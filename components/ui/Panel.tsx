import { cx, ds } from "@/lib/design-system";
import type { HTMLAttributes, ReactNode } from "react";

type PanelTone = "card" | "empty" | "form" | "glass" | "hero" | "highlight" | "result" | "timer";
type PanelElement = "article" | "div" | "section";

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: PanelElement;
  children: ReactNode;
  tone?: PanelTone;
};

const toneClasses: Record<PanelTone, string> = {
  card: ds.panel.card,
  empty: ds.panel.empty,
  form: ds.panel.form,
  glass: ds.panel.glass,
  hero: ds.panel.hero,
  highlight: ds.panel.highlight,
  result: ds.panel.result,
  timer: ds.panel.timer,
};

export function Panel({
  as: Component = "div",
  children,
  className = "",
  tone = "card",
  ...props
}: PanelProps) {
  return (
    <Component className={cx(toneClasses[tone], className)} {...props}>
      {children}
    </Component>
  );
}
