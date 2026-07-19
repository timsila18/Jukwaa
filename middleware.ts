import { NextRequest, NextResponse } from "next/server";

const accessCookie = "jukwaa_access_token";
const refreshCookie = "jukwaa_refresh_token";
const workspaceSessionCookie = "jukwaa_workspace_session";

const publicPaths = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/signup",
  "/pricing",
  "/support",
  "/legal",
  "/payment/confirm",
  "/api/auth/login",
  "/api/auth/join",
  "/api/auth/logout",
  "/api/auth/forgot",
  "/api/auth/reset",
  "/api/admin/bootstrap",
  "/api/system/health",
  "/api/onboarding/candidate",
  "/api/onboarding/payment",
  "/api/payments/mpesa/callback",
  "/api/payments/mpesa/stk",
  "/jukwaa-logo.png",
  "/icon.svg",
  "/manifest.webmanifest",
  "/favicon.ico",
];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic = publicPaths.some((item) => path === item || path.startsWith(`${item}/`));
  if (isPublic || path.startsWith("/_next/")) return NextResponse.next();

  const hasSessionCookie = Boolean(
    request.cookies.get(accessCookie)?.value
    || request.cookies.get(refreshCookie)?.value
    || request.cookies.get(workspaceSessionCookie)?.value,
  );

  if (!hasSessionCookie) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
