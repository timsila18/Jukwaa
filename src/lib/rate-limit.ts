import { getLooseSupabaseAdmin } from "@/lib/supabase";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  return { allowed: true };
}

export function requestKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${scope}:${forwarded || "local"}`;
}

export async function enforceRateLimit(key: string, limit = 30, windowMs = 60_000) {
  const memory = rateLimit(key, limit, windowMs);
  if (!memory.allowed) return memory;

  try {
    const admin = getLooseSupabaseAdmin();
    const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs).toISOString();
    const { data } = await admin
      .from("api_rate_limits")
      .select("id, request_count, blocked_until")
      .eq("rate_key", key)
      .eq("window_start", windowStart)
      .maybeSingle();

    if (data?.blocked_until && new Date(data.blocked_until).getTime() > Date.now()) {
      return { allowed: false, retryAfter: Math.ceil((new Date(data.blocked_until).getTime() - Date.now()) / 1000) };
    }

    if (!data) {
      await admin.from("api_rate_limits").insert({ rate_key: key, window_start: windowStart, request_count: 1 });
      return { allowed: true };
    }

    const count = Number(data.request_count) + 1;
    const blockedUntil = count > limit ? new Date(Date.now() + windowMs).toISOString() : null;
    await admin.from("api_rate_limits").update({ request_count: count, blocked_until: blockedUntil, updated_at: new Date().toISOString() }).eq("id", data.id);
    return count > limit ? { allowed: false, retryAfter: Math.ceil(windowMs / 1000) } : { allowed: true };
  } catch {
    return memory;
  }
}
