"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "../_validation/auth-schemas";
import { registerApi, verifyRegistrationOtp } from "../_services/auth-api";

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "otp" | "done">("form");
  const [registeredUsername, setRegisteredUsername] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setError(null);
    setLoading(true);

    try {
      const response = await registerApi(data);
      setRegisteredUsername(response.username);
      setStep("otp");
      toast.success("OTP sent! Check your email.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpVerify() {
    if (!otpValue || otpValue.length < 4) {
      toast.error("Please enter a valid OTP");
      return;
    }
    setOtpLoading(true);
    try {
      await verifyRegistrationOtp(registeredUsername, otpValue);
      toast.success("Account verified successfully!");
      setStep("done");
    } catch (err) {
      const message = err instanceof Error ? err.message : "OTP verification failed";
      toast.error(message);
      setError(message);
    } finally {
      setOtpLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">Account Verified!</h1>
        <p className="mt-2 text-sm text-zinc-600">Your account is now active. You can sign in.</p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Verify Your Email</h1>
        <p className="mt-2 text-sm text-zinc-600">
          We sent a 6-digit OTP to your email. Enter it below to verify your account.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-zinc-700">
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={otpValue}
              onChange={(e) => {
                setOtpValue(e.target.value.replace(/\D/g, ""));
                setError(null);
              }}
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-center text-lg tracking-[0.5em] font-mono text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder="000000"
            />
          </div>

          <button
            type="button"
            onClick={handleOtpVerify}
            disabled={otpLoading || otpValue.length < 4}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {otpLoading ? "Verifying..." : "Verify Account"}
          </button>

          <p className="text-center text-sm text-zinc-500">
            Didn't receive a code?{" "}
            <button
              type="button"
              onClick={() => {
                setOtpValue("");
                setError(null);
                toast.info("Resending OTP...");
              }}
              className="font-medium text-zinc-900 hover:underline"
            >
              Resend
            </button>
          </p>
        </div>
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
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">Server Error</p>
                <p className="mt-1 text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="registerNumber" className="block text-sm font-medium text-zinc-700">
            Register Number
          </label>
          <input
            id="registerNumber"
            type="text"
            autoComplete="off"
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
            autoComplete="email"
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
            autoComplete="username"
            {...register("username")}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            placeholder="Choose a username (3-50 characters)"
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
            autoComplete="new-password"
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
