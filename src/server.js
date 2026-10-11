// src/server.js — Bintangin MVP: QR review → Google Maps (NON-GATING)
import express from "express";
import crypto from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { db, makeSlug, cardToken } from "./db.js";
import * as views from "./views.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANDING_HTML = readFileSync(path.join(__dirname, "views", "landing.html"), "utf8");

const app = express();
const PORT = process.env.PORT || 5057;
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5057";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// IP asli: prioritaskan header Cloudflare (CF-Connecting-IP), fallback req.ip
const realIp = (req) => req.headers["cf-connecting-ip"] || req.ip;

// ---------- anti-spam sederhana (per-IP rate limit) ----------
const ipHits = new Map(); // ip -> [timestamps]
function rateLimited(ip, limit = 10, windowMs = 60_000) {
  const t = Date.now();
  const arr = (ipHits.get(ip) || []).filter((x) => t - x < windowMs);
  arr.push(t);
  ipHits.set(ip, arr);
  return arr.length > limit;
}
setInterval(() => {
  const t = Date.now();
  for (const [ip, arr] of ipHits) {
    const keep = arr.filter((x) => t - x < 60_000);
    if (keep.length === 0) ipHits.delete(ip); else ipHits.set(ip, keep);
  }
}, 60_000).unref();

// fingerprint sederhana (tanpa PII — hash dari UA + IP + tanggal)
const fpFor = (req) =>
  crypto
    .createHash("sha256")
    .update(`${req.headers["user-agent"] || ""}|${realIp(req)}|${new Date().toISOString().slice(0, 10)}`)
    .digest("hex");

// ---------- auth owner (signed cookie, tanpa dependency eksternal) ----------
const SECRET_FILE = path.join(__dirname, "..", "data", ".session-secret");
mkdirSync(path.dirname(SECRET_FILE), { recursive: true });
function getSecret() {
  if (existsSync(SECRET_FILE)) return readFileSync(SECRET_FILE, "utf8").trim();
  const s = crypto.randomBytes(32).toString("hex");
  writeFileSync(SECRET_FILE, s, { mode: 0o600 });
  return s;
}
const SESSION_SECRET = getSecret();
const ADMIN_PASSWORD = process.env.BINTANGIN_ADMIN_PASSWORD || "bintangin123";
if (!process.env.BINTANGIN_ADMIN_PASSWORD) {
  console.warn("[auth] Peringatan: pakai password default. Set BINTANGIN_ADMIN_PASSWORD di env!");
}
const COOKIE_NAME = "bt_session";
const ADMIN_EXPIRY_MS = 7 * 24 * 3600 * 1000; // 7 hari

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}
function verifyToken(token) {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expect = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!p.exp || p.exp < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}
function getCookie(req, name) {
  const m = new RegExp("(?:^|;\\s*)" + name + "=([^;]+)").exec(req.headers.cookie || "");
  return m ? decodeURIComponent(m[1]) : null;
}
function requireAuth(req, res, next) {
  const tok = getCookie(req, COOKIE_NAME);
  if (tok && verifyToken(tok)) return next();
  return res.redirect("/app/login");
}

