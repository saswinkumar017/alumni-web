/**
 * Tabs renders a horizontal tab bar using Radix UI tabs primitive.
 *
 * @alpha No proven cross-feature reuse yet. Client Component.
 * Supports controlled/uncontrolled pattern via value + onValueChange.
 * @example
 * ```tsx
 * <Tabs tabs={[{ value: "overview", label: "Overview" }]} onValueChange={setTab} />
 * ```
 */

"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export interface Tab {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export default function Tabs({ tabs, value, onValueChange, className }: TabsProps) {
  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      className={cn("w-full", className)}
    >
      <TabsPrimitive.List className="inline-flex h-10 items-center gap-1 rounded-lg bg-surface-hover p-1">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={cn(
              "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "data-[state=active]:bg-surface-elevated data-[state=active]:text-text-primary data-[state=active]:shadow-sm",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
