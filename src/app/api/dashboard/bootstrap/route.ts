import { NextResponse } from "next/server";
import { attachSessionCookies, getWorkspaceAccess, requireSession } from "@/lib/auth-session";
import { getLiveWorkspaceSnapshot } from "@/lib/live-dashboard";

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;
  const workspaceAccess = await getWorkspaceAccess(auth.session);

  const snapshot = await getLiveWorkspaceSnapshot(auth.session, workspaceAccess);
  const response = NextResponse.json(snapshot, { headers: { "Cache-Control": "no-store" } });
  if (auth.session.refreshedAuthSession) attachSessionCookies(response, auth.session.refreshedAuthSession);
  return response;
}