// ---------- helpers ----------
function getVenue(slug) {
  return db.prepare("SELECT * FROM venues WHERE slug = ?").get(slug);
}
function googleReviewUrl(placeId, name) {
  if (placeId) return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
  // fallback: pencarian Google (kalau place ID belum diisi)
  return `https://www.google.com/search?q=${encodeURIComponent(name + " review")}`;
}
function qrImageUrl(venue) {
  const url = `${BASE_URL}/v/${venue.slug}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;
}

// ---------- landing (file statis) ----------
app.get("/", (req, res) => {
  // sisipkan BASE_URL yang benar ke template ({BASE_URL} -> domain/ip)
  const html = LANDING_HTML.replaceAll("{{BASE_URL}}", BASE_URL);
  res.send(html);
});

// ---------- halaman rating publik (mobile-first, non-gating) ----------
app.get("/v/:slug", (req, res) => {
  const v = getVenue(req.params.slug);
  if (!v) return res.status(404).send("<h1>Venue nggak ditemukan</h1>");
  res.send(views.rating(v));
});

// POST rating → simpan → arahkan ke halaman terima kasih (non-gating: SEMUA bintang)
app.post("/v/:slug/rating", (req, res) => {
  const v = getVenue(req.params.slug);
  if (!v) return res.status(404).send("<h1>Venue nggak ditemukan</h1>");
  const stars = parseInt(req.body?.stars, 10);
  if (!(stars >= 1 && stars <= 5)) return res.status(400).send("Bintang harus 1–5.");
  if (rateLimited(realIp(req))) return res.status(429).send("Kebanyakan request, coba lagi nanti.");

  const fp = fpFor(req);
  // cooldown per fp: maks 1 rating per detik (anti-spam buta)
  const last = db.prepare("SELECT MAX(created_at) AS t FROM ratings WHERE fp_hash = ?").get(fp)?.t;
  if (last && Date.now() - new Date(last + "Z").getTime() < 1000)
    return res.status(429).send("Terlalu cepat, tunggu sebentar ya.");

  const note = (req.body?.note || "").toString().trim().slice(0, 500) || null;
  const info = db
    .prepare("INSERT INTO ratings (venue_id, stars, note, fp_hash) VALUES (?, ?, ?, ?)")
    .run(v.id, stars, note, fp);
  return res.redirect(`/v/${v.slug}/thanks?r=${info.lastInsertRowid}`);
});

// halaman terima kasih + opsi "tulis di Google" (deep link) + feedback opsional
app.get("/v/:slug/thanks", (req, res) => {
  const v = getVenue(req.params.slug);
  if (!v) return res.status(404).send("<h1>Venue nggak ditemukan</h1>");
  res.send(views.thanks(v, encodeURIComponent(req.query.r || ""), req.query.done === "1"));
});

// POST feedback internal (tanpa nama pelanggan)
app.post("/v/:slug/note", (req, res) => {
  const v = getVenue(req.params.slug);
  if (!v) return res.status(404).send("<h1>Venue nggak ditemukan</h1>");
  const note = (req.body?.note || "").toString().trim().slice(0, 500);
  if (note) {
    db.prepare("UPDATE ratings SET note = ? WHERE id = ?")
      .run(note, parseInt(req.query.r, 10) || 0);
  }
  res.redirect(`/v/${v.slug}/thanks?r=${encodeURIComponent(req.query.r || "")}&done=1`);
});

// ---------- auth routes ----------
app.get("/app/login", (req, res) => {
  const tok = getCookie(req, COOKIE_NAME);
  if (tok && verifyToken(tok)) return res.redirect("/app");
  res.send(views.login(req.query.e === "1"));
});

app.post("/app/login", (req, res) => {
  const pw = (req.body?.password || "").toString();
  const ok = Buffer.from(ADMIN_PASSWORD);
  const given = Buffer.from(pw);
  const match = given.length === ok.length && crypto.timingSafeEqual(ok, given);
  if (!match) return res.redirect("/app/login?e=1");
  const token = sign({ role: "owner", exp: Date.now() + ADMIN_EXPIRY_MS });
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${ADMIN_EXPIRY_MS / 1000}; SameSite=Lax`
  );
  return res.redirect("/app");
});

