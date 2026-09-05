"use client";

import type { ReactNode } from "react";
import { Component, type ErrorInfo } from "react";
import { createAuditEvent, logAuditEvent } from "@/lib/security/audit-service";
import type { AuditAction } from "@/constants/security/audit-action";

interface SecureErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  auditAction?: AuditAction;
  userId?: string;
  resourceId?: string;
}

interface SecureErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SecureErrorBoundary extends Component<SecureErrorBoundaryProps, SecureErrorBoundaryState> {
  constructor(props: SecureErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SecureErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const event = createAuditEvent(
      this.props.auditAction ?? "UI_ERROR",
      this.props.userId ?? null,
      {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        resourceId: this.props.resourceId,
      },
    );
    logAuditEvent({ ...event, severity: "ERROR" });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div role="alert" className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-4xl">!</div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Something went wrong
          </h2>
          <p className="text-sm text-zinc-500">
            An unexpected error occurred. Please try again later.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}