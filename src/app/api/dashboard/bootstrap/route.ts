import { NextResponse } from "next/server";
import { getWorkspaceAccess, requireSession } from "@/lib/auth-session";
import { getLiveWorkspaceSnapshot } from "@/lib/live-dashboard";

export async function GET(request: Request) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;
  const workspaceAccess = await getWorkspaceAccess(auth.session);

  const snapshot = await getLiveWorkspaceSnapshot(auth.session, workspaceAccess);
  return NextResponse.json(snapshot);
}