app.post("/app/logout", (req, res) => {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0`);
  return res.redirect("/app/login");
});

// ---------- dashboard owner ----------
app.get("/app", requireAuth, (req, res) => {
  const venues = db.prepare("SELECT * FROM venues ORDER BY id").all();
  const rows = venues.map((v) => {
    const agg = db
      .prepare("SELECT COUNT(*) c, AVG(stars) avg FROM ratings WHERE venue_id = ?")
      .get(v.id);
    const recent = db
      .prepare("SELECT stars, note, created_at FROM ratings WHERE venue_id = ? ORDER BY id DESC LIMIT 8")
      .all(v.id);
    return { ...v, c: agg.c || 0, avg: agg.avg ? Number(agg.avg.toFixed(2)) : 0, recent };
  });
  const total = rows.reduce((s, r) => s + r.c, 0);
  res.send(views.dashboard({ rows, total, base: BASE_URL, qrUrl: qrImageUrl, googleUrl: googleReviewUrl }));
});

app.post("/app/venues", requireAuth, (req, res) => {
  const name = (req.body?.name || "").toString().trim();
  if (!name) return res.status(400).send("Nama venue wajib.");
  const placeId = (req.body?.place_id || "").toString().trim() || null;
  db.prepare("INSERT INTO venues (slug, name, place_id, plan) VALUES (?, ?, ?, 'free')")
    .run(makeSlug(name), name, placeId);
  res.redirect("/app");
});

// ---------- edit & delete venue ----------
app.get("/app/venues/:id/edit", requireAuth, (req, res) => {
  const v = db.prepare("SELECT * FROM venues WHERE id = ?").get(req.params.id);
  if (!v) return res.status(404).send("Venue nggak ditemukan");
  res.send(views.editVenue(v));
});

app.post("/app/venues/:id/edit", requireAuth, (req, res) => {
  const v = db.prepare("SELECT * FROM venues WHERE id = ?").get(req.params.id);
  if (!v) return res.status(404).send("Venue nggak ditemukan");
  const name = (req.body?.name || "").toString().trim();
  if (!name) return res.status(400).send("Nama venue wajib.");
  const placeId = (req.body?.place_id || "").toString().trim() || null;
  db.prepare("UPDATE venues SET name = ?, place_id = ? WHERE id = ?").run(name, placeId, v.id);
  res.redirect("/app");
});

app.post("/app/venues/:id/delete", requireAuth, (req, res) => {
  const v = db.prepare("SELECT * FROM venues WHERE id = ?").get(req.params.id);
  if (!v) return res.status(404).send("Venue nggak ditemukan");
  db.prepare("DELETE FROM venues WHERE id = ?").run(v.id); // ratings ikut terhapus (cascade)
  res.redirect("/app");
});

// ---------- print card ----------
app.get("/app/venues/:id/print", requireAuth, (req, res) => {
  const v = db.prepare("SELECT * FROM venues WHERE id = ?").get(req.params.id);
  if (!v) return res.status(404).send("Venue nggak ditemukan");
  res.send(views.printCard(v, BASE_URL, qrImageUrl));
});

// ---------- download QR (proxy server-side biar download atribut jalan) ----------
app.get("/app/venues/:id/qr", requireAuth, (req, res) => {
  const v = db.prepare("SELECT * FROM venues WHERE id = ?").get(req.params.id);
  if (!v) return res.status(404).send("Venue nggak ditemukan");
  const url = `${BASE_URL}/v/${v.slug}`;
  const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=16&data=${encodeURIComponent(url)}`;
  const slug = v.slug || `venue-${v.id}`;
  const filename = `bintangin-${slug}.png`;
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  // fetch server-side lalu pipe biar selalu jalan sebagai download
  fetch(qrApi)
    .then((r) => {
      if (!r.ok) throw new Error("qr upstream " + r.status);
      res.setHeader("Content-Type", "image/png");
      Readable.fromWeb(r.body).pipe(res);
    })
    .catch(() => {
      res.status(502).send("Gagal generate QR, coba lagi.");
    });
});

