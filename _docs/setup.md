# SehatGak — External Services Setup

Setup guide for each external service. Do this before starting development.

---

## 1. Supabase

### 1.1 Create project
1. [supabase.com](https://supabase.com) → **New project**
2. Name: `sehatgak`
3. Database password: generate a strong one, save in your password manager
4. Region: **Southeast Asia (Singapore)** — closest to Indonesia
   > Region is selected from a dropdown, not by country. Look for "Southeast Asia (Singapore)" specifically — it may default to Seoul if skipped.
5. Wait ~2 min for provisioning

### 1.2 API settings
Dashboard → **Project Settings** → **General** → scroll to **API settings**:

| Setting | Value | Why |
|---|---|---|
| Enable Data API | ✅ ON | Required for `supabase-js` to work |
| Automatically expose new tables | ❌ OFF | Prevents accidental public exposure of future tables |
| Enable automatic RLS | ✅ ON | New tables are locked down by default |

### 1.3 Run schema
Dashboard → **SQL Editor** → **New query** → paste and run:

```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  merek text,
  varian text,
  ukuran_ml int,
  gula_total_g numeric,
  laktosa_g numeric,
  natrium_mg numeric,
  lemak_jenuh_g numeric,
  takaran_saji_ml int not null,
  has_sweetener_additive boolean,
  has_only_natural_sweetener boolean,
  level char(1) not null check (level in ('A','B','C','D')),
  worst_nutrient text not null,
  worst_display_percent int,
  image_url text,
  created_at timestamptz default now()
);

create index products_nama_idx on products using gin (to_tsvector('simple', nama));

alter table products enable row level security;
create policy "public read" on products for select using (true);
create policy "public insert" on products for insert with check (true);
```

### 1.4 Get credentials

**Project URL**
1. **Settings → General**
2. Find **Reference ID** (looks like `ucwb2alfmux...`)
3. Construct the URL: `https://<reference-id>.supabase.co`
4. Copy → goes into `NEXT_PUBLIC_SUPABASE_URL`

**API key**
1. **Settings → API Keys** → **Publishable and secret API keys** tab
2. Under **Publishable key** → copy the `sb_publishable_...` value → goes into `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Secret key** section → ignore entirely, never put in the app

> Supabase renamed keys in 2025: `Publishable` = old `anon`, `Secret` = old `service_role`.
> The publishable key is safe to expose in the browser — RLS policies (set in step 1.3) control access, not key secrecy.

---

## 2. Gemini API

### 2.1 Get API key
1. [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Select project `ykrn` (billing-linked project — billing account must be open and linked)
3. **Create API key** → copy immediately → goes into `GEMINI_API_KEY`

### 2.2 Verify key works
```bash
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Reply with exactly: OK"}]}]}' \
  | grep -o '"text": "[^"]*"'
# expected: "text": "OK"
```

### 2.3 Rules
- Never commit the key or paste it in chat
- Rotate at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) if ever exposed
- Must always stay as `GEMINI_API_KEY`, never `NEXT_PUBLIC_GEMINI_API_KEY`

---

## 3. Netlify

### 3.1 GitHub repo
The repo (`majimawrks/sehatgak`) must be **public** — Netlify free tier does not support private repos.
API keys are safe as long as they're in env vars and never committed to code.

### 3.2 Create site
1. [netlify.com](https://netlify.com) → sign up / log in
2. **Add new site** → **Import an existing project** → connect GitHub → select `majimawrks/sehatgak`
3. Build settings:
   - Build command: `bun run build`
   - Publish directory: `.next`
4. Click **Deploy site** — first deploy will fail (empty repo), that's expected

### 3.3 Set environment variables
Dashboard → **Site configuration** → **Environment variables** → **Add variable**:

**`GEMINI_API_KEY`**
- Toggle **"Contains secret values"** ON — hides it from the UI after saving
- This forces per-context input; paste the key into **Production** field only
- Leave Deploy Previews, Branch deploys, Local development empty

**`NEXT_PUBLIC_SUPABASE_URL`** and **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
- Leave "Contains secret values" OFF (these are intentionally public)
- Scope: All scopes, Same value for all deploy contexts

**`NEXT_TELEMETRY_DISABLED`**
- Value: `1`
- Same value for all contexts

### 3.4 Custom domain
Follow `_docs/domain-setup.md` to map `sehatgak.majima.dev`.
Do this after the first successful deploy.

---

## 4. Cloudflare (DNS only)

`majima.dev` is already on Cloudflare. Full domain + SSL instructions: `_docs/domain-setup.md`.

> **Note:** When adding the custom domain in Netlify, it will ask you to verify ownership of `majima.dev` first via a TXT record before allowing the CNAME. Add the TXT record in Cloudflare DNS, then proceed with the CNAME steps in `domain-setup.md`.

---

## Credentials Reference

| Secret | `.env.local` key | Safe to expose? |
|---|---|---|
| Gemini API key | `GEMINI_API_KEY` | ❌ server only |
| Supabase project URL | `NEXT_PUBLIC_SUPABASE_URL` | ✅ intentionally public |
| Supabase anon key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ intentionally public |
| Supabase DB password | — (dashboard only) | ❌ never in code |
