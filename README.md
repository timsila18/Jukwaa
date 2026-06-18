# JUKWAA

**Where Leadership Meets the People**

JUKWAA is a production-grade, mobile-first political campaign management platform for candidates, parties, agencies, and civic operations teams. This phase establishes the scalable multi-tenant foundation: campaign workspaces, tenant-isolated schema, role-aware operations, supporter CRM, polling station analytics, reports, audit trail, and PWA-ready UI.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS
- Supabase Auth, PostgreSQL, Storage-ready schema, Row Level Security
- Recharts for analytics
- CSV, Excel, and PDF report exports
- Vercel deployment target

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Create `.env.local` from `.env.example`.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The current UI ships with typed demo data so the product is usable before a Supabase project is connected. Server-side Supabase clients are lazy initialized to keep builds safe when environment variables are absent.

## Supabase Setup

1. Create a Supabase project.
2. Add the environment variables above.
3. Install and authenticate the Supabase CLI.
4. Link the project:

```bash
supabase link --project-ref your-project-ref
```

5. Apply migrations:

```bash
supabase db push
```

The migrations create:

- `tenants`
- `campaign_settings`
- `campaign_members`
- reusable location hierarchy tables
- `supporters`
- `supporter_interactions`
- `polling_stations`
- `audit_logs`
- private RLS helper functions
- strict tenant-scoped RLS policies

Demo data can be removed with:

```sql
delete from public.tenants where slug = 'demo-campaign' and is_demo = true;
```

## Security Model

Every operational table includes `tenant_id`. RLS policies only allow authenticated users to access rows for tenants where they are active campaign members. Role checks use `campaign_members` via private `security definer` helper functions, not user-editable metadata.

Role coverage:

- Candidate
- Campaign Manager
- Constituency Coordinator
- Ward Coordinator
- Village Coordinator
- Volunteer
- Polling Agent
- Media Team
- Data Clerk
- Admin

## Reports

Export endpoint:

```text
/api/reports/export?report=supporters-by-ward&format=csv
/api/reports/export?report=supporters-by-ward&format=xlsx
/api/reports/export?report=supporters-by-ward&format=pdf
```

Supported report names:

- `supporters-by-ward`
- `supporters-by-polling-station`
- `support-levels-summary`
- `gender-analysis`
- `age-analysis`
- `key-issues-analysis`

## Deployment

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Set the Supabase environment variables in Vercel.
4. Deploy.
5. Run `supabase db push` against production before enabling real users.

## Roadmap-Ready Modules

The sidebar includes placeholders for Field Operations, Communications, Election Day, Campaign Finance, and AI Intelligence. The schema is designed so these modules can extend the existing tenant, user, location, audit, and supporter foundations without redesigning the database.
