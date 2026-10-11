// src/server.js — Bintangin v3: multi-akun UMKM, kuota aktivasi, referal, order manual.
import express from "express";
import crypto from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  db, cardToken, getCard, cardsOf, accountById, accountByUsername, accountByReferral,
  hashPassword, verifyPassword, makeReferralCode, addQuota, consumeQuota, setTier,
} from "./db.js";
import * as views from "./views.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANDING_HTML = readFileSync(path.join(__dirname, "views", "landing.html"), "utf8");

const app = express();
const PORT = process.env.PORT || 5057;
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5057";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const realIp = (req) => req.headers["cf-connecting-ip"] || req.ip;

// ---------- rate limit ----------
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

// ---------- signed cookie session ----------
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
const COOKIE_ACCOUNT = "bt_session";   // sesi akun UMKM
const COOKIE_ADMIN = "bt_admin";       // sesi admin panel
const EXPIRY_MS = 7 * 24 * 3600 * 1000;

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
function setCookie(res, name, token) {
  res.setHeader("Set-Cookie", `${name}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${EXPIRY_MS / 1000}; SameSite=Lax`);
}
function clearCookie(res, name) {
  res.setHeader("Set-Cookie", `${name}=; HttpOnly; Path=/; Max-Age=0`);
}

// middleware: wajib login akun UMKM
function requireAccount(req, res, next) {
  const tok = getCookie(req, COOKIE_ACCOUNT);
  const p = tok && verifyToken(tok);
  const acc = p && p.uid ? accountById(p.uid) : null;
  if (!acc) {
    const nextUrl = req.originalUrl || "/app";
    return res.redirect(`/app/masuk?next=${encodeURIComponent(nextUrl)}`);
  }
  req.account = acc;
  next();
}
// middleware: wajib login admin
function requireAdmin(req, res, next) {
  const tok = getCookie(req, COOKIE_ADMIN);
  const p = tok && verifyToken(tok);
  if (!p || p.role !== "admin") return res.redirect("/admin/login");
  next();
}

// ---------- helpers ----------
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

// ---------- kartu publik ----------
app.get("/c/:token", (req, res) => {
  const c = getCard(req.params.token);
  if (!c) return res.status(404).send("Kartu tidak dikenal.");
  if (c.status === "blank") return res.redirect(`${BASE_URL}/a/${c.token}`);
  return res.redirect(googleReviewUrlFor(c.place_id));
});

// Halaman aktivasi: wajib login & jadi pemilik kartu
app.get("/a/:token", (req, res) => {
  const c = getCard(req.params.token);
  if (!c) return res.status(404).send("Kartu tidak dikenal.");
  if (c.status === "activated") return res.redirect(googleReviewUrlFor(c.place_id));
  const tok = getCookie(req, COOKIE_ACCOUNT);
  const p = tok && verifyToken(tok);
  const acc = p && p.uid ? accountById(p.uid) : null;
  if (!acc) return res.redirect(`/app/masuk?next=${encodeURIComponent(`/a/${c.token}`)}`);
  if (acc.id !== c.account_id) return res.status(403).send("Kartu ini milik akun lain.");
  if (acc.tier !== "juragan" && c.tier === "paid")
    return res.status(403).send("Kartu NFC+QR hanya bisa diaktivasi akun Juragan.");
  res.send(views.activateCard(c, acc, BASE_URL, !!process.env.GOOGLE_PLACES_API_KEY));
});

function extractPlaceFromUrl(raw) {
  const u = String(raw || "").trim();
  if (!u) return null;
  const q = u.match(/[?&]q=place_id:([A-Za-z0-9:_\-]+)/);
  if (q) return { place_id: q[1] };
  const d = u.match(/!1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);
  if (d) return { place_id: d[1] };
  const f = u.match(/[?&]ftid=([A-Za-z0-9:_\-]+)/);
  if (f) return { place_id: f[1] };
  return null;
}
function placeNameFromUrl(raw) {
  const m = String(raw || "").match(/\/place\/([^/@?]+)/);
  if (!m) return "";
  return decodeURIComponent(m[1].replace(/\+/g, " ")).trim();
}
async function resolveMapsShortLink(url) {
  try {
    const u = new URL(url);
    const allowed = /(^|\.)(goo\.gl|g\.co|google\.com|googleusercontent\.com)$/i.test(u.hostname);
    if (!allowed) return null;
    const r = await fetch(u.toString(), { redirect: "follow", signal: AbortSignal.timeout(6000) });
    return r.url || null;
  } catch {
    return null;
  }
}

