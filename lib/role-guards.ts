import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-response";
import { suspendedAccountResponse } from "@/lib/account-access";
import {
  limitRequest,
  rateLimitHeaders,
  type RateLimitPolicy,
} from "@/lib/rate-limit";
import type { AppUserRole } from "@/types/next-auth";

export function roleHomePath(role: AppUserRole | string | undefined): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "SUPERVISOR":
      return "/supervisor";
    case "STAFF":
      return "/staff";
    default:
      return "/account";
  }
}

export async function assertAuthenticatedRole(
  request: Request,
  allowedRoles: AppUserRole[],
  rateLimitScope: RateLimitPolicy = "admin"
) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      session: null,
      response: apiError(401, "SIGN_IN_REQUIRED", "Please sign in."),
    };
  }

  if (!allowedRoles.includes(session.user.role)) {
    return {
      session: null,
      response: apiError(
        403,
        "FORBIDDEN",
        "You do not have permission to access this resource."
      ),
    };
  }

  const suspended = await suspendedAccountResponse(session.user.id);
  if (suspended) {
    return {
      session: null,
      response: suspended,
    };
  }

  try {
    const rateLimit = await limitRequest(
      request,
      rateLimitScope,
      session.user.id
    );

    if (rateLimit && !rateLimit.success) {
      return {
        session: null,
        response: apiError(
          429,
          "TOO_MANY_REQUESTS",
          "You've made too many requests in a short period. Please wait before trying again.",
          undefined,
          rateLimitHeaders(rateLimit)
        ),
      };
    }
  } catch (error) {
    console.error("Role rate limit error:", error);
    return {
      session: null,
      response: apiError(
        503,
        "SERVICE_UNAVAILABLE",
        "SAMB's is temporarily unable to process your request. Please try again shortly."
      ),
    };
  }

  return { session, response: null };
}

export function assertStaff(request: Request) {
  return assertAuthenticatedRole(request, ["STAFF"], "admin");
}

export function assertSupervisor(request: Request) {
  return assertAuthenticatedRole(request, ["SUPERVISOR"], "admin");
}
