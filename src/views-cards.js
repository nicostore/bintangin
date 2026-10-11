// views-cards.js — dashboard akun UMKM (kuota, referal, order, kartuku)
import { FONT } from "./views-core.js";

export function dashboard(acc, cards, orders, baseUrl) {
  const blank = cards.filter((c) => c.status === "blank");
  const active = cards.filter((c) => c.status === "activated");
  const rows = cards.map((c) => `
  <tr>
    <td class="mono">#${c.id}</td>
    <td>${c.tier === "paid" ? '<span class="tier paid">NFC+QR</span>' : '<span class="tier free">QR</span>'}</td>
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

  const orderHistory = orders.map((o) => `
    <div class="oh-row">
      <span class="tag ${o.type}">${o.type === "upgrade" ? "Upgrade 50rb" : o.type === "topup" ? "Topup 20rb" : "Reward referal"}</span>
      <span class="${o.status === "approved" ? "ok" : "pend"}">${o.status === "approved" ? "Disetujui" : "Menunggu admin"}</span>
      <span class="mono dim">${o.created_at ? o.created_at.slice(0, 16) : ""}</span>
    </div>`).join("") || `<div class="dim" style="padding:6px 0">Belum ada order.</div>`;

  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dashboard ${acc.name} — Bintangin</title>${FONT}
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:#FBF9F4;color:#1C1917;min-height:100vh;-webkit-font-smoothing:antialiased}
  .top{background:#fff;border-bottom:1px solid #E9E3D8;padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20}
  .logo{font-weight:800;letter-spacing:-.01em;display:flex;align-items:center;gap:8px}
  .logo .mark{width:28px;height:28px;border-radius:8px;background:#107C41;color:#fff;display:flex;align-items:center;justify-content:center}
  .logo .mark svg{width:15px;height:15px}
  .top .who{display:flex;align-items:center;gap:10px}
  .who .uname{font-size:.8rem;color:#6B6359}
  .logout{background:transparent;border:1px solid #E9E3D8;color:#6B6359;border-radius:8px;padding:7px 14px;font-size:.8rem;cursor:pointer;font-family:inherit;font-weight:600}
  .logout:hover{color:#1C1917}
  main{padding:24px;max-width:1080px;margin:0 auto}
  .flash{background:#E3F1E8;border:1px solid #CBE3D4;color:#0B5C30;font-weight:600;font-size:.84rem;padding:11px 14px;border-radius:10px;margin-bottom:18px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-bottom:20px}
  .stat{background:#fff;border:1px solid #E9E3D8;border-radius:14px;padding:16px 18px}
  .stat .lb{font-size:.72rem;color:#6B6359;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
  .stat .val{font-size:1.6rem;font-weight:800;margin-top:2px;letter-spacing:-.02em}
  .stat .val small{font-size:.8rem;color:#6B6359;font-weight:600}
  .stat .note{font-size:.74rem;color:#A49B8E;margin-top:3px}
  .ref{font-family:"JetBrains Mono",monospace;font-weight:600;color:#107C41;background:#E3F1E8;padding:3px 10px;border-radius:7px;font-size:.95rem}
  .row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
  .btn{display:inline-flex;align-items:center;gap:7px;border:0;border-radius:10px;padding:11px 17px;font-weight:800;font-family:inherit;font-size:.86rem;cursor:pointer;text-decoration:none}
  .btn.green{background:#107C41;color:#fff}
  .btn.ghost{background:#fff;border:1px solid #E9E3D8;color:#1C1917}
  .btn:hover{filter:brightness(1.06)}
  .count-input{width:68px;padding:10px;border:1px solid #E9E3D8;border-radius:10px;background:#fff;color:#1C1917;font-family:inherit;font-size:.9rem}
  .tier-select{background:#fff;border:1px solid #E9E3D8;color:#1C1917;border-radius:10px;padding:10px 12px;font-family:inherit;font-size:.86rem;font-weight:600}
  .cols{display:grid;grid-template-columns:1.5fr .75fr;gap:18px;align-items:start}
  .panel{background:#fff;border:1px solid #E9E3D8;border-radius:16px;padding:20px}
  .panel h2{font-size:.9rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#6B6359;margin-bottom:12px}
  .tablewrap{overflow-x:auto;border:1px solid #E9E3D8;border-radius:11px}
  table{width:100%;border-collapse:collapse;font-size:.84rem;min-width:640px}
  th{font-family:"JetBrains Mono",monospace;font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;color:#A49B8E;text-align:left;padding:9px 12px;border-bottom:1px solid #E9E3D8}
  td{padding:10px 12px;border-bottom:1px solid rgba(233,227,216,.6);color:#4A4238}
  .mono{font-family:"JetBrains Mono",monospace}
  .small{font-size:.68rem}
  .st{display:inline-block;padding:3px 10px;border-radius:20px;font-size:.68rem;font-weight:700;font-family:"JetBrains Mono",monospace}
  .st.blank{background:#FBF0DC;color:#8A5A00;border:1px solid #F3DFC0}
  .st.activated{background:#E3F1E8;color:#0B5C30;border:1px solid #CBE3D4}
  .tier{display:inline-block;padding:3px 9px;border-radius:6px;font-size:.66rem;font-weight:800;font-family:"JetBrains Mono",monospace}
  .tier.free{background:#F4F0E8;color:#6B6359}
  .tier.paid{background:#E3F1E8;color:#0B5C30}
  .actions{white-space:nowrap}
  .mini{display:inline-block;color:#107C41;text-decoration:none;font-size:.78rem;font-weight:700;margin-right:8px}
  .mini.danger{color:#E5484D;background:transparent;border:0;cursor:pointer;font-family:inherit;font-size:.78rem;padding:0}
  .oh-row{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid #F4F0E8;font-size:.82rem;flex-wrap:wrap}
  .oh-row:last-child{border-bottom:0}
  .tag{display:inline-block;padding:3px 9px;border-radius:6px;font-size:.66rem;font-weight:700;font-family:"JetBrains Mono",monospace}
  .tag.upgrade,.tag.referral_reward{background:#E3F1E8;color:#0B5C30}
  .tag.topup{background:#FBF0DC;color:#8A5A00}
  .ok{color:#0B5C30;font-weight:700}
  .pend{color:#8A5A00;font-weight:700}
  .dim{color:#A49B8E}
  .ord-form{background:#FBF9F4;border:1px solid #E9E3D8;border-radius:12px;padding:16px;margin-top:12px}
  .ord-form label{font-size:.78rem;font-weight:600;color:#6B6359;display:block;margin-bottom:6px}
  .ord-form select,.ord-form textarea{width:100%;padding:10px 12px;border:1.5px solid #E9E3D8;border-radius:10px;font-family:inherit;font-size:.9rem;background:#fff;color:#1C1917;margin-bottom:10px}
  .ord-form textarea{resize:vertical;min-height:64px}
  .prices{font-size:.78rem;color:#6B6359;line-height:1.7;margin-bottom:8px}
  .prices b{color:#1C1917}
  @media(max-width:860px){.cols{grid-template-columns:1fr}main{padding:16px 12px}}
</style></head>
<body>
  <div class="top">
    <div class="logo"><span class="mark"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 5.1 5.6.7-4.1 3.9 1 5.6L12 14.6 7.1 17.3l1-5.6L4 7.8l5.6-.7L12 2z"/></svg></span> Bintangin</div>
    <div class="who">
      <span class="uname">${acc.name} · @${acc.username}</span>
      <form method="post" action="/app/keluar"><button class="logout" type="submit">Keluar</button></form>
    </div>
  </div>
  <main>
    <div class="flash" id="flash" style="display:none"></div>
    <div class="grid">
      <div class="stat"><div class="lb">Tier</div><div class="val">${acc.tier === "juragan" ? "Juragan" : "Gratis"}</div><div class="note">${acc.tier === "juragan" ? "NFC + QR · kartu fisik dikirim" : "QR only · print sendiri"}</div></div>
      <div class="stat"><div class="lb">Kuota aktivasi</div><div class="val">${acc.quota} <small>×</small></div><div class="note">Setiap aktivasi habiskan 1 kuota</div></div>
      <div class="stat"><div class="lb">Kartu</div><div class="val">${cards.length} <small>(${active.length} aktif)</small></div><div class="note">${blank.length} kosong siap aktivasi</div></div>
      <div class="stat"><div class="lb">Kode referal</div><div class="val ref">${acc.referral_code}</div><div class="note">Bagikan: yang daftar pakai kode ini</div></div>
    </div>

    <div class="row">
      <form method="post" action="/app/cards/generate" style="display:flex;gap:8px;align-items:center">
        <input class="count-input" type="number" name="count" value="5" min="1" max="50" aria-label="Jumlah kartu">
        <select class="tier-select" name="tier" aria-label="Tipe kartu">
          <option value="free">QR only</option>
          ${acc.tier === "juragan" ? '<option value="paid">NFC + QR</option>' : ""}
        </select>
        <button class="btn green" type="submit">+ Buat kartu</button>
      </form>
      <a class="btn ghost" href="/app/cards/print">🖨️ Cetak kartu kosong</a>
      <a class="btn ghost" href="/" target="_blank">Lihat landing ↗</a>
    </div>

    <div class="cols">
      <div class="panel">
        <h2>Kartuku</h2>
        <div class="tablewrap">
          <table>
            <thead><tr><th>#</th><th>Tipe</th><th>Status</th><th>Tempat</th><th>Aktif</th><th>Aksi</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <h2>Top up &amp; Upgrade</h2>
        <div class="prices">
          ${acc.tier === "juragan"
            ? `<b>Top up aktivasi</b> — Rp20.000 / aktivasi, setelah nge-transfer, order kami approve manual &amp; kuota langsung masuk.`
            : `<b>Upgrade ke Juragan Rp50.000</b> — dapat kartu fisik NFC+QR + 1 aktivasi. Setelahnya top up Rp20.000 / aktivasi.<br><b>Referal:</b> undang teman, yang diundang upgrade ke Juragan → <b>kamu dapat +1 kuota gratis</b> (senilai 20rb).`}
        </div>
        <form class="ord-form" method="post" action="/app/order">
          <label for="ord-type">Pilih</label>
          <select name="type" id="ord-type">
            ${acc.tier === "juragan"
              ? '<option value="topup">Top up 1 aktivasi — Rp20.000</option>'
              : '<option value="upgrade">Upgrade Juragan (kartu NFC+QR + 1 aktivasi) — Rp50.000</option><option value="topup">Top up 1 aktivasi — Rp20.000</option>'}
          </select>
          <label for="ord-note">Catatan transfer (opsional)</label>
          <textarea name="note" id="ord-note" placeholder="Contoh: sudah transfer Rp50.000 dari BCA 123456 ke a/n Bintangin"></textarea>
          <button class="btn green" type="submit">Buat order</button>
        </form>
        <h2 style="margin-top:18px">Riwayat</h2>
        ${orderHistory}
      </div>
    </div>
  </main>
<script>
  // flash dari query ?pesan=1 / ?selesai=1
  (function(){
    const p = new URLSearchParams(location.search);
    const el = document.getElementById('flash');
    if(p.get('selesai')){ el.textContent='✅ Akun berhasil dibuat! Kartu QR pertamamu udah siap, cetak & tempel.'; el.style.display='block'; }
    else if(p.get('pesan')){ el.textContent='📦 Order dibuat. Tunggu admin approve — biasanya 1×24 jam. Kuota masuk otomatis.'; el.style.display='block'; }
  })();
</script>
</body></html>`;
}