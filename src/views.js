// src/views.js — render semua halaman Bintangin. Template literals, no deps.

const FONT = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">`;

const STAR_SVG = `<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M12 2l2.4 5.1 5.6.7-4.1 3.9 1 5.6L12 14.6 7.1 17.3l1-5.6L4 7.8l5.6-.7L12 2z"/></svg>`;

// ---------- RATING (mobile-first, anti-malu, satu ketukan) ----------
export function rating(venue) {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Gimana tadi di ${venue.name}?</title>${FONT}
<style>
  :root{--green:#107C41;--green-strong:#0B5C30;--amber:#E8A33D;--ink:#1C1917;--muted:#6B6359;--bg:#FFFDF8;--line:#E9E3D8}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;display:flex;flex-direction:column;-webkit-font-smoothing:antialiased}
  .top{width:100%;padding:18px 20px 0;text-align:center;font-weight:800;letter-spacing:-.01em;font-size:1.02rem;display:flex;align-items:center;justify-content:center;gap:8px}
  .top .mark{width:26px;height:26px;border-radius:8px;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center}
  .top .mark svg{width:14px;height:14px}
  main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 24px;text-align:center}
  .vname{font-size:1.35rem;font-weight:800;letter-spacing:-.02em}
  .ask{color:var(--muted);margin-top:6px;font-size:.98rem}
  .stars{display:flex;gap:10px;justify-content:center;margin:30px 0 8px}
  .star{width:58px;height:58px;border-radius:16px;border:1.5px solid var(--line);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .12s ease,border-color .12s ease,background .12s ease;color:#D8CFC2}
  .star svg{width:30px;height:30px}
  .star:focus-visible{outline:3px solid var(--amber);outline-offset:2px;border-color:var(--amber)}
  .star.sel{background:#FFF6E0;border-color:var(--amber);color:var(--amber);transform:scale(1.08)}
  .star.sel.s4,.star.sel.s5{background:#E3F1E8;border-color:var(--green);color:var(--green)}
  .prompt{min-height:28px;margin-top:6px;font-weight:700;color:var(--muted);font-size:.95rem}
  .btn{width:100%;max-width:340px;min-height:54px;border:0;border-radius:14px;background:var(--green);color:#fff;font-size:1.02rem;font-weight:800;font-family:inherit;cursor:pointer;opacity:.45;pointer-events:none;transition:opacity .15s,transform .12s;margin-top:26px}
  .btn.on{opacity:1;pointer-events:auto;box-shadow:0 6px 18px rgba(16,124,65,.3)}
  .btn.on:active{transform:translateY(1px)}
  .hint{color:var(--muted);font-size:.8rem;margin-top:14px;display:flex;align-items:center;justify-content:center;gap:6px}
  .hint svg{width:14px;height:14px}
  .legal{color:#B5AC9E;font-size:.68rem;margin:26px auto 18px;max-width:34ch;line-height:1.6}
  .legal a{color:inherit}
  .err{color:#C0392B;font-weight:700;font-size:.85rem;margin-top:10px;min-height:1.2em}
  .footnote{margin-top:auto;padding-bottom:16px;color:#C4BBB0;font-size:.7rem}
</style></head>
<body>
  <div class="top"><span class="mark"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 5.1 5.6.7-4.1 3.9 1 5.6L12 14.6 7.1 17.3l1-5.6L4 7.8l5.6-.7L12 2z"/></svg></span> Bintangin</div>
  <main>
    <div class="vname">${venue.name}</div>
    <div class="ask">Gimana tadi? Jujur aja, gas apa nggak?</div>
    <form id="f" method="post" action="/v/${venue.slug}/rating">
      <div class="stars" id="stars" role="radiogroup" aria-label="Rating">
        ${[1,2,3,4,5].map((n) => `<button type="button" class="star s${n}" data-n="${n}" aria-label="${n} bintang" tabindex="0">${STAR_SVG}</button>`).join("")}
      </div>
      <input type="hidden" name="stars" id="starsIn" required>
      <div class="prompt" id="prompt">Sentuh bintang buat mulai</div>
      <button class="btn" id="go" type="submit">Kirim</button>
      <div class="err" id="err"></div>
      <p class="hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Anonim — nggak dihubungkan ke identitasmu.</p>
    </form>
    <p class="legal">Dengan mengirim, kamu setuju rating dipakai pemilik tempat buat ningkatin layanan. Data maksimal 12 bulan, bisa minta hapus. <a href="/privacy">Kebijakan privasi</a>.</p>
  </main>
  <div class="footnote">Bintangin · review Google yang jujur</div>
<script>
const MSG=["","Jujur aja nih...","Masa gitu sih...","Biasa aja sih...","Enak!","Mantap banget!"];
const stars=[...document.querySelectorAll(".star")], inp=document.getElementById("starsIn"),
go=document.getElementById("go"), err=document.getElementById("err"), prompt=document.getElementById("prompt");
function sel(n){
  stars.forEach(s=>s.classList.toggle("sel",+s.dataset.n<=n));
  inp.value=n; go.disabled=false; go.classList.add("on");
  prompt.textContent=MSG[n];
}
stars.forEach(s=>{s.onclick=()=>sel(+s.dataset.n);s.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();sel(+s.dataset.n);}}});
document.getElementById("f").onsubmit=e=>{if(!inp.value){e.preventDefault();err.textContent="Pilih bintang dulu ya.";}};
</script>
</body></html>`;
}

// ---------- THANKS (arahkan ke Google Maps, semua rating) ----------
export function thanks(venue, rid, done) {
  const gUrl = venue.place_id
    ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(venue.place_id)}`
    : `https://www.google.com/search?q=${encodeURIComponent(venue.name + " review")}`;
  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Makasih! — ${venue.name}</title>${FONT}
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:#FFFDF8;color:#1C1917;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 22px;text-align:center;-webkit-font-smoothing:antialiased}
  .boom{width:74px;height:74px;border-radius:22px;background:#E3F1E8;color:#107C41;display:flex;align-items:center;justify-content:center;margin-bottom:18px;animation:pop .4s ease}
  .boom svg{width:38px;height:38px}
  @keyframes pop{0%{transform:scale(.5);opacity:0}100%{transform:scale(1);opacity:1}}
  h1{font-size:1.5rem;font-weight:800;letter-spacing:-.02em}
  h1 em{color:#107C41;font-style:normal}
  .sub{color:#6B6359;margin-top:8px;font-size:.95rem;max-width:34ch}
  .btn{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;max-width:340px;min-height:56px;margin-top:26px;border-radius:14px;background:#107C41;color:#fff;font-weight:800;font-size:1rem;text-decoration:none;box-shadow:0 6px 18px rgba(16,124,65,.3);transition:transform .12s}
  .btn:hover{transform:translateY(-2px)}
  .btn svg{width:20px;height:20px}
  .note{color:#6B6359;font-size:.78rem;margin-top:12px;max-width:32ch}
  details{margin-top:18px;width:100%;max-width:340px;border-top:1px solid #E9E3D8;padding-top:14px}
  summary{cursor:pointer;color:#6B6359;font-weight:600;font-size:.9rem}
  textarea{width:100%;border:1.5px solid #E9E3D8;border-radius:12px;padding:12px;font-family:inherit;font-size:.9rem;margin-top:10px;resize:vertical;background:#fff}
  .btn2{width:100%;min-height:46px;border-radius:12px;border:1.5px solid #E9E3D8;background:#fff;color:#1C1917;font-weight:700;font-family:inherit;font-size:.92rem;cursor:pointer;margin-top:8px}
  .legal{color:#B5AC9E;font-size:.68rem;margin-top:26px;max-width:36ch;line-height:1.6}
  .legal a{color:inherit}
  ${done ? `.ok{display:inline-flex;align-items:center;gap:6px;background:#E3F1E8;color:#0B5C30;font-weight:700;font-size:.82rem;padding:7px 13px;border-radius:20px;margin-bottom:12px}` : ""}
</style></head>
<body>
  <div class="boom"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
  ${done ? `<div class="ok">Catatan terkirim ke pemilik</div>` : ""}
  <h1>Makasih udah mampir di <em>${venue.name}</em>!</h1>
  <p class="sub">Satu langkah terakhir: bantu orang lain nemu tempat ini.</p>
  <a class="btn" href="${gUrl}" target="_blank" rel="noopener">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
    Buka Google Maps &amp; tulis review
  </a>
  <p class="note">Kamu yang nulis sendiri — tanpa imbalan, biar tetap jujur &amp; aman.</p>
  <details>
    <summary>Atau titip catatan buat pemilik (anonim)</summary>
    <form method="post" action="/v/${venue.slug}/note?r=${rid}">
      <textarea name="note" rows="2" placeholder="Cerita singkat, mau dikasih tau apa?"></textarea>
      <button class="btn2" type="submit">Kirim catatan</button>
    </form>
  </details>
  <p class="legal">Rating &amp; catatan dipakai pemilik buat ningkatin layanan. <a href="/privacy">Kebijakan privasi</a> · data maks 12 bulan.</p>
</body></html>`;
}

// ---------- LOGIN ----------
export function login(err) {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Login — Bintangin</title>${FONT}
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:#FBF9F4;color:#1C1917;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;-webkit-font-smoothing:antialiased}
  .box{width:100%;max-width:390px;background:#fff;border:1px solid #E9E3D8;border-radius:20px;padding:36px 30px;box-shadow:0 20px 50px -20px rgba(28,25,23,.18)}
  .logo{display:flex;align-items:center;gap:9px;font-weight:800;font-size:1.25rem;letter-spacing:-.01em;justify-content:center}
  .logo .mark{width:34px;height:34px;border-radius:10px;background:#107C41;color:#fff;display:flex;align-items:center;justify-content:center}
  .logo .mark svg{width:18px;height:18px}
  h1{font-size:1.2rem;font-weight:800;text-align:center;margin:20px 0 4px;letter-spacing:-.01em}
  .sub{color:#6B6359;font-size:.88rem;text-align:center;margin-bottom:22px}
  label{font-size:.78rem;font-weight:600;color:#6B6359}
  input{width:100%;padding:13px 14px;border:1.5px solid #E9E3D8;border-radius:12px;font-size:1rem;font-family:inherit;margin-top:6px;background:#FBF9F4;color:#1C1917}
  input:focus{outline:3px solid #F0DFBC;border-color:#E8A33D}
  button{width:100%;min-height:50px;border:0;border-radius:12px;background:#107C41;color:#fff;font-weight:800;font-size:1rem;font-family:inherit;cursor:pointer;margin-top:20px;box-shadow:0 4px 14px rgba(16,124,65,.25)}
  .err{background:#FDECEC;color:#C0392B;font-weight:600;font-size:.82rem;padding:10px 12px;border-radius:10px;margin-bottom:14px}
  .hint{color:#A49B8E;font-size:.72rem;text-align:center;margin-top:16px}
  .hint a{color:#107C41;text-decoration:none}
</style></head>
<body>
  <div class="box">
    <div class="logo"><span class="mark"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 5.1 5.6.7-4.1 3.9 1 5.6L12 14.6 7.1 17.3l1-5.6L4 7.8l5.6-.7L12 2z"/></svg></span> Bintangin</div>
    <h1>Masuk ke dashboard</h1>
    <p class="sub">Kelola venue, QR, dan rating kamu.</p>
    ${err ? `<div class="err">Password salah, coba lagi.</div>` : ""}
    <form method="post" action="/app/login">
      <label for="pw">Password</label>
      <input type="password" id="pw" name="password" placeholder="••••••••" autofocus required>
      <button type="submit">Masuk</button>
    </form>
    <p class="hint"><a href="/">← kembali ke beranda</a></p>
  </div>
</body></html>`;
}

// ---------- DASHBOARD (dark monitor-style) ----------
export function dashboard({ rows, total, base, qrUrl, googleUrl }) {
  const cards = rows.map((v) => `
  <div class="vcard">
    <div class="vhead">
      <div>
        <div class="vname">${v.name}</div>
        <div class="vslug">/${v.slug}</div>
      </div>
      <span class="plan ${v.plan}">${v.plan}</span>
    </div>
    <div class="qrwrap"><img src="${qrUrl(v)}" alt="QR ${v.name}"></div>
    <div class="qract">
      <a class="qbtn primary" href="/app/venues/${v.id}/qr" download>Download QR</a>
      <a class="qbtn" href="/app/venues/${v.id}/edit">Edit</a>
      <form method="post" action="/app/venues/${v.id}/delete" onsubmit="return confirm('Hapus "${v.name}" beserta semua ratingnya?')" style="display:inline">
        <button class="qbtn danger" type="submit">Hapus</button>
      </form>
    </div>
    <div class="vstats">
      <div class="stat"><b>${v.avg}</b><span>rata-rata</span></div>
      <div class="stat"><b>${v.c}</b><span>rating</span></div>
      <div class="stat"><b>${Math.round((v.avg || 0) / 5 * 100)}%</b><span>positif</span></div>
    </div>
    <a class="glink" href="${googleUrl(v)}" target="_blank" rel="noopener">Buka Google Maps →</a>
    <div class="vlink">Link QR: <span>${base}/v/${v.slug}</span></div>
    <div class="recent">
      ${v.recent.length ? v.recent.map((r) => `<div class="rrow"><span>${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</span><span class="rnote">${r.note || "—"}</span><span class="rtime">${r.created_at.slice(0, 16).replace("T", " ")}</span></div>`).join("") : `<div class="rrow empty">Belum ada rating. Pasang QR &amp; tunggu review pertama! ✨</div>`}
    </div>
  </div>`).join("");

  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dashboard — Bintangin</title>${FONT}
<style>
  :root{--bg:#0F1512;--panel:#17211B;--panel2:#1E2B23;--line:#26382D;--ink:#EDF3EE;--muted:#9DB3A5;--dim:#5F7468;--green:#3FBF4F;--amber:#E8A33D}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;-webkit-font-smoothing:antialiased}
  .top{background:var(--panel);border-bottom:1px solid var(--line);padding:0 26px;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20}
  .logo{font-weight:800;letter-spacing:-.01em;display:flex;align-items:center;gap:8px}
  .logo .mark{width:28px;height:28px;border-radius:8px;background:var(--green);color:#06210C;display:flex;align-items:center;justify-content:center}
  .logo .mark svg{width:15px;height:15px}
  .top-right{display:flex;align-items:center;gap:14px}
  .logout{background:transparent;border:1px solid var(--line);color:var(--muted);border-radius:8px;padding:7px 14px;font-size:.8rem;cursor:pointer;font-family:inherit;font-weight:600}
  .logout:hover{color:var(--ink)}
  main{padding:26px;max-width:1180px;margin:0 auto}
  .pagehead{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:22px}
  .pagehead h1{font-size:1.4rem;font-weight:800;letter-spacing:-.01em}
  .pagehead .sub{color:var(--muted);font-size:.88rem;margin-top:4px}
  .addform{display:flex;gap:10px;flex-wrap:wrap}
  .addform input{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:11px 14px;color:var(--ink);font-family:inherit;font-size:.9rem}
  .addform input::placeholder{color:var(--dim)}
  .addform input:focus{outline:2px solid var(--green)}
  .addform button{background:var(--green);color:#06210C;border:0;border-radius:10px;padding:11px 20px;font-weight:800;font-family:inherit;font-size:.9rem;cursor:pointer}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:18px}
  .vcard{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px;display:flex;flex-direction:column}
  .vhead{display:flex;justify-content:space-between;align-items:flex-start}
  .vname{font-weight:800;font-size:1.05rem;letter-spacing:-.01em}
  .vslug{font-family:"JetBrains Mono",monospace;font-size:.7rem;color:var(--dim);margin-top:2px}
  .plan{font-family:"JetBrains Mono",monospace;font-size:.62rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;padding:4px 9px;border-radius:20px;background:var(--panel2);color:var(--muted);border:1px solid var(--line)}
  .plan.pro{background:rgba(63,191,79,.12);color:var(--green);border-color:rgba(63,191,79,.35)}
  .qrwrap{display:flex;justify-content:center;margin:16px 0 14px}
  .qrwrap img{width:128px;height:128px;border-radius:12px;background:#fff;padding:9px;box-shadow:0 8px 24px rgba(0,0,0,.35)}
  .qract{display:flex;gap:8px;margin-bottom:14px}
  .qbtn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:9px 0;color:var(--ink);font-size:.8rem;font-weight:700;font-family:inherit;text-decoration:none;cursor:pointer;transition:border-color .12s}
  .qbtn:hover{border-color:var(--green)}
  .qbtn.primary{background:var(--green);border-color:var(--green);color:#06210C}
  .qbtn.primary:hover{filter:brightness(1.08)}
  .qbtn.danger:hover{border-color:#E5484D;color:#E5484D}
  .vstats{display:flex;justify-content:space-around;background:var(--panel2);border-radius:12px;padding:12px;margin-bottom:14px}
  .stat{text-align:center}
  .stat b{display:block;font-size:1.15rem;color:var(--green)}
  .stat span{font-size:.62rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
  .glink{display:block;text-align:center;color:#7EC8FF;text-decoration:none;font-size:.85rem;font-weight:600;margin-bottom:10px}
  .vlink{font-family:"JetBrains Mono",monospace;font-size:.68rem;color:var(--dim);word-break:break-all;border-top:1px solid var(--line);padding-top:10px;margin-top:4px}
  .vlink span{color:var(--muted)}
  .recent{margin-top:12px;border-top:1px solid var(--line);padding-top:10px}
  .rrow{display:flex;gap:8px;align-items:baseline;font-size:.78rem;padding:5px 0;border-bottom:1px solid rgba(38,56,45,.5)}
  .rrow:last-child{border-bottom:0}
  .rrow:first-child{color:var(--amber)}
  .rnote{color:var(--muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .rtime{color:var(--dim);font-family:"JetBrains Mono",monospace;font-size:.62rem;white-space:nowrap}
  .empty{color:var(--dim)}
</style></head>
<body>
  <div class="top">
    <div class="logo"><span class="mark"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 5.1 5.6.7-4.1 3.9 1 5.6L12 14.6 7.1 17.3l1-5.6L4 7.8l5.6-.7L12 2z"/></svg></span> Bintangin</div>
    <div class="top-right">
      <button class="logout" onclick="event.preventDefault();fetch('/app/logout',{method:'POST'}).then(()=>location='/app/login')">Logout</button>
    </div>
  </div>
  <main>
    <div class="pagehead">
      <div>
        <h1>Papan venue</h1>
        <div class="sub">${total} rating masuk · tiap QR di bawah siap tempel di meja</div>
      </div>
      <form class="addform" method="post" action="/app/venues">
        <input name="name" placeholder="Nama venue baru" required>
        <input name="place_id" placeholder="Google place ID (opsional)">
        <button type="submit">+ Tambah</button>
      </form>
    </div>
    <div class="grid">${cards}</div>
  </main>
</body></html>`;
}

// ---------- EDIT VENUE ----------
export function editVenue(v) {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Edit ${v.name} — Bintangin</title>${FONT}
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:#FBF9F4;color:#1C1917;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;-webkit-font-smoothing:antialiased}
  .box{width:100%;max-width:420px;background:#fff;border:1px solid #E9E3D8;border-radius:20px;padding:32px 28px;box-shadow:0 20px 50px -20px rgba(28,25,23,.18)}
  .logo{display:flex;align-items:center;gap:9px;font-weight:800;font-size:1.15rem;justify-content:center}
  .logo .mark{width:30px;height:30px;border-radius:9px;background:#107C41;color:#fff;display:flex;align-items:center;justify-content:center}
  .logo .mark svg{width:16px;height:16px}
  h1{font-size:1.2rem;font-weight:800;text-align:center;margin:18px 0 4px}
  .sub{color:#6B6359;font-size:.85rem;text-align:center;margin-bottom:20px}
  label{font-size:.78rem;font-weight:600;color:#6B6359;display:block;margin-top:14px}
  input{width:100%;padding:12px 14px;border:1.5px solid #E9E3D8;border-radius:12px;font-size:.95rem;font-family:inherit;margin-top:6px;background:#FBF9F4}
  input:focus{outline:3px solid #F0DFBC;border-color:#E8A33D}
  .slug{font-family:"JetBrains Mono",monospace;font-size:.72rem;color:#A49B8E;margin-top:5px}
  .row{display:flex;gap:10px;margin-top:22px}
  button{flex:1;min-height:48px;border:0;border-radius:12px;font-weight:800;font-family:inherit;font-size:.95rem;cursor:pointer}
  .save{background:#107C41;color:#fff}
  .cancel{background:#fff;border:1.5px solid #E9E3D8;color:#1C1917}
</style></head>
<body>
  <div class="box">
    <div class="logo"><span class="mark"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 5.1 5.6.7-4.1 3.9 1 5.6L12 14.6 7.1 17.3l1-5.6L4 7.8l5.6-.7L12 2z"/></svg></span> Bintangin</div>
    <h1>Edit venue</h1>
    <p class="sub">Ubah nama atau link Google Maps tempat kamu.</p>
    <form method="post" action="/app/venues/${v.id}/edit">
      <label for="name">Nama venue</label>
      <input id="name" name="name" value="${v.name}" required>
      <div class="slug">link QR: /${v.slug} (tidak berubah)</div>
      <label for="place_id">Google place ID (opsional)</label>
      <input id="place_id" name="place_id" placeholder="cth: ChIJv73t_LdOaS4R..." value="${v.place_id || ""}">
      <div class="row">
        <a class="cancel" href="/app" style="flex:1;min-height:48px;display:flex;align-items:center;justify-content:center;border-radius:12px;border:1.5px solid #E9E3D8;text-decoration:none;font-weight:800;color:#1C1917">Batal</a>
        <button class="save" type="submit">Simpan</button>
      </div>
    </form>
  </div>
</body></html>`;
}

// ---------- PRIVACY ----------
export function privacy() {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kebijakan Privasi — Bintangin</title>${FONT}
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:#FBF9F4;color:#1C1917;line-height:1.75;padding:40px 22px;-webkit-font-smoothing:antialiased}
  .wrap{max-width:640px;margin:0 auto}
  h1{font-size:1.5rem;font-weight:800;letter-spacing:-.01em;margin-bottom:14px}
  h2{font-size:1.02rem;font-weight:800;margin-top:22px;margin-bottom:6px}
  p{color:#4A4238;font-size:.93rem;margin-bottom:10px}
  ul{padding-left:20px;color:#4A4238;font-size:.93rem;margin-bottom:10px}
  a{color:#107C41}
</style></head>
<body>
  <div class="wrap">
    <h1>Kebijakan Privasi</h1>
    <h2>Data yang kami simpan</h2>
    <p>Rating (1–5), catatan opsional (anonim), waktu, dan hash anonim dari perangkat kamu. <b>Kami TIDAK menyimpan nama, nomor HP, atau identitas pelanggan.</b></p>
    <h2>Tujuan</h2>
    <ul>
      <li>Membantu pemilik venue meningkatkan layanan.</li>
      <li>Jika kamu memilih, mengarahkanmu menulis review di Google Maps — yang kamu tulis sendiri, tanpa imbalan.</li>
    </ul>
    <h2>Retensi &amp; hak hapus</h2>
    <p>Data disimpan maksimal 12 bulan. Kamu bisa minta penghapusan kapan saja dengan menghubungi pemilik venue atau admin Bintangin.</p>
    <h2>Review Google</h2>
    <p>Review di Google Maps ditulis langsung oleh kamu, tanpa imbalan apa pun — sesuai kebijakan Google.</p>
    <p><a href="/">← kembali ke beranda</a></p>
  </div>
</body></html>`;
}