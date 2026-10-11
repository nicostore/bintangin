// views-admin.js — panel admin (login + approve order topup/upgrade)
import { FONT } from "./views-core.js";

// ---------- ADMIN LOGIN ----------
export function adminLogin(err) {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin — Bintangin</title>${FONT}
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:#0F1512;color:#EDF3EE;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .box{width:100%;max-width:360px;background:#17211B;border:1px solid #26382D;border-radius:18px;padding:34px 28px}
  .logo{font-weight:800;text-align:center;font-size:1.15rem;margin-bottom:6px}
  h1{font-size:1.05rem;font-weight:800;text-align:center;margin:18px 0 4px}
  .sub{color:#9DB3A5;font-size:.84rem;text-align:center;margin-bottom:18px}
  label{font-size:.78rem;font-weight:600;color:#9DB3A5}
  input{width:100%;padding:12px 14px;border:1px solid #26382D;border-radius:10px;font-size:1rem;font-family:inherit;margin-top:6px;background:#0F1512;color:#EDF3EE}
  input:focus{outline:3px solid rgba(63,191,79,.2);border-color:#3FBF4F}
  button{width:100%;min-height:48px;border:0;border-radius:10px;background:#3FBF4F;color:#06210C;font-weight:800;font-size:1rem;font-family:inherit;cursor:pointer;margin-top:18px}
  .err{background:rgba(229,72,77,.12);color:#FF8B90;font-weight:600;font-size:.82rem;padding:10px 12px;border-radius:10px;margin-bottom:8px;text-align:center}
</style></head>
<body>
  <div class="box">
    <div class="logo">Bintangin</div>
    <h1>Panel Admin</h1>
    <p class="sub">Approve order topup &amp; upgrade.</p>
    ${err ? `<div class="err">Password salah.</div>` : ""}
    <form method="post" action="/admin/login">
      <label for="pw">Password admin</label>
      <input type="password" id="pw" name="password" autofocus required>
      <button type="submit">Masuk</button>
    </form>
  </div>
</body></html>`;
}

// ---------- ADMIN PANEL ----------
export function adminPanel(pending, users) {
  const orderRows = pending.map((o) => `
    <tr>
      <td class="mono">#${o.id}</td>
      <td>${o.username}<br><span class="dim">${o.name}</span></td>
      <td><span class="tag ${o.type}">${o.type === "upgrade" ? "Upgrade 50rb" : "Topup 20rb"}</span></td>
      <td>${o.note || "—"}</td>
      <td class="mono dim">${o.created_at ? o.created_at.slice(0, 16) : "—"}</td>
      <td>
        <form method="post" action="/admin/orders/${o.id}/approve" style="display:inline">
          <button class="mini ok" type="submit">Approve</button>
        </form>
      </td>
    </tr>`).join("") || `<tr><td colspan="6" class="dim" style="text-align:center;padding:18px">Tidak ada order pending.</td></tr>`;

  const userRows = users.map((a) => `
    <tr>
      <td class="mono">#${a.id}</td>
      <td>${a.username}</td>
      <td>${a.name}</td>
      <td><span class="tag ${a.tier}">${a.tier === "juragan" ? "Juragan" : "Gratis"}</span></td>
      <td class="mono">${a.quota}</td>
      <td class="mono">${a.referral_code}</td>
      <td class="mono dim">${a.created_at ? a.created_at.slice(0, 10) : "—"}</td>
    </tr>`).join("");

  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin Panel — Bintangin</title>${FONT}
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:#0F1512;color:#EDF3EE;min-height:100vh;-webkit-font-smoothing:antialiased}
  .top{background:#17211B;border-bottom:1px solid #26382D;padding:0 24px;height:58px;display:flex;align-items:center;justify-content:space-between}
  .top .logo{font-weight:800}
  .logout{background:transparent;border:1px solid #26382D;color:#9DB3A5;border-radius:8px;padding:7px 14px;font-size:.8rem;cursor:pointer;font-family:inherit}
  .logout:hover{color:#EDF3EE}
  main{padding:26px;max-width:1100px;margin:0 auto}
  h1{font-size:1.3rem;font-weight:800;margin-bottom:4px}
  .sub{color:#9DB3A5;font-size:.86rem;margin-bottom:22px}
  h2{font-size:.95rem;font-weight:800;margin:26px 0 12px;color:#9DB3A5;text-transform:uppercase;letter-spacing:.08em}
  .tablewrap{overflow-x:auto;border-radius:12px;border:1px solid #26382D}
  table{width:100%;border-collapse:collapse;font-size:.83rem;min-width:700px}
  th{font-family:"JetBrains Mono",monospace;font-size:.6rem;text-transform:uppercase;letter-spacing:.1em;color:#5F7468;text-align:left;padding:9px 12px;border-bottom:1px solid #26382D}
  td{padding:10px 12px;border-bottom:1px solid rgba(38,56,45,.5);color:#9DB3A5}
  .mono{font-family:"JetBrains Mono",monospace}
  .dim{color:#5F7468}
  .tag{display:inline-block;padding:3px 9px;border-radius:6px;font-size:.66rem;font-weight:700;font-family:"JetBrains Mono",monospace}
  .tag.upgrade,.tag.juragan{background:rgba(63,191,79,.12);color:#3FBF4F;border:1px solid rgba(63,191,79,.3)}
  .tag.topup{background:rgba(232,163,61,.12);color:#E8A33D;border:1px solid rgba(232,163,61,.3)}
  .tag.free{background:rgba(157,179,165,.12);color:#9DB3A5;border:1px solid rgba(157,179,165,.3)}
  .mini.ok{background:rgba(63,191,79,.15);color:#3FBF4F;border:1px solid rgba(63,191,79,.4);border-radius:7px;padding:6px 13px;font-family:inherit;font-weight:700;cursor:pointer;font-size:.78rem}
  .mini.ok:hover{background:#3FBF4F;color:#06210C}
  @media(max-width:720px){main{padding:18px 12px}}
</style></head>
<body>
  <div class="top"><div class="logo">Bintangin · Admin</div>
    <form method="post" action="/admin/logout"><button class="logout" type="submit">Logout</button></form>
  </div>
  <main>
    <h1>Panel Admin</h1>
    <p class="sub">Approve order manual. Upgrade 50rb → Juragan + 1 aktivasi · Topup 20rb → +1 aktivasi · Referal: pengundang dapat +1 kuota saat yang diundang upgrade.</p>

    <h2>Order Menunggu (<span class="mono">${pending.length}</span>)</h2>
    <div class="tablewrap"><table>
      <thead><tr><th>Order</th><th>Akun</th><th>Tipe</th><th>Catatan</th><th>Waktu</th><th>Aksi</th></tr></thead>
      <tbody>${orderRows}</tbody>
    </table></div>

    <h2>Semua Akun</h2>
    <div class="tablewrap"><table>
      <thead><tr><th>ID</th><th>Username</th><th>Nama Usaha</th><th>Tier</th><th>Kuota</th><th>Kode Referal</th><th>Daftar</th></tr></thead>
      <tbody>${userRows}</tbody>
    </table></div>
  </main>
</body></html>`;
}