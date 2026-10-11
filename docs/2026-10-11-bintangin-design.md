# Bintangin — Design Doc (MVP)

> Status: **disetujui arah** · 2026-10-11 · Produk SaaS QR review → Google Maps utk UMKM Indonesia

## 1. Intent & Why

UMKM Indonesia (kafe, warung, barber, toko) sangat bergantung pada review
Google Maps — itu lokomotif pencarian & keputusan pelanggan. Masalahnya:
pelanggan puas jarang nulis review. Produk ini: **QR meja → rating 1 ketukan →
diarahkan menulis review Google asli**, plus feedback internal buat pemilik.

## 2. Keputusan Inti: NON-GATING (legal)

Funnel "hanya 4–5★ ke Google" = **review gating** = dilarang kebijakan
Google (selective solicitation) → risiko penghapusan review & **suspensi
Google Business Profile** venue.

**Keputusan: semua rating (1–5★) boleh lanjut ke Google; rating internal
hanya sinyal laporan buat pemilik. Tidak ada imbalan apa pun ke review
Google (diskon/hadiah = banned).** Ini legal, halal, dan jadi nilai jual:
"100% aman buat listing Google."

## 3. Goals / Non-goals / Anti-goals

**Goals (MVP):**
- Flow inti: scan QR → rating → opsi "tulis di Google" (deep link) + feedback opsional
- Onboarding venue < 5 menit (login via WhatsApp OTP)
- 50 venue uji coba 90 hari, ≥25 konversi paid, ≥1.000 review Google terefer
- Bikin value kelihatan < 30 hari: laporan WhatsApp mingguan

**Non-goals (tunda):** dashboard analytics besar, multi-lokasi penuh,
A/B test, otomasi WhatsApp non-resmi, payment gateway.

**Anti-goals:** melanggar kebijakan Google (gating/imbalan); nomor WhatsApp
pemilik ke-block (pakai API non-resmi); kumpulin data pribadi tanpa consent;
review palsu.

## 4. Constraints

- Solo developer, VPS sendiri, budget kecil
- Stack: **Node.js + Express + better-sqlite3** (selaras skill yang sudah dimiliki)
- WhatsApp: **Cloud API resmi** (free tier; template disetujui) — bukan Baileys/cron
- Frontend: HTML/CSS/JS mobile-first statis (reuse pola WebKit) — muat < 2 dtk di 3G
- Payment: QRIS via Midtrans/Xendit (tahap 2)

## 5. Keputusan yang Diambil (call saya — bisa diganti)

| Hal | Keputusan | Catatan |
|---|---|---|
| Nama | **Bintangin** | Alternatif: Titip Bintang, UlasGO |
| Harga | Gratis 1 venue · **Bekel Rp 49K/bln** (1 venue full) · **Juragan Rp 129K/bln** (3 venue) | Penetrasi; naikkan kalau CAC < Rp 35K |
| QR | Semi-dinamis: short link `/v/{slug}` | Satu kali cetak, routing di server |
| Deep link | `https://search.google.com/local/writereview?placeid=` + fallback pencarian | Validasi place ID wajib |
| Anti-spam | Rate limit per IP + cooldown per device-fingerprint + honeypot | Cukup utk MVP |
| Stack | Express + better-sqlite3, deploy systemd di VPS | Mirip pola yang sudah dipakai |

## 6. Arsitektur MVP

```
GET  /                  → landing page produk
GET  /v/:slug           → halaman rating publik (mobile-first)
POST /v/:slug/rating    → simpan {stars, note?, fp}
                            → halaman konfirmasi: tombol "Tulis di Google"
                              (deep link) + form feedback opsional + "Selesai"
GET  /app               → dashboard owner (login WA OTP): venue, QR, rating,
                            link Google, pengaturan
POST /api/wa/send       → antrean notifikasi WhatsApp (Cloud API)
```

**Schema minimal (SQLite):**
- `venues(id, slug UNIQUE, name, place_id, wa_number, plan, created_at)`
- `ratings(id, venue_id, stars, note, fp_hash, created_at)`
- `wa_queue(id, venue_id, kind, payload, status, created_at)`

Multi-tenancy cukup di level row (`venue_id`) — tidak perlu DB terpisah.

## 7. Alur UX (dari Kreatif)

1. **Scan** QR di meja — copy: *"Gimana tadi? Kasih bintang, 1 detik aja ⭐"*
2. **Rating internal** — 5 bintang besar, satu ketukan: *"Jujur aja, gas atau nggak?"*
3. **Halaman setelah rating** — terima kasih + tombol *"Buka Google Maps"* (deep link;
   tulis sendiri, tanpa imbalan) + kolom "cerita singkat" opsional + tombol Selesai
4. **Tutup** — notif WA ke owner (tanpa nama pelanggan)

QR card fisik: standing 10×15 cm tebal anti-minyak ATAU stiker 7×7 cm; QR
min 3×3 cm kontras tinggi; CTA *"Bintangin, yuk ⭐"* + 5 bintang visual;
QR menghadap atas biar layar pelanggan nggak keliatan orang (anti-malu).

## 8. Data & Kepatuhan (UU PDP 27/2022)

- Simpan: slug, bintang, komentar opsional, fingerprint (hash), timestamp.
  **Tanpa nomor HP pelanggan.**
- Consent satu-tap + tautan kebijakan privasi Bahasa Indonesia sebelum simpan
- Retensi ≤ 12 bulan + mekanisme hapus data
- ToS venue: larang review palsu/paksaan; sanksi suspensi; audit log
  anti-tamper (owner tidak bisa edit/hapus feedback)

## 9. Monetisasi (dari Finance; break-even 7 venue paid)

- Gratis: 1 venue, 50 rating/bln, notif WA terbatas, QR berwatermark
- Bekel Rp 49K/bln: funnel penuh + dashboard + notif unlimited
- Juragan Rp 129K/bln: 3 venue, multi-admin, laporan mingguan WA, prioritas
- Upsell cetak QR card (cost ~Rp 5K → bundle 5 kartu Rp 25–30K)
- Reseller/agen: komisi 25–30% recurring
- Anti-churn: 3 bulan nonaktif → auto-downgrade (data tetap bisa diexport)

## 10. Build Order

1. Skeleton Express + SQLite + migrasi + CRUD venues
2. Halaman rating publik + simpan + halaman konfirmasi (deep link + fallback)
3. Dashboard owner minimal (login token/WA OTP) + generator QR + link Google
4. Notifikasi WhatsApp Cloud API (template disetujui) + antrean
5. Landing page + pricing (reuse WebKit style)
6. Anti-spam: rate limit, fingerprint cooldown, honeypot
7. Deploy systemd + backup (reuse pola yang sudah ada)

## 11. Halal-check (singkat)

Model bisnis jasa langganan & dashboard — bukan judi/riba/barang haram.
Pembayaran QRIS (transparan). Produk membantu UMKM secara riil. ✅

---
*Dihasilkan dari diskusi internal 5 peran (Tech, Marketing, Kreatif/UX,
Legal, Finance) — 2026-10-11.*