app.post("/a/:token", requireAccount, async (req, res) => {
  const ip = realIp(req);
  if (rateLimited(ip)) return res.status(429).send("Terlalu banyak percobaan. Coba lagi beberapa menit.");
  const c = getCard(req.params.token);
  if (!c) return res.status(404).send("Kartu tidak dikenal.");
  if (c.status === "activated") return res.redirect(googleReviewUrlFor(c.place_id));
  if (req.account.id !== c.account_id) return res.status(403).send("Kartu ini milik akun lain.");
  if (req.account.tier !== "juragan" && c.tier === "paid")
    return res.status(403).send("Kartu NFC+QR hanya bisa diaktivasi akun Juragan.");

  const body = req.body || {};
  let placeId = (body.place_id || "").toString().trim();
  let placeName = (body.place_name || "").toString().trim();
  let mapsGiven = false;
  if (!placeId) {
    const mapsUrl = (body.maps_url || "").toString().trim();
    if (mapsUrl) {
      mapsGiven = true;
      const parsed = extractPlaceFromUrl(mapsUrl);
      if (parsed) {
        placeId = parsed.place_id;
        placeName = placeName || placeNameFromUrl(mapsUrl) || placeId;
      } else {
        const resolved = await resolveMapsShortLink(mapsUrl);
        if (resolved) {
          const p2 = extractPlaceFromUrl(resolved);
          if (p2) {
            placeId = p2.place_id;
            placeName = placeName || placeNameFromUrl(resolved) || placeId;
          }
        }
      }
    }
  }
  if (!placeId) {
    if (mapsGiven) return res.status(400).send("Link Google Maps tidak dikenali. Pastikan pakai link dari Share → Copy link di app Google Maps.");
    return res.status(400).send("Pilih tempat dari daftar Google atau tempel link Maps.");
  }
  // konsumsi kuota
  if (!consumeQuota(req.account.id))
    return res.status(402).send("Kuota aktivasi habis. Top up 20rb/aktivasi di dashboard.");
  db.prepare("UPDATE cards SET status='activated', place_id=?, place_name=?, activated_at=datetime('now') WHERE id=?")
    .run(placeId, placeName, c.id);
  res.redirect(`${BASE_URL}/c/${c.token}`);
});

