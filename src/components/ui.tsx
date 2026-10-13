"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "@phosphor-icons/react";
import { forwardRef, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn, initials } from "@/lib/logic";
import type { User, WorkStatus } from "@/lib/types";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]",
  secondary: "bg-surface text-fg border border-line-strong hover:bg-surface-2",
  ghost: "text-fg hover:bg-surface-2",
  danger: "bg-surface text-danger border border-line-strong hover:bg-danger-soft",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-[15px] gap-2",
};

export const buttonClass = (variant: Variant = "secondary", size: Size = "md", extra?: string) =>
  cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-[10px] font-medium transition-[background-color,transform,box-shadow] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none",
    variants[variant],
    sizes[size],
    extra,
  );

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }>(function Button(
  { variant = "secondary", size = "md", className, type = "button", ...rest },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...rest} />;
});

export function ButtonLink({ variant = "secondary", size = "md", className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

export function IconButton({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn("inline-flex size-9 items-center justify-center rounded-[10px] text-muted transition-colors hover:bg-surface-2 hover:text-fg active:scale-95", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

const statusStyles: Record<WorkStatus, { label: string; cls: string }> = {
  graded: { label: "Graded", cls: "bg-success-soft text-success" },
  submitted: { label: "Submitted", cls: "bg-info-soft text-info" },
  late: { label: "Late", cls: "bg-warning-soft text-warning" },
  missing: { label: "Missing", cls: "bg-danger-soft text-danger" },
  upcoming: { label: "Not submitted", cls: "bg-surface-2 text-muted" },
  locked: { label: "Locked", cls: "bg-surface-2 text-muted" },
  excused: { label: "Excused", cls: "bg-surface-2 text-muted" },
};

export function StatusChip({ status, className }: { status: WorkStatus; className?: string }) {
  const s = statusStyles[status];
  return <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap", s.cls, className)}>{s.label}</span>;
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex h-6 items-center gap-1 rounded-full bg-surface-2 px-2.5 text-xs font-medium text-muted whitespace-nowrap", className)}>{children}</span>;
}

export function Avatar({ user, size = 36, className }: { user?: Pick<User, "name" | "hue">; size?: number; className?: string }) {
  if (!user) return null;
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, ["--h" as string]: user.hue, fontSize: Math.max(10, size * 0.36) }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-tight",
        "bg-[oklch(0.92_0.05_var(--h))] text-[oklch(0.38_0.11_var(--h))] dark:bg-[oklch(0.33_0.07_var(--h))] dark:text-[oklch(0.9_0.06_var(--h))]",
        className,
      )}
    >
      {initials(user.name)}
    </span>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-line-strong px-6 py-14 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-surface-2 text-muted">{icon}</div>
      <p className="text-[15px] font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Panel({ className, children, ...rest }: ComponentProps<"section">) {
  return (
    <section className={cn("rounded-[14px] border border-line bg-surface shadow-card", className)} {...rest}>
      {children}
    </section>
  );
}

export function PageHeader({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-balance">{title}</h1>
        {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ProgressRing({ value, size = 44, stroke = 4, label, color = "var(--accent)" }: { value: number; size?: number; stroke?: number; label?: ReactNode; color?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: "stroke-dashoffset 600ms cubic-bezier(.16,1,.3,1)" }} />
      </svg>
      {label !== undefined && <span className="absolute text-[11px] font-semibold tabular-nums">{label}</span>}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-line-strong bg-surface px-1 font-mono text-[11px] text-muted">{children}</kbd>;
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </label>
      {children(id)}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export const inputBase =
  "rounded-[10px] border border-input/60 bg-surface px-3 text-sm text-fg placeholder:text-faint transition-shadow focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/20";

export const inputClass = `w-full ${inputBase}`;

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors", checked ? "bg-accent" : "bg-surface-3")}
    >
      <span className={cn("inline-block size-[18px] rounded-full bg-white shadow transition-transform duration-200", checked ? "translate-x-[19px]" : "translate-x-[3px]")} />
    </button>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => ref.current?.querySelector<HTMLElement>("input,textarea,select,button[data-autofocus]")?.focus(), 30);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto overscroll-contain p-4 pt-[10vh]">
          <motion.div className="fixed inset-0 bg-[rgb(10_10_14/0.45)] backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={cn("relative w-full rounded-[14px] border border-line bg-surface shadow-pop", wide ? "max-w-2xl" : "max-w-lg")}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="text-[15px] font-semibold">{title}</h2>
              <IconButton label="Close" onClick={onClose} className="-mr-2">
                <X size={18} />
              </IconButton>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[]; label: string }) {
  const id = useId();
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-[10px] bg-surface-2 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} role="tab" aria-selected={active} onClick={() => onChange(o.value)} className={cn("relative h-8 rounded-[7px] px-3 text-[13px] font-medium transition-colors", active ? "text-fg" : "text-muted hover:text-fg")}>
            {active && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-[7px] bg-surface shadow-card" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <span className="relative flex items-center gap-1.5">
              {o.label}
              {o.count !== undefined && o.count > 0 && <span className="rounded-full bg-accent px-1.5 text-[10px] leading-4 font-semibold text-on-accent">{o.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function MuseMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path d="M8 22V13.5a3.5 3.5 0 0 1 7 0V22M15 13.5a3.5 3.5 0 0 1 7 0V22" fill="none" stroke="var(--on-accent)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24.5" cy="9" r="2" fill="var(--on-accent)" />
    </svg>
  );
}

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function Menu({ label, items, children, align = "right" }: { label: string; items: MenuItem[]; children: ReactNode; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label={label} title={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="inline-flex size-8 items-center justify-center rounded-[8px] text-muted transition-colors hover:bg-surface-3 hover:text-fg">
        {children}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className={cn("absolute top-9 z-40 min-w-[190px] rounded-[12px] border border-line bg-surface p-1 shadow-pop", align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left")}
          >
            {items.map((it) => (
              <button
                key={it.label}
                role="menuitem"
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false);
                  it.onSelect();
                }}
                className={cn("flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-sm transition-colors disabled:opacity-40", it.danger ? "text-danger hover:bg-danger-soft" : "hover:bg-surface-2")}
              >
                {it.icon && <span className="text-muted">{it.icon}</span>}
                {it.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[10px] bg-surface-2", className)} />;
}

export function Html({ html, className }: { html: string; className?: string }) {
  return <div className={cn("prose-muse", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
