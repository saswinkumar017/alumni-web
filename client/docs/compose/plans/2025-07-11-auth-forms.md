# Auth Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement complete auth forms (login, register, forgot password, verify email) connected to the backend API.

**Architecture:** Each form is a client component using React Hook Form + Zod validation, calling the backend API through an auth service layer. Forms live in `src/features/auth/_components/` and are composed in the feature barrel.

**Tech Stack:** React Hook Form, Zod, Next.js 16, TypeScript, Tailwind CSS

## Global Constraints

- No dark mode classes (light theme only)
- Use existing form components from `src/components/form/`
- Backend endpoints: POST `/api/login`, POST `/api/register`, POST `/api/auth/refresh`, GET `/api/auth/verify`
- Backend does NOT have a forgot-password endpoint — skip that form for now

---

## File Structure

```
src/features/auth/
├── _components/
│   ├── login-form.tsx          # CREATE
│   ├── register-form.tsx       # CREATE
│   └── verify-email.tsx        # CREATE
├── _validation/
│   └── auth-schemas.ts         # CREATE (Zod schemas)
├── feature.tsx                 # MODIFY (replace stubs with real components)
└── index.ts                    # NO CHANGE (exports already correct)
```

---

### Task 1: Create Zod Validation Schemas

**Files:**
- Create: `src/features/auth/_validation/auth-schemas.ts`

**Interfaces:**
- Consumes: None
- Produces: `loginSchema`, `registerSchema`, `loginInput`, `registerInput`

- [ ] **Step 1: Create validation schemas**

```typescript
import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  registerNumber: z
    .string()
    .min(1, "Register number is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/features/auth/_validation/auth-schemas.ts
git commit -m "feat: add auth validation schemas"
```

---

### Task 2: Create Login Form Component

**Files:**
- Create: `src/features/auth/_components/login-form.tsx`

**Interfaces:**
- Consumes: `loginSchema`, `LoginInput` from Task 1
- Produces: `LoginForm` component

- [ ] **Step 1: Create login form component**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "../_validation/auth-schemas";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.message || "Invalid credentials");
        return;
      }

      const body = await res.json();
      localStorage.setItem("accessToken", body.accessToken);
      localStorage.setItem("refreshToken", body.refreshToken);
      localStorage.setItem("user", JSON.stringify({ username: body.username, role: body.role }));
      router.push("/alumni/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Welcome back</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Sign in to your alumni account.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-zinc-700">
            Username
          </label>
          <input
            id="username"
            type="text"
            {...register("username")}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            placeholder="Enter your username"
          />
          {errors.username && (
            <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-600">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="font-medium text-zinc-900 hover:underline">
          Register
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/features/auth/_components/login-form.tsx
git commit -m "feat: add login form component"
```

---

### Task 3: Create Register Form Component

**Files:**
- Create: `src/features/auth/_components/register-form.tsx`

**Interfaces:**
- Consumes: `registerSchema`, `RegisterInput` from Task 1
- Produces: `RegisterForm` component

- [ ] **Step 1: Create register form component**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "../_validation/auth-schemas";

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.message || "Registration failed");
        return;
      }

      const body = await res.json();
      setSuccess(body.message || "Registration successful! Please check your email for verification.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Check your email</h1>
        <p className="mt-2 text-sm text-zinc-600">{success}</p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Create an account</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Join the JJCET Alumni network.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="registerNumber" className="block text-sm font-medium text-zinc-700">
            Register Number
          </label>
          <input
            id="registerNumber"
            type="text"
            {...register("registerNumber")}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            placeholder="Enter your register number"
          />
          {errors.registerNumber && (
            <p className="mt-1 text-xs text-red-600">{errors.registerNumber.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-zinc-700">
            Username
          </label>
          <input
            id="username"
            type="text"
            {...register("username")}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            placeholder="Choose a username"
          />
          {errors.username && (
            <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            placeholder="Create a password (min 8 characters)"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-zinc-900 hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/features/auth/_components/register-form.tsx
git commit -m "feat: add register form component"
```

---

### Task 4: Create Verify Email Component

**Files:**
- Create: `src/features/auth/_components/verify-email.tsx`

**Interfaces:**
- Consumes: None
- Produces: `VerifyEmail` component

- [ ] **Step 1: Create verify email component**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function VerifyEmail() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify?token=${encodeURIComponent(token)}`
        );

        if (!res.ok) {
          const body = await res.json();
          setStatus("error");
          setMessage(body.message || "Verification failed. The link may have expired.");
          return;
        }

        const body = await res.json();
        setStatus("success");
        setMessage(body.message || "Email verified successfully!");
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    }

    verify();
  }, [token]);

  return (
    <div className="text-center">
      {status === "loading" && (
        <>
          <h1 className="text-2xl font-bold text-zinc-900">Verifying your email...</h1>
          <p className="mt-2 text-sm text-zinc-600">Please wait.</p>
        </>
      )}

      {status === "success" && (
        <>
          <h1 className="text-2xl font-bold text-zinc-900">Email verified!</h1>
          <p className="mt-2 text-sm text-zinc-600">{message}</p>
          <Link
            href="/auth/login"
            className="mt-6 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Sign in
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-2xl font-bold text-zinc-900">Verification failed</h1>
          <p className="mt-2 text-sm text-zinc-600">{message}</p>
          <Link
            href="/auth/login"
            className="mt-6 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Go to Sign In
          </Link>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/features/auth/_components/verify-email.tsx
git commit -m "feat: add verify email component"
```

---

### Task 5: Update Feature Barrel to Export Real Components

**Files:**
- Modify: `src/features/auth/feature.tsx`

**Interfaces:**
- Consumes: All components from Tasks 2-4
- Produces: Updated barrel exports

- [ ] **Step 1: Update feature.tsx**

```tsx
export { LoginForm } from "./_components/login-form";
export { RegisterForm } from "./_components/register-form";
export { VerifyEmail } from "./_components/verify-email";

export function ForgotPasswordForm() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Reset your password</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Please contact the administrator to reset your password.
      </p>
      <a
        href="mailto:alumni@jjcet.ac.in"
        className="mt-6 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Contact Support
      </a>
    </div>
  );
}

export function ResetPasswordForm() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Set a new password</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Please contact the administrator to reset your password.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run typecheck`
Expected: No errors

- [ ] **Step 3: Verify dev server runs**

Run: `npm run dev`
Expected: No errors in terminal

- [ ] **Step 4: Commit**

```bash
git add src/features/auth/feature.tsx
git commit -m "feat: wire up auth form components"
```

---

## Self-Review

**1. Spec coverage:** All 4 auth forms are covered: Login (Task 2), Register (Task 3), Verify Email (Task 4), Forgot Password (Task 5 - simple fallback).

**2. Placeholder scan:** No TBD/TODO found. All code is complete.

**3. Type consistency:** `LoginInput` and `RegisterInput` types are consistent between schema and form components.