// ---------- kartu fisik (blank QR/NFC → aktivasi → Google review) ----------
function getCard(token) {
  return db.prepare("SELECT * FROM cards WHERE token = ?").get(token);
}
function cardUrl(token) {
  return `${BASE_URL}/c/${token}`;
}
function googleReviewUrlFor(placeId) {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

// Kartu publik: blank → halaman aktivasi; aktif → langsung Google review
app.get("/c/:token", (req, res) => {
  const c = getCard(req.params.token);
  if (!c) return res.status(404).send("Kartu tidak dikenal. Periksa kembali kode kartu.");
  if (c.status === "blank") return res.redirect(`/a/${c.token}`);
  return res.redirect(googleReviewUrlFor(c.place_id));
});

// Halaman aktivasi (publik) — modal cari nama tempat via Google Places
app.get("/a/:token", (req, res) => {
  const c = getCard(req.params.token);
  if (!c) return res.status(404).send("Kartu tidak dikenal.");
  if (c.status === "activated") return res.redirect(googleReviewUrlFor(c.place_id));
  res.send(views.activateCard(c, BASE_URL, !!process.env.GOOGLE_PLACES_API_KEY));
});

app.post("/a/:token", (req, res) => {
  const c = getCard(req.params.token);
  if (!c) return res.status(404).send("Kartu tidak dikenal.");
  if (c.status === "activated") return res.redirect(googleReviewUrlFor(c.place_id));
  const placeId = (req.body?.place_id || "").toString().trim();
  const placeName = (req.body?.place_name || "").toString().trim();
  if (!placeId || !placeName) return res.status(400).send("Pilih tempat dari daftar Google dulu.");
  db.prepare("UPDATE cards SET status='activated', place_id=?, place_name=?, activated_at=datetime('now') WHERE id=?")
    .run(placeId, placeName, c.id);
  res.redirect(`/c/${c.token}`);
});

// Proxy autocomplete Google Places (jaga API key di server)
app.get("/api/places", (req, res) => {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return res.status(501).json({ error: "GOOGLE_PLACES_API_KEY belum di-set" });
  const q = (req.query.q || "").toString().trim();
  if (q.length < 3) return res.json({ predictions: [] });
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&components=country:id&types=establishment&key=${encodeURIComponent(key)}`;
  fetch(url)
    .then((r) => r.json())
    .then((d) => {
      const pred = (d.predictions || []).map((p) => ({ place_id: p.place_id, desc: p.description }));
      res.json({ predictions: pred });
    })
    .catch(() => res.status(502).json({ error: "Google Places gagal" }));
});

// ---------- admin kartu ----------
app.get("/app/cards", requireAuth, (req, res) => {
  const cards = db.prepare("SELECT * FROM cards ORDER BY id DESC").all();
  res.send(views.cardsAdmin(cards, BASE_URL, qrImageUrl));
});

app.post("/app/cards/generate", requireAuth, (req, res) => {
  const count = Math.min(Math.max(parseInt(req.body?.count, 10) || 10, 1), 200);
  const ins = db.prepare("INSERT INTO cards (token) VALUES (?)");
  for (let i = 0; i < count; i++) ins.run(cardToken());
  res.redirect("/app/cards");
});

app.post("/app/cards/:id/reset", requireAuth, (req, res) => {
  const c = db.prepare("SELECT * FROM cards WHERE id = ?").get(req.params.id);
  if (!c) return res.status(404).send("Kartu tidak ditemukan");
  db.prepare("UPDATE cards SET status='blank', place_id=NULL, place_name=NULL, activated_at=NULL WHERE id=?").run(c.id);
  res.redirect("/app/cards");
});

// Cetak kartu kosong (batch, 4 per A4) — filter ?ids= atau semua blank
app.get("/app/cards/print", requireAuth, (req, res) => {
  let cards;
  const ids = (req.query.ids || "").toString();
  if (ids) {
    const list = ids.split(",").map(Number).filter(Boolean);
    cards = db.prepare(`SELECT * FROM cards WHERE id IN (${list.map(() => "?").join(",")})`).all(...list);
  } else {
    cards = db.prepare("SELECT * FROM cards WHERE status='blank' ORDER BY id DESC LIMIT 16").all();
  }
  if (!cards.length) return res.status(404).send("Tidak ada kartu untuk dicetak.");
  res.send(views.printBlankCards(cards, BASE_URL, qrImageUrl));
});

app.get("/privacy", (req, res) => {
  res.send(views.privacy());
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Bintangin MVP jalan di ${BASE_URL}`);
});