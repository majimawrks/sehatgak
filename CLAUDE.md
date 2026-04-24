# SehatGak — Project Context

Read this first. It gives you full project state so you can pick up without re-explaining anything.

---

## What this project is

Web app that lets users scan Indonesian beverage labels and get a Nutri-Level grade (A/B/C/D) per **KMK HK.01.07/MENKES/301/2026**. Users can also save products to a shared database so others can look them up without re-scanning.

Regulation text: `_docs/regulation/kmk301.txt`
Full plan: `_docs/plans/plan-v1.md` ← read this before writing any code

---

## Current status

| Phase | Status |
|---|---|
| Infrastructure & planning | ✅ Done |
| Phase 1 — Calc core + tests | ✅ Done |
| Phase 2 — UI shell | ✅ Done |
| Phase 3 — Supabase integration | ✅ Done |
| Phase 4 — Gemini OCR | ✅ Done |
| Phase 5 — Polish | ✅ Done |

**Next task:** v1 feature-complete. Remaining before declaring done:
- Run Supabase migration: `ALTER TABLE products ADD COLUMN category text NOT NULL DEFAULT 'minuman' CHECK (category IN ('minuman', 'snack', 'makanan', 'lainnya'));`
- End-to-end scan test with a real beverage label (including ingredient-only product)
- Visual check that KMK level colors match spec on screen, in both light and dark mode
- Write README.md with setup instructions (env vars, Supabase SQL, `bun dev`)
- Code review + security review (hand to Opus)

---

## Stack (locked — do not change)

- **Framework:** Next.js 15 + TypeScript (strict) + Tailwind CSS v4
- **DB:** Supabase (Postgres) — project `sehatgak`, region Singapore
- **OCR:** Gemini 2.5 Flash via REST — server-side only, key never in client
- **Testing:** Vitest — calc module only
- **Package manager:** `bun`
- **Deploy:** Netlify → `sehatgak.majima.dev` (Cloudflare proxy in front)

---

## Key decisions made (and why)

- **Gemini over Tesseract** — OCR accuracy on phone photos of curved/glossy labels is too poor with Tesseract. Gemini costs ~$0.0002/scan.
- **Netlify over Vercel** — Vercel had a security incident (April 2026, env vars leaked). Netlify free tier is equivalent.
- **Public repo** — Netlify free tier requires public repos. Safe because secrets are in env vars, never in code.
- **Cloudflare proxy** — `majima.dev` is already on Cloudflare; free DDoS protection with no extra work.
- **No auth for v1** — anonymous public read/insert via RLS. Add auth later if spam becomes a problem.
- **Supabase anon key is `NEXT_PUBLIC_`** — intentional; access is controlled by RLS policies, not key secrecy.

---

## Infrastructure (all done)

- Supabase project created, schema deployed, RLS policies set
- Netlify site connected to `majimawrks/sehatgak` repo
- Env vars set in Netlify: `GEMINI_API_KEY` (secret), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `sehatgak.majima.dev` → Cloudflare (proxied, Full strict SSL) → Netlify ✅
- SSL cert provisioned via Let's Encrypt through Netlify

---

## Env vars needed locally

Create `.env.local` at project root (never commit this):
```
GEMINI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

Ask the project owner for values if missing. Do not generate or guess them.

---

## Important files

| File | Purpose |
|---|---|
| `_docs/plans/plan-v1.md` | Full implementation plan — read before coding |
| `_docs/regulation/kmk301.txt` | KMK 301/2026 extracted text — ground truth for calc logic |
| `_docs/setup.md` | External services setup guide |
| `_docs/domain-setup.md` | Cloudflare + Netlify domain wiring |
| `CHANGELOG.md` | Version history — update with every meaningful change |

---

## Coding rules (summary — full list in plan-v1.md §9)

- TypeScript strict, no `any`
- Zod at all trust boundaries (API inputs, Gemini output, Supabase rows)
- Calc module: pure functions only, no side effects
- All user-facing copy in Bahasa Indonesia
- No auth, no state management libs, no component libs, no i18n libs for v1
- Every meaningful change gets a `CHANGELOG.md` entry
- Create `_docs/` files when they'd help future sessions

---

## Gotchas discovered during setup

- Supabase defaults to Seoul region — must manually select Singapore
- Supabase renamed `anon` → `Publishable key`, `service_role` → `Secret key` (2025 UI update)
- Supabase project URL is in Settings → General (Reference ID), not the API Keys page
- Netlify free tier requires public repo
- Netlify domain setup requires a TXT ownership verification record before the CNAME
- Netlify "Contains secret values" forces per-context input — only fill Production for `GEMINI_API_KEY`
- Cloudflare proxy must be OFF (grey cloud) while Netlify provisions SSL cert, then ON after
- `NEXT_PUBLIC_SUPABASE_URL` in Netlify must include `https://` — e.g. `https://xxxx.supabase.co`. Without it, Supabase client throws "Invalid supabaseUrl" and all pages 500.

---

## Update instructions (for any session)

When you complete work, update this file:
1. Tick off completed phases in the status table
2. Update "Next task" to reflect what's actually next
3. Add any new gotchas discovered
4. Bump `CHANGELOG.md` with what changed
