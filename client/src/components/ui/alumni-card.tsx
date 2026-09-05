/**
 * AlumniCard renders a rich profile/community card.
 *
 * @alpha Introduced for networking + community UI upgrade (PLAN 2.3).
 * Gradient header band, avatar-with-initials, badges, hover lift,
 * consistent rounded-2xl + shadow. Client-safe; href renders a Link.
 * @example
 * ```tsx
 * <AlumniCard
 *   name="Kavitha R"
 *   subtitle="CSE · Batch 2020"
 *   badges={[{ label: "TCS", tone: "default" }]}
 *   href={`/alumni/networking/${reg}`}
 *   action={<ConnectButton />}
 * />
 * ```
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Avatar from "@/components/data-display/avatar";

export interface AlumniCardBadge {
  label: string;
  tone?: "default" | "success" | "warning" | "danger";
}

export interface AlumniCardProps {
  name: string;
  avatarSrc?: string;
  subtitle?: string;
  description?: string;
  badges?: AlumniCardBadge[];
  href?: string;
  action?: ReactNode;
  gradient?: boolean;
  className?: string;
}

const badgeTones = {
  default: "bg-surface-hover text-text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AlumniCard({
  name,
  avatarSrc,
  subtitle,
  description,
  badges,
  href,
  action,
  gradient = true,
  className,
}: AlumniCardProps) {
  const header = (
    <>
      <div
        className={cn(
          "relative -mx-5 -mt-5 mb-4 rounded-t-xl px-5 pb-10 pt-5",
          gradient && "bg-gradient-to-br from-brand-blue to-brand-indigo",
          !gradient && "border-b border-border-default bg-surface-hover",
        )}
      >
        <Avatar
          src={avatarSrc}
          alt={name}
          fallback={initials(name)}
          size="lg"
          className="border-2 border-white shadow-sm"
        />
      </div>
      <h3 className="font-semibold text-text-primary">{name}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
      {description && <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{description}</p>}
      {badges && badges.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <span
              key={`${b.tone ?? "default"}-${b.label}`}
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                badgeTones[b.tone ?? "default"],
              )}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "group rounded-2xl border border-border-default bg-surface-card p-5 shadow-sm",
        "transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      {href ? <Link href={href}>{header}</Link> : header}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
