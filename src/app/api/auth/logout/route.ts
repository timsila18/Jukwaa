import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/auth-session";

export async function POST() {
  const response = NextResponse.json({ status: "Logged out" });
  clearSessionCookies(response);
  return response;
}
