// src/server.js — Bintangin (PIVOT: kartu fisik QR/NFC → aktivasi → Google review)
import express from "express";
import crypto from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { db, cardToken } from "./db.js";
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
const ipHits = new Map();
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

// ---------- auth owner (signed cookie) ----------
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
const COOKIE_NAME = "bt_session";
const ADMIN_EXPIRY_MS = 7 * 24 * 3600 * 1000;

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

// ---------- helpers kartu ----------
function getCard(token) {
  return db.prepare("SELECT * FROM cards WHERE token = ?").get(token);
}
function googleReviewUrlFor(placeId) {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}
function qrFor(url) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;
}

// ---------- landing ----------
app.get("/", (req, res) => {
  const html = LANDING_HTML.replaceAll("{{BASE_URL}}", BASE_URL);
  res.send(html);
});

// ---------- kartu publik: blank → aktivasi; aktif → Google review ----------
app.get("/c/:token", (req, res) => {
  const c = getCard(req.params.token);
  if (!c) return res.status(404).send("Kartu tidak dikenal. Periksa kembali kode kartu.");
  if (c.status === "blank") return res.redirect(`/a/${c.token}`);
  return res.redirect(googleReviewUrlFor(c.place_id));
});

// Halaman aktivasi (publik)
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

// ---------- dashboard: manajemen kartu ----------
app.get("/app", requireAuth, (req, res) => {
  const cards = db.prepare("SELECT * FROM cards ORDER BY id DESC").all();
  res.send(views.dashboard(cards, BASE_URL));
});

// ---------- admin kartu ----------
app.get("/app/cards", requireAuth, (req, res) => {
  const cards = db.prepare("SELECT * FROM cards ORDER BY id DESC").all();
  res.send(views.cardsAdmin(cards, BASE_URL, qrFor));
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

// Cetak kartu kosong (batch, 4 per A4)
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
  res.send(views.printBlankCards(cards, BASE_URL, qrFor));
});

app.get("/privacy", (req, res) => {
  res.send(views.privacy());
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Bintangin (kartu QR/NFC) jalan di ${BASE_URL}`);
});