// src/migrate.js — jalankan: npm run migrate
import { db, seedCards } from "./db.js";

console.log("Migrasi tabel selesai.");
seedCards(8);
console.log("DB siap di data/bintangin.db");
db.close();