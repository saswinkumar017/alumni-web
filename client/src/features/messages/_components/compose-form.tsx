// Component: ComposeForm
// Rendering: Client
// Data: Props-only
// Interaction: Active

import type { FormEvent } from "react";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";

export interface ComposeFormProps {
  onSend?: (content: string) => void;
  placeholder?: string;
}

export default function ComposeForm({
  onSend,
  placeholder = "Type your message...",
}: ComposeFormProps) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const content = form.get("message") as string;
    if (!content?.trim()) return;
    onSend?.(content.trim());
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
      <TextInput
        id="message-input"
        name="message"
        type="text"
        placeholder={placeholder}
        srOnlyLabel="Message"
        className="mt-0 flex-1"
      />
      <Button type="submit">Send</Button>
    </form>
  );
}
