// src/db.js — SQLite layer (node:sqlite bawaan, tanpa dependency native)
// Skema v3: multi-akun UMKM + kuota aktivasi + referal + order topup manual.
import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = process.env.BINTANGIN_DB || path.join(DATA_DIR, "bintangin.db");

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS accounts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    name          TEXT    NOT NULL,                    -- nama usaha
    pass_hash     TEXT    NOT NULL,
    tier          TEXT    NOT NULL DEFAULT 'free',     -- free | juragan
    quota         INTEGER NOT NULL DEFAULT 1,          -- sisa aktivasi (gratis mulai 1)
    referral_code TEXT    NOT NULL UNIQUE,
    referred_by   INTEGER,
    ip_reg        TEXT,                                -- 1 IP = 1 akun
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (referred_by) REFERENCES accounts(id)
  );

  -- kartu: sekarang milik akun
  CREATE TABLE IF NOT EXISTS cards (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    token        TEXT    NOT NULL UNIQUE,
    tier         TEXT    NOT NULL DEFAULT 'free',      -- free = QR only | paid = NFC+QR
    status       TEXT    NOT NULL DEFAULT 'blank',     -- blank | activated
    place_id     TEXT,
    place_name   TEXT,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    activated_at TEXT
  );

  -- order topup/upgrade: user transfer manual → admin approve di /admin
  CREATE TABLE IF NOT EXISTS orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id  INTEGER NOT NULL,
    type        TEXT    NOT NULL,      -- upgrade | topup
    qty         INTEGER NOT NULL DEFAULT 1,
    status      TEXT    NOT NULL DEFAULT 'pending',    -- pending | approved
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    approved_at TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  );
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
`);

// ---- migrasi idempotent: tambah kolom yg belum ada (tabel cards lama) ----
{
  const cardCols = db.prepare("PRAGMA table_info(cards)").all().map((c) => c.name);
  if (!cardCols.includes("account_id")) db.exec("ALTER TABLE cards ADD COLUMN account_id INTEGER");
  if (!cardCols.includes("tier")) db.exec("ALTER TABLE cards ADD COLUMN tier TEXT NOT NULL DEFAULT 'free'");

  const ordCols = db.prepare("PRAGMA table_info(orders)").all().map((c) => c.name);
  if (!ordCols.includes("note")) db.exec("ALTER TABLE orders ADD COLUMN note TEXT");
  if (!ordCols.includes("qty")) db.exec("ALTER TABLE orders ADD COLUMN qty INTEGER NOT NULL DEFAULT 1");
}

// index kartu dibuat SETELAH migrasi kolom
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_cards_account ON cards(account_id);
  CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
`);

// ---- akun bootstrap (admin jualan) ----
export function bootstrapAdmin() {
  let a = db.prepare("SELECT * FROM accounts WHERE username='bintangin'").get();
  if (!a) {
    const ins = db.prepare("INSERT INTO accounts (username, name, pass_hash, referral_code) VALUES (?,?,?,?)");
    ins.run("bintangin", "Bintangin Official", hashPassword(randomBytes(12).toString("hex")), "BNGADM1");
    a = db.prepare("SELECT * FROM accounts WHERE username='bintangin'").get();
  }
  // kartu lama tanpa pemilik → milik akun bootstrap, jangan buang data
  db.prepare("UPDATE cards SET account_id=? WHERE account_id IS NULL").run(a.id);
  return a;
}

// ---- token & kode ----
export function cardToken() {
  return randomBytes(8).toString("hex");
}

const REF_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function makeReferralCode() {
  for (let i = 0; i < 20; i++) {
    let s = "B";
    for (let j = 0; j < 5; j++) s += REF_CHARS[randomBytes(1)[0] % REF_CHARS.length];
    const exists = db.prepare("SELECT 1 FROM accounts WHERE referral_code=?").get(s);
    if (!exists) return s;
  }
  return "B" + cardToken().slice(0, 5).toUpperCase();
}

// ---- password (scrypt) ----
export function hashPassword(pw) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(String(pw), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPassword(pw, stored) {
  try {
    const [salt, hash] = String(stored).split(":");
    const expect = Buffer.from(scryptSync(String(pw), salt, 64));
    const given = Buffer.from(hash, "hex");
    return expect.length === given.length && timingSafeEqual(expect, given);
  } catch {
    return false;
  }
}

// ---- akun helpers ----
export function accountByUsername(u) {
  return db.prepare("SELECT * FROM accounts WHERE lower(username)=lower(?)").get(String(u || "").trim());
}
export function accountByReferral(code) {
  return db.prepare("SELECT * FROM accounts WHERE upper(referral_code)=upper(?)").get(String(code || "").trim());
}
export function accountById(id) {
  return db.prepare("SELECT * FROM accounts WHERE id=?").get(id);
}
export function addQuota(id, n) {
  db.prepare("UPDATE accounts SET quota = quota + ? WHERE id=?").run(n, id);
  return accountById(id).quota;
}
export function consumeQuota(id) {
  return db.prepare("UPDATE accounts SET quota = quota - 1 WHERE id=? AND quota > 0").run(id).changes > 0;
}
export function setTier(id, tier) {
  db.prepare("UPDATE accounts SET tier=? WHERE id=?").run(tier, id);
}
export function cardsOf(accountId) {
  return db.prepare("SELECT * FROM cards WHERE account_id=? ORDER BY id DESC").all(accountId);
}
export function getCard(token) {
  return db.prepare("SELECT * FROM cards WHERE token=?").get(token);
}