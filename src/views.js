// views.js — re-export dari modul per-bagian (biar server.js tetap import * as views)
export { login, privacy, activateCard } from "./views-core.js";
export { dashboard, cardsAdmin } from "./views-cards.js";
export { printBlankCards } from "./views-print.js";