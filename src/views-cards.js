// views-cards.js — dashboard/cardsAdmin + cetak kartu kosong
import { FONT } from "./views-core.js";

// ---------- dashboard alias ----------
export function dashboard(cards, baseUrl, qrFor) {
  return cardsAdmin(cards, baseUrl, qrFor);
}

// ---------- CARDS ADMIN (pabrik kartu) ----------
export function cardsAdmin(cards, baseUrl, qrFor) {
  const blank = cards.filter((c) => c.status === "blank");
  const active = cards.filter((c) => c.status === "activated");
  const rows = cards.map((c) => `
  <tr class="${c.status}">
    <td class="mono">#${c.id}</td>
    <td class="mono">${c.token.slice(0, 10)}…</td>
    <td><span class="st ${c.status}">${c.status === "blank" ? "kosong" : "aktif"}</span></td>
    <td>${c.place_name || "—"}</td>
    <td class="mono small">${c.activated_at ? c.activated_at.slice(0, 10) : "—"}</td>
    <td class="actions">
      ${c.status === "blank"
        ? `<a class="mini" target="_blank" rel="noopener" href="${baseUrl}/a/${c.token}">aktivasi →</a>`
        : `<a class="mini" target="_blank" rel="noopener" href="${baseUrl}/c/${c.token}">review →</a>`}
      <form method="post" action="/app/cards/${c.id}/reset" style="display:inline" onsubmit="return confirm('Reset kartu ke kosong?')">
        <button class="mini danger" type="submit">reset</button>
      </form>
    </td>
  </tr>`).join("");

  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dashboard Kartu — Bintangin</title>${FONT}
<style>
  :root{--bg:#0F1512;--panel:#17211B;--panel2:#1E2B23;--line:#26382D;--ink:#EDF3EE;--muted:#9DB3A5;--dim:#5F7468;--green:#3FBF4F;--amber:#E8A33D;--red:#E5484D}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;-webkit-font-smoothing:antialiased}
  .top{background:var(--panel);border-bottom:1px solid var(--line);padding:0 26px;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20}
  .logo{font-weight:800;letter-spacing:-.01em;display:flex;align-items:center;gap:8px}
  .logo .mark{width:28px;height:28px;border-radius:8px;background:var(--green);color:#06210C;display:flex;align-items:center;justify-content:center}
  .logo .mark svg{width:15px;height:15px}
  .top .right{display:flex;gap:10px;align-items:center}
  .logout{background:transparent;border:1px solid var(--line);color:var(--muted);border-radius:8px;padding:7px 14px;font-size:.8rem;cursor:pointer;font-family:inherit;font-weight:600}
  .logout:hover{color:var(--ink)}
  .back{background:transparent;border:1px solid var(--line);color:var(--muted);border-radius:8px;padding:7px 14px;font-size:.8rem;cursor:pointer;text-decoration:none;font-weight:600}
  .back:hover{color:var(--ink)}
  main{padding:26px;max-width:1080px;margin:0 auto}
  .head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:20px}
  .head h1{font-size:1.35rem;font-weight:800}
  .head .sub{color:var(--muted);font-size:.88rem;margin-top:4px}
  .summary{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
  .pill{font-family:"JetBrains Mono",monospace;font-size:.72rem;padding:6px 13px;border-radius:20px;border:1px solid var(--line);color:var(--muted);background:var(--panel)}
  .pill b{color:var(--ink)}
  .pill.blank b{color:var(--amber)}
  .pill.active b{color:var(--green)}
  .actions-row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px}
  .btn{display:inline-flex;align-items:center;gap:7px;border:0;border-radius:10px;padding:11px 18px;font-weight:800;font-family:inherit;font-size:.88rem;cursor:pointer;text-decoration:none}
  .btn.green{background:var(--green);color:#06210C}
  .btn.ghost{background:var(--panel2);border:1px solid var(--line);color:var(--ink)}
  .btn:hover{filter:brightness(1.08)}
  .count-input{width:70px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--ink);font-family:inherit;font-size:.9rem}
  .tablewrap{overflow-x:auto;border-radius:12px;border:1px solid var(--line)}
  table{width:100%;border-collapse:collapse;font-size:.84rem;min-width:640px}
  th{font-family:"JetBrains Mono",monospace;font-size:.62rem;text-transform:uppercase;letter-spacing:.1em;color:var(--dim);text-align:left;padding:9px 12px;border-bottom:1px solid var(--line)}
  td{padding:10px 12px;border-bottom:1px solid rgba(38,56,45,.5);color:var(--muted)}
  .mono{font-family:"JetBrains Mono",monospace}
  .small{font-size:.68rem}
  .st{display:inline-block;padding:3px 10px;border-radius:20px;font-size:.68rem;font-weight:700;font-family:"JetBrains Mono",monospace}
  .st.blank{background:rgba(232,163,61,.12);color:var(--amber);border:1px solid rgba(232,163,61,.3)}
  .st.activated{background:rgba(63,191,79,.12);color:var(--green);border:1px solid rgba(63,191,79,.3)}
  .actions{white-space:nowrap}
  .mini{display:inline-block;color:#7EC8FF;text-decoration:none;font-size:.78rem;margin-right:8px}
  .mini.danger{color:var(--red);background:transparent;border:0;cursor:pointer;font-family:inherit;font-size:.78rem;padding:0}
  .mini:hover{text-decoration:underline}
  tr:hover td{background:rgba(255,255,255,.015)}
  @media(max-width:720px){th:nth-child(4),td:nth-child(4){display:none}main{padding:18px 14px}}
</style></head>
<body>
  <div class="top">
    <div class="logo"><span class="mark"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 5.1 5.6.7-4.1 3.9 1 5.6L12 14.6 7.1 17.3l1-5.6L4 7.8l5.6-.7L12 2z"/></svg></span> Bintangin</div>
    <div class="right"><button class="logout" onclick="event.preventDefault();fetch('/app/logout',{method:'POST'}).then(()=>location='/app/login')">Logout</button></div>
  </div>
  <main>
    <div class="head">
      <div>
        <h1>Pabrik Kartu</h1>
        <div class="sub">Generate kartu kosong QR/NFC → cetak → pelanggan scan &amp; aktivasi → langsung ke review Google.</div>
      </div>
    </div>
    <div class="summary">
      <span class="pill">total <b>${cards.length}</b></span>
      <span class="pill blank">kosong <b>${blank.length}</b></span>
      <span class="pill active">aktif <b>${active.length}</b></span>
    </div>
    <div class="actions-row">
      <form method="post" action="/app/cards/generate" style="display:flex;gap:8px;align-items:center">
        <input class="count-input" type="number" name="count" value="10" min="1" max="200" aria-label="Jumlah kartu">
        <button class="btn green" type="submit">+ Generate kartu</button>
      </form>
      <a class="btn ghost" href="/app/cards/print">🖨️ Cetak kartu kosong</a>
      <a class="btn ghost" href="/" target="_blank">Buka landing ↗</a>
    </div>
    <div class="tablewrap">
      <table>
        <thead><tr><th>#</th><th>Token</th><th>Status</th><th>Tempat</th><th>Aktif</th><th>Aksi</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </main>
</body></html>`;
}