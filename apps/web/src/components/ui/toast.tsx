"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from "lucide-react";
import { useToast, ToastItem } from "./use-toast";
import { cn } from "../../lib/utils";

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[9999] flex max-w-md w-full flex-col gap-2.5 pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((item) => (
        <ToastCard
          key={item.id}
          item={item}
          onDismiss={() => dismiss(item.id)}
        />
      ))}
    </div>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const variantStyles = {
    default:
      "border-border/80 bg-surface/95 text-foreground shadow-lg backdrop-blur-md dark:border-border/60",
    success:
      "border-emerald-500/40 bg-emerald-950/90 text-emerald-100 shadow-emerald-950/40 dark:bg-emerald-950/95 dark:border-emerald-400/50",
    destructive:
      "border-rose-500/40 bg-rose-950/90 text-rose-100 shadow-rose-950/40 dark:bg-rose-950/95 dark:border-rose-400/50",
    sunset:
      "border-orange-500/40 bg-orange-950/90 text-orange-100 shadow-orange-950/40 dark:bg-orange-950/95 dark:border-orange-400/50",
    info: "border-sky-500/40 bg-sky-950/90 text-sky-100 shadow-sky-950/40 dark:bg-sky-950/95 dark:border-sky-400/50",
  };

  const icons = {
    default: <Sparkles className="h-5 w-5 text-brand-ocean flex-shrink-0" />,
    success: (
      <CheckCircle2 className="h-5 w-5 text-nature-emerald flex-shrink-0" />
    ),
    destructive: (
      <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
    ),
    sunset: <Sparkles className="h-5 w-5 text-accent-sunset flex-shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-400 flex-shrink-0" />,
  };

  const variant = item.variant || "default";

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5",
        variantStyles[variant],
      )}
    >
      <div className="mt-0.5">{icons[variant]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold tracking-tight text-white dark:text-foreground">
          {item.title}
        </h4>
        {item.description && (
          <p className="mt-1 text-xs text-white/80 dark:text-muted-foreground leading-relaxed">
            {item.description}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Close notification"
        className="rounded-lg p-1 text-white/60 hover:text-white dark:text-muted-foreground dark:hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
