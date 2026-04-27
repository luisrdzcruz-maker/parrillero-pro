import { cx, ds } from "@/lib/design-system";
import type { HTMLAttributes, ReactNode } from "react";

type SectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
};

export function Section({ children, className = "", eyebrow, title, ...props }: SectionProps) {
  return (
    <section className={cx(ds.layout.pageSection, className)} {...props}>
      {(eyebrow || title) && (
        <div className="flex items-end justify-between gap-3">
          <div>
            {eyebrow && <p className={ds.text.eyebrow}>{eyebrow}</p>}
            {title && (
              <h2 className="mt-1 text-2xl font-black tracking-tight text-white">{title}</h2>
            )}
          </div>
        </div>
      )}

      {children}
    </section>
  );
}
