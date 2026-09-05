/**
 * Auth Feature
 *
 * Handles authentication flows: login, registration, password reset, and email verification.
 * Access: Public
 * Rendering: Client (forms with validation)
 * Data: Write-only (submits credentials)
 *
 * @example
 * ```tsx
 * <LoginForm />
 * ```
 */
export {
  ForgotPasswordForm,
  LoginForm,
  RegisterForm,
  ResetPasswordForm,
  VerifyEmail,
} from "./feature";
