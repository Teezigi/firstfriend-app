# FirstFriend — Supabase setup

## One-time setup
1. Open your Supabase project → **SQL Editor** → New query.
2. Paste the contents of `schema.sql` and run it. This creates all tables,
   row-level security policies, and the `try_form_groups()` matching function.

## Forming groups (for now)
Group formation isn't on a schedule yet — it's a function you call manually
from the SQL Editor while there's no real signup volume to justify running it
automatically:

```sql
select try_form_groups();
```

This groups any 4+ unmatched profiles that share the same `area` and
`interest`, creates a group, and issues each member their own passcode.

Once there's enough real traffic to make a recurring job worthwhile, this can
move to a scheduled job (Supabase supports `pg_cron` for this) or a Vercel
Cron job that calls a small API route — that's a five-minute change once it's
actually needed.

## Environment variables (Vercel)
Add these in your Vercel project → Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Both values are in your Supabase project → Settings → API.
