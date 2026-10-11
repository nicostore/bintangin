// src/db.js — SQLite layer pakai node:sqlite bawaan (tanpa dependency native)
// Migrasi: CREATE TABLE IF NOT EXISTS idempotent.
import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
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

  CREATE TABLE IF NOT EXISTS venues (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT    NOT NULL UNIQUE,
    name        TEXT    NOT NULL,
    place_id    TEXT,
    wa_number   TEXT,
    plan        TEXT    NOT NULL DEFAULT 'free',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ratings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_id    INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    stars       INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
    note        TEXT,
    fp_hash     TEXT,               -- hash device fingerprint (anti-spam, tanpa PII)
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_ratings_venue ON ratings(venue_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_ratings_fp   ON ratings(fp_hash, created_at);

  -- Kartu fisik (kosong): QR/NFC berisi token unik → aktivasi → bind ke tempat Google
  CREATE TABLE IF NOT EXISTS cards (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    token        TEXT    NOT NULL UNIQUE,
    status       TEXT    NOT NULL DEFAULT 'blank',   -- blank | activated
    place_id     TEXT,
    place_name   TEXT,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    activated_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
`);

export function now() {
  return new Date().toISOString();
}

// Helper: buat slug unik pendek dari nama (atau random kalau sibuk)
export function makeSlug(name) {
  const base = (name || "venue")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "venue";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

// tempat panggilan CREATE TABLE berulang (migrasi & seed aman)
export function migrate() {
  // sudah di db.exec() di atas — function dipertahankan utk kompatibilitas script
}

export function seedDemo() {
  const count = db.prepare("SELECT COUNT(*) AS c FROM venues").get().c;
  if (count > 0) return;
  const ins = db.prepare(
    "INSERT INTO venues (slug, name, place_id, wa_number, plan) VALUES (?, ?, ?, ?, ?)"
  );
  ins.run("kedai-kopi-senja", "Kedai Kopi Senja", "ChIJv73t_LdOaS4Rs5p0Qx-9Z08", "6281234567890", "free");
  ins.run("barber-kita", "Barber Kita", "ChIJg8y6rPZNaS4RlZ2h1cDmX3Y", "6289876543210", "pro");
  console.log("  seed: 2 venue demo dibuat");
}

// token unik kartu (16 char hex) — juga dipakai routes
export function cardToken() {
  return randomBytes(8).toString("hex");
}

export function seedCards(n = 8) {
  const count = db.prepare("SELECT COUNT(*) AS c FROM cards").get().c;
  if (count > 0) return;
  const ins = db.prepare("INSERT INTO cards (token) VALUES (?)");
  for (let i = 0; i < n; i++) ins.run(cardToken());
  console.log(`  seed: ${n} kartu kosong dibuat`);
}

export function closeDb() {
  try { db.close(); } catch {}
}