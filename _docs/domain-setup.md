# Domain Setup — sehatgak.majima.dev

## Architecture
```
User → Cloudflare (DDoS + SSL) → Netlify (origin)
```
`majima.dev` is on Cloudflare — use it as proxy for free DDoS protection and SSL.

---

## Step 1 — Add domain in Netlify

1. Netlify dashboard → **Site configuration** → **Domain management** → **Add a domain**
2. Enter `sehatgak.majima.dev` → Verify → Add domain
3. Note your Netlify subdomain (e.g. `amazing-croissant-123.netlify.app`)

---

## Step 2 — Add CNAME in Cloudflare (proxy OFF first)

In Cloudflare dashboard → `majima.dev` → **DNS** → **Add record**:

```
Type:   CNAME
Name:   sehatgak
Target: amazing-croissant-123.netlify.app   ← your actual Netlify subdomain
Proxy:  OFF (grey cloud) ← important: off for now
TTL:    Auto
```

Netlify needs direct access to provision its SSL cert via ACME HTTP challenge.
If Cloudflare proxy is ON at this stage, the challenge fails and no cert gets issued.

---

## Step 3 — Wait for Netlify SSL cert

Back in Netlify → Domain management → watch for **"Certificate provisioned"** (green).
Usually under 10 minutes. If it stalls, click "Renew certificate" once.

---

## Step 4 — Enable Cloudflare proxy

Once Netlify shows the cert is live:

1. Cloudflare DNS → find the `sehatgak` CNAME → **edit** → toggle proxy to **ON (orange cloud)**
2. Cloudflare dashboard → `majima.dev` → **SSL/TLS** → set encryption mode to **Full (strict)**
   - "Full" = Cloudflare connects to Netlify over HTTPS
   - "Strict" = Cloudflare validates Netlify's cert (safe because Netlify already provisioned one in Step 3)

---

## What you get after this

- `sehatgak.majima.dev` served over Cloudflare's edge (100+ PoPs globally)
- Unmetered DDoS mitigation (Cloudflare free tier includes this)
- SSL handled by Cloudflare Universal SSL (user ↔ Cloudflare) + Netlify cert (Cloudflare ↔ Netlify)
- Netlify's origin IP hidden behind Cloudflare

---

## Verify

```bash
# Should return Cloudflare IPs, not Netlify directly
nslookup sehatgak.majima.dev

# Should show Cloudflare headers
curl -I https://sehatgak.majima.dev
# Look for: server: cloudflare
```

---

## Notes
- Never set Cloudflare SSL to "Flexible" — it sends traffic to Netlify over plain HTTP, which Netlify rejects
- If you ever need to renew the Netlify cert in future: temporarily set proxy back to grey cloud, renew, re-enable orange cloud
