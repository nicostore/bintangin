// src/migrate.js — jalankan: npm run migrate
import { db, seedDemo, seedCards } from "./db.js";

console.log("Migrasi tabel selesai.");
seedDemo();
seedCards(8);
console.log("DB siap di data/bintangin.db");
db.close();