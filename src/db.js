// src/db.js — SQLite layer pakai node:sqlite bawaan (tanpa dependency native)
// Schema PIVOT: produk = kartu fisik QR/NFC → aktivasi → Google review.
// Fitur lama (venues/ratings/wa) dihapus total.
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

// token unik kartu (16 char hex)
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