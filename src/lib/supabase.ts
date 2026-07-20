import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  return createBrowserClient(url, key);
}

let adminClient: ReturnType<typeof createClient> | null = null;

export type SupabaseLooseResult = {
  data: Record<string, unknown> | Record<string, unknown>[] | null;
  error: { message: string } | null;
};

export type SupabaseLooseSingleResult = {
  data: Record<string, string> | null;
  error: { message: string } | null;
};

export type SupabaseLooseQuery = {
  select: (columns?: string) => SupabaseLooseQuery;
  insert: (values: unknown) => SupabaseLooseQuery;
  upsert: (values: unknown, options?: { onConflict?: string; ignoreDuplicates?: boolean }) => SupabaseLooseQuery;
  update: (values: unknown) => SupabaseLooseQuery;
  delete: () => SupabaseLooseQuery;
  eq: (column: string, value: unknown) => SupabaseLooseQuery;
  in: (column: string, values: unknown[]) => SupabaseLooseQuery;
  or: (filters: string) => SupabaseLooseQuery;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseLooseQuery;
  limit: (count: number) => SupabaseLooseQuery;
  single: () => Promise<SupabaseLooseSingleResult>;
  maybeSingle: () => Promise<SupabaseLooseSingleResult>;
  then: Promise<SupabaseLooseResult>["then"];
};

export type SupabaseLooseClient = {
  from: (table: string) => SupabaseLooseQuery;
};

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClient;
}

export function getLooseSupabaseAdmin() {
  return getSupabaseAdmin() as unknown as SupabaseLooseClient;
}
