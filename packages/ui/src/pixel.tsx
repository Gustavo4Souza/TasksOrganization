"use client";

import { forwardRef, useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

const classes = (...values: (string | undefined | false)[]) =>
  values.filter(Boolean).join(" ");
export type Accent = "gold" | "mana" | "moss" | "crimson" | "arcane";

export function Panel({
  title,
  children,
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<"section">, "title"> & { title?: ReactNode }) {
  const id = useId();
  return (
    <section
      aria-labelledby={title ? id : undefined}
      {...props}
      className={classes("px-frame", "px-panel", className)}
    >
      {title && (
        <h2 id={id} className="px-panel__head px-panel-title">
          {title}
        </h2>
      )}
      <div className="px-panel__body">{children}</div>
    </section>
  );
}

export const Button = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<"button"> & {
    variant?: "primary" | "secondary" | "danger";
  }
>(function Button(
  { variant = "primary", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={classes(
        "px-btn",
        "px-button",
        variant === "primary" && "px-btn--primary",
        variant === "secondary" && "px-btn--ghost",
        variant === "danger" && "px-btn--danger",
        `px-button--${variant}`,
        className,
      )}
    />
  );
});

export function Tag({
  tone = "gold",
  className,
  ...props
}: ComponentPropsWithoutRef<"span"> & { tone?: Accent }) {
  return (
    <span
      {...props}
      className={classes(
        "px-tag",
        `px-tone--${tone}`,
        tone === "crimson" && "px-tag--high",
        tone === "gold" && "px-tag--medium",
        tone === "moss" && "px-tag--low",
        className,
      )}
    />
  );
}

const icons = {
  skull: "M3 2h10v9h-2v3H5v-3H3z M5 5v3h2V5z M9 5v3h2V5z M7 10v2h2v-2z",
  heart: "M2 3h4v2h4V3h4v6h-2v2h-2v2H6v-2H4V9H2z",
  sword: "M11 1h4v4l-6 6 2 2-2 2-3-3-3 3-2-2 3-3-3-3 2-2 2 2z",
  star: "M7 1h2v4h5v3h-3v3h2v3H9v-3H7v3H3v-3h2V8H2V5h5z",
  check: "M1 7h3v3h2V8h2V6h2V4h2V2h3v4h-2v2h-2v2H9v2H7v2H4v-2H2v-2H1z",
  flag: "M2 1h2v1h10v7H4v6H2z",
} as const;
export type PixelIconName = keyof typeof icons;
export function PixelIcon({
  name,
  label,
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<"svg">, "children"> & {
  name: PixelIconName;
  label?: string;
}) {
  return (
    <svg
      {...props}
      viewBox="0 0 16 16"
      width="20"
      height="20"
      fill="currentColor"
      fillRule="evenodd"
      shapeRendering="crispEdges"
      focusable="false"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={classes("px-ico", "px-icon", className)}
    >
      <path d={icons[name]} />
    </svg>
  );
}

export interface TaskCardProps
  extends Omit<ComponentPropsWithoutRef<"article">, "title"> {
  title: string;
  status?: "todo" | "doing" | "done";
  priority?: "low" | "medium" | "high";
  pomodoros?: number;
  compact?: boolean;
  actions?: ReactNode;
}
export function TaskCard({
  title,
  status = "todo",
  priority = "medium",
  pomodoros = 0,
  compact = false,
  actions,
  className,
  ...props
}: TaskCardProps) {
  const id = useId();
  const statusLabel = {
    todo: "Missão",
    doing: "Em batalha",
    done: "Conquistada",
  }[status];
  return (
    <article
      aria-labelledby={id}
      {...props}
      className={classes(
        "px-task",
        "px-task-card",
        status === "doing" && "px-task--doing",
        status === "done" && "px-task--done",
        `px-task-card--${status}`,
        compact && "px-task--compact",
        compact && "px-task-card--compact",
        className,
      )}
    >
      <div className="px-task-heading">
        <PixelIcon
          name={
            status === "done" ? "check" : status === "doing" ? "sword" : "flag"
          }
          label={statusLabel}
        />
        <h3 id={id} className="px-task__title">
          {title}
        </h3>
      </div>
      <div className="px-task-meta px-task__meta">
        <Tag
          tone={
            priority === "high"
              ? "crimson"
              : priority === "low"
                ? "moss"
                : "gold"
          }
        >
          {{ low: "Baixa", medium: "Média", high: "Alta" }[priority]}
        </Tag>
        <span>{Math.max(0, Math.floor(pomodoros))} focos</span>
      </div>
      {actions && <div className="px-task-actions">{actions}</div>}
    </article>
  );
}

export function StatBar({
  label,
  value,
  max = 100,
  tone = "gold",
}: {
  label: string;
  value: number;
  max?: number;
  tone?: Accent;
}) {
  const limit = Number.isFinite(max) && max > 0 ? max : 100;
  const amount = Number.isFinite(value)
    ? Math.min(limit, Math.max(0, value))
    : 0;
  return (
    <div className={classes("px-bar", "px-stat", `px-tone--${tone}`)}>
      <span className="px-bar__label">{label}</span>
      <div
        className="px-bar__track px-stat-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={amount}
      >
        <div
          className="px-stat-fill"
          style={{ width: `${(amount / limit) * 100}%` }}
        />
      </div>
      <span className="px-bar__value">
        {amount}/{limit}
      </span>
    </div>
  );
}

export type Scope = "daily" | "weekly" | "yearly";
const scopes: Scope[] = ["daily", "weekly", "yearly"];
const scopeLabels = { daily: "Hoje", weekly: "Semana", yearly: "Ano" };
export interface ScopeTabsProps {
  value: Scope;
  onChange: (scope: Scope) => void;
  counts: Record<Scope, number>;
  /** Prefix for tab and panel IDs; panels must use `${id}-panel-${scope}`. */
  id: string;
  label?: string;
}
export function ScopeTabs({
  value,
  onChange,
  counts,
  id,
  label = "Escopo das missões",
}: ScopeTabsProps) {
  return (
    <div className="px-tabs px-scope-tabs" role="tablist" aria-label={label}>
      {scopes.map((scope, index) => (
        <button
          key={scope}
          type="button"
          role="tab"
          id={`${id}-tab-${scope}`}
          aria-controls={`${id}-panel-${scope}`}
          aria-selected={value === scope}
          tabIndex={value === scope ? 0 : -1}
          onClick={() => onChange(scope)}
          onKeyDown={(event) => {
            const next =
              event.key === "ArrowRight"
                ? (index + 1) % 3
                : event.key === "ArrowLeft"
                  ? (index + 2) % 3
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? 2
                      : -1;
            if (next < 0) return;
            event.preventDefault();
            onChange(scopes[next]);
            const tabs =
              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                '[role="tab"]',
              );
            tabs?.[next]?.focus();
          }}
        >
          {scopeLabels[scope]}{" "}
          <span className="px-tab-count">{counts[scope]}</span>
        </button>
      ))}
    </div>
  );
}
