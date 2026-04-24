# SehatGak

Scan label minuman kemasan Indonesia dan dapatkan nilai **Nutri-Level A/B/C/D** sesuai KMK HK.01.07/MENKES/301/2026.

Tersedia di **[sehatgak.majima.dev](https://sehatgak.majima.dev)**

---

## Cara kerja

1. Scan barcode kemasan — jika produk sudah ada di database, hasil langsung ditampilkan
2. Jika belum ada, foto label nilai gizi — Gemini OCR membaca angka GGL (Gula, Garam, Lemak) secara otomatis
3. Periksa & lengkapi data, lalu simpan ke database bersama

---

## Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 + TypeScript strict + Tailwind CSS v4 |
| Database | Supabase (Postgres) — region Singapore |
| OCR | Gemini 2.5 Flash via REST (server-side) |
| Testing | Vitest |
| Package manager | Bun |
| Hosting | Netlify → Cloudflare proxy |

---

## Setup lokal

### 1. Prasyarat

- [Bun](https://bun.sh) ≥ 1.1
- Supabase project (lihat langkah 2)
- Gemini API key dari [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### 2. Supabase schema

Buat project Supabase baru (region: Singapore), lalu jalankan query berikut di SQL Editor:

```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  merek text,
  barcode text,
  category text not null default 'minuman' check (category in ('minuman', 'snack', 'makanan', 'lainnya')),
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

### 3. Environment variables

Buat file `.env.local` di root project:

```
GEMINI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://<reference-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

- `GEMINI_API_KEY` — dari Google AI Studio, **jangan pernah commit atau expose ke client**
- `NEXT_PUBLIC_SUPABASE_URL` — dari Settings → General → Reference ID
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — dari Settings → API Keys → Publishable key (`sb_publishable_...`)

> Publishable key aman di-expose ke browser — akses dikontrol oleh RLS policies, bukan kerahasiaan key.

### 4. Jalankan dev server

```bash
bun install
bun dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## Scripts

```bash
bun dev          # dev server (hot reload)
bun run build    # production build
bun run test     # jalankan unit tests (Vitest)
bun run lint     # ESLint
```

---

## Lisensi

MIT
