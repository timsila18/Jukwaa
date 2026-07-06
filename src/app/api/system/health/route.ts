import { NextResponse } from "next/server";

function hostOf(value?: string) {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

async function checkSupabaseReachability(url?: string) {
  if (!url) return { ok: false, reason: "Missing NEXT_PUBLIC_SUPABASE_URL" };
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return { ok: response.status < 500, status: response.status };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "Supabase reachability check failed" };
  }
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const checks = {
    app: "JUKWAA",
    checkedAt: new Date().toISOString(),
    supabase: {
      host: hostOf(supabaseUrl),
      hasUrl: Boolean(supabaseUrl),
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      reachable: await checkSupabaseReachability(supabaseUrl),
    },
    adminBootstrap: {
      configured: Boolean(process.env.ADMIN_BOOTSTRAP_SECRET && process.env.ADMIN_BOOTSTRAP_SECRET.length >= 24),
    },
    mpesa: {
      hasPaybill: Boolean(process.env.MPESA_PAYBILL_NUMBER),
      hasCallbackUrl: Boolean(process.env.MPESA_CALLBACK_URL),
      hasCallbackSecret: Boolean(process.env.MPESA_CALLBACK_SECRET),
    },
    livekit: {
      configured: Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET),
    },
    ai: {
      configured: Boolean(process.env.OPENAI_API_KEY),
    },
  };

  const ok = checks.supabase.hasUrl
    && checks.supabase.hasPublishableKey
    && checks.supabase.hasServiceRoleKey
    && checks.supabase.reachable.ok;

  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
}
