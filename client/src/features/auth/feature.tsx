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
