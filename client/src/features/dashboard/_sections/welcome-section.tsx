// Section: WelcomeSection
// Rendering: Server
// Data: Props-only (receives user from Feature)
// Interaction: Passive (display only)

import type { SessionUser } from "@/types";

export interface WelcomeSectionProps {
  user: SessionUser;
  heading: string;
  description?: string;
}

export function WelcomeSection({ user, heading, description }: WelcomeSectionProps) {
  return (
    <section aria-labelledby="welcome-heading">
      <h1 id="welcome-heading" className="text-2xl font-bold text-zinc-900">
        {heading}
      </h1>
      <p className="mt-2 text-zinc-600">
        Welcome back{user.name ? `, ${user.name}` : ""}.{description ? ` ${description}` : ""}
      </p>
    </section>
  );
}
