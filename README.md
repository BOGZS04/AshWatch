# AshWatch

AshWatch is a private K-drama diary built with React, Vite, Supabase Auth/Postgres/Storage, and an OpenAI-powered recommender.

## Local Setup

1. Install dependencies:

   ```bash
   npm.cmd install --cache ./.npm-cache
   ```

2. Create `.env` from `.env.example` and add your local secrets:

   ```bash
   OPENAI_API_KEY=sk-your-key-here
   OPENAI_MODEL=gpt-4o-mini
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. In Supabase, run `supabase/schema.sql` in the SQL editor. This creates:

   - `profiles`
   - `dramas`
   - `invite_codes`
   - the protected `drama-posters` Storage bucket
   - RLS policies for user-owned data and poster files

4. Create at least one invite code in Supabase:

   ```sql
   insert into public.invite_codes (code, label, max_uses)
   values ('ASHWATCH-2026', 'First testers', 25);
   ```

5. Start the app and local AI API together:

   ```bash
   npm.cmd run dev
   ```

6. Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Vercel Setup

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Required Vercel environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
  - optional `OPENAI_MODEL`

The Vercel API routes handle invite code checks and `/api/recommend`. `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` must stay server-only and must not use the `VITE_` prefix.

## Notes

- Drama data is stored in Supabase per signed-in user.
- New uploaded posters are stored in the protected Supabase Storage bucket.
- Existing static posters and older base64 poster values still render.
- Theme and splash preferences still use browser storage.
- Use the Watchlist backup controls to export or import drama data before risky testing.
