import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "autosweep"
    | "easytrip"
    | "commute"
    | "convoy"
    | "unsettled"
    | "settled"
    | "outline"
    | "sunset";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors";

  const variants = {
    default: "border-border bg-surface-secondary text-foreground",
    autosweep:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    easytrip: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
    commute:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    convoy:
      "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    unsettled:
      "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
    settled:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    outline: "border-border bg-transparent text-foreground",
    sunset:
      "border-accent-sunset/30 bg-accent-sunset/10 text-accent-sunset dark:text-orange-400",
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props}>
      {variant === "convoy" && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
        </span>
      )}
      {children}
    </div>
  );
}
