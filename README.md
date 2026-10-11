# Bintangin ⭐

QR review funnel ke Google Maps untuk UMKM Indonesia.

**Review Google Maps naik, tanpa nanya-nanya pelanggan.** QR meja → pelanggan kasih bintang dalam 1 ketukan → diarahkan nulis review Google asli. Legal, halal, non-gating, tanpa imbalan.

## Fitur

- 🎨 Landing page + halaman rating mobile-first (Plus Jakarta Sans, SVG icons)
- 📱 Alur pelanggan: scan QR → rating 1–5 → halaman thanks + deep link Google Maps (`writereview?placeid=...`)
- 🛡️ **Non-gating**: semua rating bebas lanjut ke Google — zero review palsu, tanpa imbalan, aman kebijakan Google
- 📋 Dashboard owner: kelola venue, generate & **download QR**, edit & hapus venue, lihat rating masuk
- 🔐 Auth signed-cookie (HMAC), tanpa dependency eksternal
- 🚫 Anti-spam: rate limit per-IP + cooldown per-device-fingerprint
- 🔒 Privasi (UU PDP 27/2022): tanpa PII pelanggan, retensi 12 bulan, hak hapus

## Stack

- **Node.js** (≥22.5) + Express — `node:sqlite` bawaan (tanpa native dependency)
- SQLite (WAL), systemd service, Cloudflare Tunnel untuk akses publik

## Instalasi

```bash
npm install
npm run migrate          # bikin DB + seed venue demo
BINTANGIN_ADMIN_PASSWORD=rahasia PORT=5057 BASE_URL=http://localhost:5057 node src/server.js
```

## Struktur

```
src/
├── server.js          # routes + auth + anti-spam
├── db.js              # node:sqlite + migrasi
├── views.js           # render halaman (rating, thanks, login, dashboard, privacy)
└── views/landing.html # landing page statis
```

## Lisensi

MIT © 2026 Bintangin — dibuat untuk UMKM Indonesia.