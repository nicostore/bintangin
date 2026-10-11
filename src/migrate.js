// src/migrate.js — jalankan: npm run migrate
import { db, seedDemo } from "./db.js";

console.log("Migrasi tabel selesai.");
seedDemo();
console.log("DB siap di data/bintangin.db");
db.close();