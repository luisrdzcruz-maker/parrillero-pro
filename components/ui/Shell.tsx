import { cx, ds } from "@/lib/design-system";
import type { HTMLAttributes, ReactNode } from "react";

type ShellProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

type ShellContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Shell({ children, className = "", ...props }: ShellProps) {
  return (
    <main className={cx(ds.shell.page, className)} {...props}>
      {children}
    </main>
  );
}

export function ShellContainer({
  children,
  className = "",
  ...props
}: ShellContainerProps) {
  return (
    <div className={cx(ds.shell.container, className)} {...props}>
      {children}
    </div>
  );
}
