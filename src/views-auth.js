// views-auth.js — halaman akun: daftar (register) & masuk (login)
import { FONT } from "./views-core.js";

const AUTH_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:#FBF9F4;color:#1C1917;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;-webkit-font-smoothing:antialiased}
  .box{width:100%;max-width:420px;background:#fff;border:1px solid #E9E3D8;border-radius:20px;padding:34px 30px;box-shadow:0 20px 50px -20px rgba(28,25,23,.18)}
  .logo{display:flex;align-items:center;gap:9px;font-weight:800;font-size:1.2rem;letter-spacing:-.01em;justify-content:center}
  .logo .mark{width:32px;height:32px;border-radius:10px;background:#107C41;color:#fff;display:flex;align-items:center;justify-content:center}
  .logo .mark svg{width:17px;height:17px}
  h1{font-size:1.15rem;font-weight:800;text-align:center;margin:18px 0 4px;letter-spacing:-.01em}
  .sub{color:#6B6359;font-size:.86rem;text-align:center;margin-bottom:20px}
  label{font-size:.78rem;font-weight:600;color:#6B6359;display:block;margin-top:12px}
  input{width:100%;padding:12px 14px;border:1.5px solid #E9E3D8;border-radius:11px;font-size:.95rem;font-family:inherit;margin-top:6px;background:#FBF9F4;color:#1C1917}
  input:focus{outline:3px solid #F0DFBC;border-color:#E8A33D}
  button{width:100%;min-height:50px;border:0;border-radius:12px;background:#107C41;color:#fff;font-weight:800;font-size:1rem;font-family:inherit;cursor:pointer;margin-top:20px;box-shadow:0 4px 14px rgba(16,124,65,.25)}
  .err{background:#FDECEC;color:#C0392B;font-weight:600;font-size:.82rem;padding:10px 12px;border-radius:10px;margin-bottom:6px;display:block}
  .ok{background:#E3F1E8;color:#0B5C30;font-weight:600;font-size:.82rem;padding:10px 12px;border-radius:10px;margin-bottom:6px;display:block}
  .hint{color:#A49B8E;font-size:.76rem;text-align:center;margin-top:18px;line-height:1.8}
  .hint a{color:#107C41;text-decoration:none;font-weight:700}
  .field-note{color:#A49B8E;font-size:.72rem;margin-top:4px}
  .divider{border-top:1px solid var(--line,#E9E3D8);margin:14px 0;text-align:center;position:relative}
  .divider span{background:#fff;color:#A49B8E;font-size:.72rem;padding:0 10px;position:relative;top:-8px}
`;

function shell(title, body) {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Bintangin</title>${FONT}
<style>${AUTH_CSS}</style></head>
<body>
  <div class="box">
    <div class="logo"><span class="mark"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 5.1 5.6.7-4.1 3.9 1 5.6L12 14.6 7.1 17.3l1-5.6L4 7.8l5.6-.7L12 2z"/></svg></span> Bintangin</div>
    ${body}
  </div>
</body></html>`;
}

// ---------- DAFTAR (register) ----------
export function daftar(err, pref) {
  return shell("Daftar", `
    <h1>Daftar akun usaha</h1>
    <p class="sub">Dapatkan 1 kartu QR + 1 aktivasi gratis. Print sendiri.</p>
    ${err ? `<div class="err">${err}</div>` : ""}
    <form method="post" action="/app/daftar" autocomplete="off">
      <label for="name">Nama Usaha</label>
      <input id="name" name="name" value="${pref || ""}" placeholder="Contoh: Kedai Kopi Senja" required>
      <label for="username">Username</label>
      <input id="username" name="username" placeholder="huruf kecil & angka (3-20)" required pattern="[a-z0-9_]{3,20}">
      <label for="password">Password</label>
      <input id="password" type="password" name="password" placeholder="minimal 6 karakter" required minlength="6">
      <label for="referral">Kode Referal <span style="color:#A49B8E">(opsional)</span></label>
      <input id="referral" name="referral" placeholder="Contoh: BXX3K9" value="${err ? "" : ""}">
      <button type="submit">Daftar Gratis</button>
    </form>
    <p class="hint">1 alamat IP hanya bisa buat 1 akun.<br>Sudah punya akun? <a href="/app/masuk">Masuk</a></p>
    <p class="hint"><a href="/">← kembali ke beranda</a></p>
  `);
}

// ---------- MASUK (login) ----------
export function masuk(err, next) {
  return shell("Masuk", `
    <h1>Masuk ke dashboard</h1>
    <p class="sub">Kelola kartu, kuota, dan aktivasi.</p>
    ${err ? `<div class="err">Username atau password salah.</div>` : ""}
    <form method="post" action="/app/masuk">
      <input type="hidden" name="next" value="${next || ""}">
      <label for="username">Username</label>
      <input id="username" name="username" placeholder="username kamu" required autofocus>
      <label for="password">Password</label>
      <input id="password" type="password" name="password" placeholder="••••••••" required>
      <button type="submit">Masuk</button>
    </form>
    <p class="hint">Belum punya akun? <a href="/app/daftar">Daftar gratis</a></p>
    <p class="hint"><a href="/">← kembali ke beranda</a></p>
  `);
}