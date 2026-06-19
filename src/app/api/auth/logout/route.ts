import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/auth-session";

export async function POST() {
  const response = NextResponse.json({ status: "Logged out" }, { headers: { "Cache-Control": "no-store" } });
  clearSessionCookies(response);
  return response;
}

export async function GET(request: Request) {
  const url = new URL("/login", request.url);
  const response = NextResponse.redirect(url);
  clearSessionCookies(response);
  return response;
}
