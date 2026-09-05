import type { SessionUser } from "@/types";
import type { ServiceResult } from "@/lib/services";
import { executeWorkflow, createServiceError, successResult, failureResult } from "@/lib/services";
import { setTokenProvider, setAuthFailureHandler, setTokenRefreshHandler } from "@/lib/data/auth";
import type { AuthServiceContext, LoginInput, RegisterInput } from "./auth-service.types";
import { auditLoginSuccess, auditLoginFailure, auditLogout } from "./audit-adapter";

export async function login(
  input: LoginInput,
  context: AuthServiceContext,
): Promise<ServiceResult<SessionUser>> {
  return executeWorkflow<LoginInput, SessionUser>(
    input,
    {
      async execute(credentials) {
        const result = await context.authRepo.login(credentials);
        if (!result.success) {
          auditLoginFailure(credentials.email);
          return failureResult(
            createServiceError(
              result.error.type === "VALIDATION" ? "VALIDATION_ERROR" : "AUTHORIZATION_ERROR",
              result.error.message,
            ),
          );
        }
        const { token, user } = result.data;
        const sessionUser = user as unknown as SessionUser;
        context.storeAdapter.login(sessionUser);
        context.store.setAuthToken(token);
        auditLoginSuccess(sessionUser);
        return successResult(sessionUser);
      },
      invalidate() {
        context.storeAdapter.setLoading();
      },
    },
    context,
  );
}

export async function register(
  input: RegisterInput,
  context: AuthServiceContext,
): Promise<ServiceResult<SessionUser>> {
  return executeWorkflow<RegisterInput, SessionUser>(
    input,
    {
      async execute(data) {
        const result = await context.authRepo.register(data);
        if (!result.success) {
          return failureResult(
            createServiceError(
              result.error.type === "VALIDATION" ? "VALIDATION_ERROR" : "CONFLICT",
              result.error.message,
            ),
          );
        }
        const { token, user } = result.data;
        const sessionUser = user as unknown as SessionUser;
        context.storeAdapter.login(sessionUser);
        context.store.setAuthToken(token);
        return successResult(sessionUser);
      },
    },
    context,
  );
}

export async function logout(context: AuthServiceContext): Promise<ServiceResult<void>> {
  return executeWorkflow<void, void>(
    undefined,
    {
      async execute() {
        await context.authRepo.logout();
        const user = context.store.getUser();
        context.storeAdapter.logout();
        context.store.clearAuthToken();
        if (user) auditLogout(user);
        return successResult(undefined);
      },
    },
    context,
  );
}

export async function getSession(
  signal: AbortSignal | undefined,
  context: AuthServiceContext,
): Promise<ServiceResult<SessionUser>> {
  return executeWorkflow<void, SessionUser>(
    undefined,
    {
      async execute() {
        const result = await context.authRepo.getCurrentUser(signal);
        if (!result.success) {
          return failureResult(createServiceError("NOT_FOUND", result.error.message));
        }
        context.storeAdapter.hydrate(result.data);
        return successResult(result.data);
      },
    },
    context,
  );
}

export async function refreshSession(context: AuthServiceContext): Promise<ServiceResult<SessionUser>> {
  return executeWorkflow<void, SessionUser>(
    undefined,
    {
      async execute() {
        const refreshResult = await context.authRepo.refreshToken();
        if (!refreshResult.success) {
          context.storeAdapter.reset();
          context.store.clearAuthToken();
          return failureResult(createServiceError("AUTHORIZATION_ERROR", "Session expired"));
        }
        const userResult = await context.authRepo.getCurrentUser();
        if (!userResult.success) {
          return failureResult(createServiceError("UNEXPECTED_ERROR", "Failed to restore session"));
        }
        context.storeAdapter.hydrate(userResult.data);
        context.store.setAuthToken(refreshResult.data.token);
        return successResult(userResult.data);
      },
    },
    context,
  );
}

export function wireAuthHandlers(context: AuthServiceContext): void {
  setTokenProvider(async () => context.store.getAuthToken());
  setAuthFailureHandler(async () => {
    const refreshResult = await context.authRepo.refreshToken();
    if (refreshResult.success) {
      context.store.setAuthToken(refreshResult.data.token);
    } else {
      context.storeAdapter.reset();
      context.store.clearAuthToken();
    }
  });
  setTokenRefreshHandler(async () => {
    const refreshResult = await context.authRepo.refreshToken();
    if (!refreshResult.success) {
      context.storeAdapter.reset();
      return null;
    }
    context.store.setAuthToken(refreshResult.data.token);
    return refreshResult.data.token;
  });
}