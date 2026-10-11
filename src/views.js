// views.js — re-export dari modul per-bagian (biar server.js tetap import * as views)
export { privacy, activateCard } from "./views-core.js";
export { daftar, masuk } from "./views-auth.js";
export { adminLogin, adminPanel } from "./views-admin.js";
export { dashboard } from "./views-cards.js";
export { printBlankCards } from "./views-print.js";