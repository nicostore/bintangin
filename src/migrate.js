// src/migrate.js — jalankan: npm run migrate
import { db, bootstrapAdmin } from "./db.js";

bootstrapAdmin();
console.log("Migrasi v3 selesai (akun + kuota + referal + orders).");
console.log("DB siap di data/bintangin.db");
db.close();