// Proxy autocomplete (opsional; butuh API key)
app.get("/api/places", (req, res) => {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return res.status(501).json({ error: "GOOGLE_PLACES_API_KEY belum di-set" });
  const q = (req.query.q || "").toString().trim();
  if (q.length < 3) return res.json({ predictions: [] });
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&components=country:id&types=establishment&key=${encodeURIComponent(key)}`;
  fetch(url)
    .then((r) => r.json())
    .then((d) => res.json({ predictions: (d.predictions || []).map((p) => ({ place_id: p.place_id, desc: p.description })) }))
    .catch(() => res.status(502).json({ error: "Google Places gagal" }));
});

// ================= AKUN UMKM =================
app.get("/app/daftar", (req, res) => {
  const tok = getCookie(req, COOKIE_ACCOUNT);
  const p = tok && verifyToken(tok);
  if (p && p.uid) return res.redirect("/app");
  res.send(views.daftar(req.query.e || "", req.query.k || ""));
});

app.post("/app/daftar", (req, res) => {
  const ip = realIp(req);
  if (rateLimited(ip, 5, 60_000)) return res.status(429).send("Terlalu banyak percobaan daftar. Tunggu 1 menit.");
  const name = (req.body?.name || "").toString().trim();
  const username = (req.body?.username || "").toString().trim().toLowerCase();
  const password = (req.body?.password || "").toString();
  const referral = (req.body?.referral || "").toString().trim().toUpperCase();

  if (name.length < 2 || !username || password.length < 6)
    return res.send(views.daftar("Lengkapi nama usaha, username, dan password minimal 6 karakter.", referral));
  if (!/^[a-z0-9_]{3,20}$/.test(username))
    return res.send(views.daftar("Username 3-20 karakter: huruf kecil, angka, underscore.", referral));
  if (accountByUsername(username))
    return res.send(views.daftar("Username sudah dipakai, coba yang lain.", referral));

  // 1 IP hanya boleh 1 akun (anti nuyul gratisan)
  const sameIp = db.prepare("SELECT id FROM accounts WHERE ip_reg=?").get(ip);
  if (sameIp) return res.status(403).send("Dari perangkat/alamat IP ini sudah pernah daftar. 1 IP hanya untuk 1 akun.");

  const refAcc = referral ? accountByReferral(referral) : null;
  if (referral && !refAcc)
    return res.send(views.daftar("Kode referal tidak ditemukan. Cek lagi atau kosongkan.", referral));

  const ins = db.prepare(
    "INSERT INTO accounts (username, name, pass_hash, referral_code, referred_by, ip_reg) VALUES (?,?,?,?,?,?)"
  );
  ins.run(username, name, hashPassword(password), makeReferralCode(), refAcc ? refAcc.id : null, ip);
  const acc = accountByUsername(username);
  // akun baru: kuota 1 aktivasi (gratis) + kartu QR pertama langsung dibuat
  db.prepare("INSERT INTO cards (token, account_id, tier, status) VALUES (?,?,'free','blank')").run(cardToken(), acc.id);
  const token = sign({ uid: acc.id, exp: Date.now() + EXPIRY_MS });
  setCookie(res, COOKIE_ACCOUNT, token);
  res.redirect("/app?selesai=1");
});

app.get("/app/masuk", (req, res) => {
  const tok = getCookie(req, COOKIE_ACCOUNT);
  const p = tok && verifyToken(tok);
  if (p && p.uid) return res.redirect("/app");
  res.send(views.masuk(req.query.e === "1", req.query.next || ""));
});

app.post("/app/masuk", (req, res) => {
  const username = (req.body?.username || "").toString().trim().toLowerCase();
  const password = (req.body?.password || "").toString();
  const next = (req.body?.next || "").toString();
  const acc = accountByUsername(username);
  if (!acc || !verifyPassword(password, acc.pass_hash)) return res.redirect("/app/masuk?e=1");
  const token = sign({ uid: acc.id, exp: Date.now() + EXPIRY_MS });
  setCookie(res, COOKIE_ACCOUNT, token);
  res.redirect(next && next.startsWith("/") ? next : "/app");
});

app.post("/app/keluar", (req, res) => {
  clearCookie(res, COOKIE_ACCOUNT);
  res.redirect("/");
});

// ================= DASHBOARD AKUN =================
app.get("/app", requireAccount, (req, res) => {
  const cards = cardsOf(req.account.id);
  const orders = db.prepare("SELECT * FROM orders WHERE account_id=? ORDER BY id DESC").all(req.account.id);
  res.send(views.dashboard(req.account, cards, orders, BASE_URL));
});

app.post("/app/cards/generate", requireAccount, (req, res) => {
  const count = Math.min(Math.max(parseInt(req.body?.count, 10) || 1, 1), 50);
  let tier = req.body?.tier === "paid" ? "paid" : "free";
  if (tier === "paid" && req.account.tier !== "juragan") tier = "free";
  const ins = db.prepare("INSERT INTO cards (token, account_id, tier) VALUES (?,?,?)");
  for (let i = 0; i < count; i++) ins.run(cardToken(), req.account.id, tier);
  res.redirect("/app");
});

app.post("/app/cards/:id/reset", requireAccount, (req, res) => {
  const c = db.prepare("SELECT * FROM cards WHERE id=? AND account_id=?").get(req.params.id, req.account.id);
  if (!c) return res.status(404).send("Kartu tidak ditemukan.");
  db.prepare("UPDATE cards SET status='blank', place_id=NULL, place_name=NULL, activated_at=NULL WHERE id=?").run(c.id);
  res.redirect("/app");
});

app.get("/app/cards/print", requireAccount, (req, res) => {
  let cards;
  const ids = (req.query.ids || "").toString();
  if (ids) {
    const list = ids.split(",").map(Number).filter(Boolean);
    cards = db.prepare(`SELECT * FROM cards WHERE account_id=? AND id IN (${list.map(() => "?").join(",")})`).all(req.account.id, ...list);
  } else {
    cards = db.prepare("SELECT * FROM cards WHERE account_id=? AND status='blank' ORDER BY id DESC LIMIT 16").all(req.account.id);
  }
  if (!cards.length) return res.status(404).send("Tidak ada kartu untuk dicetak.");
  res.send(views.printBlankCards(cards, BASE_URL));
});

// ================= ORDER (upgrade/topup manual) =================
app.post("/app/order", requireAccount, (req, res) => {
  const type = req.body?.type === "topup" ? "topup" : "upgrade";
  const note = (req.body?.note || "").toString().trim().slice(0, 500);
  db.prepare("INSERT INTO orders (account_id, type, note) VALUES (?,?,?)").run(req.account.id, type, note);
  res.redirect("/app?pesan=1");
});

// ================= ADMIN PANEL =================
app.get("/admin/login", (req, res) => {
  const tok = getCookie(req, COOKIE_ADMIN);
  if (tok && verifyToken(tok)) return res.redirect("/admin");
  res.send(views.adminLogin(req.query.e === "1"));
});

app.post("/admin/login", (req, res) => {
  const pw = (req.body?.password || "").toString();
  const ok = Buffer.from(ADMIN_PASSWORD);
  const given = Buffer.from(pw);
  if (given.length !== ok.length || !crypto.timingSafeEqual(ok, given))
    return res.redirect("/admin/login?e=1");
  setCookie(res, COOKIE_ADMIN, sign({ role: "admin", exp: Date.now() + EXPIRY_MS }));
  res.redirect("/admin");
});

app.post("/admin/logout", (req, res) => {
  clearCookie(res, COOKIE_ADMIN);
  res.redirect("/admin/login");
});

app.get("/admin", requireAdmin, (req, res) => {
  const pending = db.prepare("SELECT o.*, a.username, a.name FROM orders o JOIN accounts a ON a.id=o.account_id WHERE o.status='pending' ORDER BY o.id ASC").all();
  const users = db.prepare("SELECT id, username, name, tier, quota, referral_code, created_at FROM accounts ORDER BY id DESC LIMIT 50").all();
  res.send(views.adminPanel(pending, users));
});

// Approve order: upgrade 50rb → tier juragan + kuota 1; topup 20rb → kuota +1
app.post("/admin/orders/:id/approve", requireAdmin, (req, res) => {
  const o = db.prepare("SELECT * FROM orders WHERE id=? AND status='pending'").get(req.params.id);
  if (!o) return res.status(404).send("Order tidak ditemukan / sudah diproses.");
  db.prepare("UPDATE orders SET status='approved', approved_at=datetime('now') WHERE id=?").run(o.id);
  if (o.type === "upgrade") {
    setTier(o.account_id, "juragan");
    addQuota(o.account_id, 1);
    // reward referal: pengundang dapat 1 kuota gratis (senilai 20rb) saat yang diundang beli juragan
    const buyer = accountById(o.account_id);
    if (buyer && buyer.referred_by) {
      const inviter = accountById(buyer.referred_by);
      if (inviter) {
        addQuota(inviter.id, 1);
        db.prepare("INSERT INTO orders (account_id, type, qty, status, approved_at) VALUES (?,?,?,?,datetime('now'))")
          .run(inviter.id, "referral_reward", 1, "approved");
      }
    }
  } else if (o.type === "topup") {
    addQuota(o.account_id, 1);
  }
  res.redirect("/admin");
});

app.get("/privacy", (req, res) => res.send(views.privacy()));

// Hanya bind localhost: Cloudflare Tunnel yang jembatani ke internet (0.0.0.0 = publik, risiko IP spoof)
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Bintangin v3 (akun+kuota+referal) jalan di ${BASE_URL}`);
});