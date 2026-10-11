// views-core.js — login, privacy, dashboard (kartu), aktivasi kartu
export const FONT = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">`;

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
    <p class="sub">Kelola kartu fisik QR/NFC &amp; aktivasi.</p>
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
    <p>Data kartu (token unik), data tempat yang dipilih pemilik saat aktivasi (nama &amp; ID tempat Google), dan waktu aktivasi. <b>Kami TIDAK menyimpan nama, nomor HP, atau identitas pelanggan yang scan kartu.</b></p>
    <h2>Tujuan</h2>
    <ul>
      <li>Menghubungkan kartu fisik QR/NFC ke halaman review Google Maps milik bisnis kamu.</li>
      <li>Setelah aktivasi, scan kartu langsung membuka halaman review Google tempat tersebut.</li>
    </ul>
    <h2>Retensi &amp; hak hapus</h2>
    <p>Data disimpan selama kartu terdaftar. Reset/penghapusan kartu menghapus kaitan tempatnya. Kamu bisa minta penghapusan kapan saja dengan menghubungi admin Bintangin.</p>
    <h2>Review Google</h2>
    <p>Review di Google Maps ditulis langsung oleh pelanggan, tanpa imbalan apa pun — sesuai kebijakan Google.</p>
    <p><a href="/">← kembali ke beranda</a></p>
  </div>
</body></html>`;
}

// ---------- ACTIVATE CARD (login pemilik) — cari tempat via Google Places / link Maps ----------
export function activateCard(card, acc, baseUrl, hasKey) {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Aktivasi Kartu — Bintangin</title>${FONT}
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:#FBF9F4;color:#1C1917;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;-webkit-font-smoothing:antialiased}
  .card{width:100%;max-width:460px;background:#fff;border:1px solid #E9E3D8;border-radius:20px;padding:30px 26px;box-shadow:0 20px 50px -20px rgba(28,25,23,.2)}
  .logo{display:flex;align-items:center;gap:9px;font-weight:800;justify-content:center}
  .logo .mark{width:32px;height:32px;border-radius:10px;background:#107C41;color:#fff;display:flex;align-items:center;justify-content:center}
  .logo .mark svg{width:17px;height:17px}
  h1{font-size:1.25rem;font-weight:800;text-align:center;margin:18px 0 6px}
  .sub{color:#6B6359;font-size:.88rem;text-align:center;margin-bottom:20px;line-height:1.5}
  .who-chip{display:flex;align-items:center;justify-content:center;gap:7px;background:#E3F1E8;border:1px solid #CBE3D4;color:#0B5C30;border-radius:20px;padding:6px 14px;font-size:.78rem;font-weight:700;margin:0 auto 18px;width:fit-content}
  .quota{display:flex;align-items:center;justify-content:center;gap:7px;background:#FBF0DC;border:1px solid #F3DFC0;color:#8A5A00;border-radius:20px;padding:6px 14px;font-size:.78rem;font-weight:700;margin:0 auto 18px;width:fit-content}
  .code-chip{display:flex;align-items:center;gap:7px;background:#F4F0E8;border:1px solid #E9E3D8;border-radius:20px;padding:5px 13px;font-family:"JetBrains Mono",monospace;font-size:.72rem;color:#6B6359;margin:8px auto 18px;justify-content:center;width:fit-content}
  .field{margin-bottom:14px}
  label{font-size:.78rem;font-weight:600;color:#6B6359;display:block;margin-bottom:6px}
  .inputwrap{position:relative}
  input{width:100%;padding:13px 14px;border:1.5px solid #E9E3D8;border-radius:12px;font-size:1rem;font-family:inherit;background:#FBF9F4;color:#1C1917}
  input:focus{outline:3px solid #F0DFBC;border-color:#E8A33D}
  .results{list-style:none;margin-top:8px;border:1px solid #E9E3D8;border-radius:12px;overflow:hidden;background:#fff;display:none;max-height:260px;overflow-y:auto}
  .results.show{display:block}
  .results li{padding:12px 14px;cursor:pointer;font-size:.9rem;border-bottom:1px solid #F4F0E8;display:flex;align-items:center;gap:9px}
  .results li:last-child{border-bottom:0}
  .results li:hover{background:#F4F0E8}
  .results li .pin{color:#107C41;flex:none}
  .results li .pin svg{width:16px;height:16px}
  .results .empty{padding:14px;color:#A49B8E;font-size:.85rem;text-align:center}
  button{width:100%;min-height:52px;border:0;border-radius:12px;background:#107C41;color:#fff;font-weight:800;font-size:1rem;font-family:inherit;cursor:pointer;margin-top:8px;box-shadow:0 4px 14px rgba(16,124,65,.25)}
  button:disabled{opacity:.45;cursor:not-allowed}
  .warn{background:#FBF0DC;border:1px solid #F3DFC0;color:#8A5A00;font-size:.82rem;padding:10px 12px;border-radius:10px;margin-bottom:14px;line-height:1.5}
  .tabs{display:flex;gap:6px;background:#F4F0E8;border-radius:11px;padding:4px;margin-bottom:14px}
  .tab{flex:1;min-height:38px;border:0;border-radius:8px;background:transparent;font-family:inherit;font-weight:700;font-size:.85rem;color:#6B6359;cursor:pointer}
  .tab.active{background:#fff;color:#1C1917;box-shadow:0 1px 3px rgba(28,25,23,.12)}
  .pane.hidden{display:none}
  .hint2{color:#A49B8E;font-size:.74rem;margin-top:8px;line-height:1.5}
  .hint2 b{color:#6B6359}
  .footer{color:#A49B8E;font-size:.72rem;text-align:center;margin-top:18px}
  .footer a{color:#107C41;text-decoration:none}
</style></head>
<body>
  <div class="card">
    <div class="logo"><span class="mark"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 5.1 5.6.7-4.1 3.9 1 5.6L12 14.6 7.1 17.3l1-5.6L4 7.8l5.6-.7L12 2z"/></svg></span> Bintangin</div>
    <h1>Aktivasi kartu</h1>
    <p class="sub">Hubungkan kartu ini ke review Google tempatmu.</p>
    <div class="who-chip">Akun: ${acc.name} (@${acc.username})</div>
    <div class="code-chip">Kartu #${card.token.slice(0, 8).toUpperCase()}</div>
    ${acc.quota > 0
      ? `<div class="quota">⚡ Sisa kuota aktivasi: <b>${acc.quota}</b></div>`
      : `<div class="quota">⚠️ Kuota aktivasi habis. Top up 20rb di dashboard dulu.</div>`}
    ${hasKey ? "" : `<div class="warn">Mode demo — tombol "pilih tempat" butuh GOOGLE_PLACES_API_KEY. Pakai mode "tempel link Maps" di bawah, tanpa API & tanpa saldo. Ini cara ambil link-nya: buka tempatmu di Google Maps → Share → Copy link, contoh: https://maps.app.goo.gl/xxxx</div>`}
    <form method="post" action="/a/${card.token}" id="form">
      <div class="tabs">
        <button type="button" class="tab active" data-tab="pick">Cari nama tempat</button>
        <button type="button" class="tab" data-tab="paste">Tempel link Maps</button>
      </div>
      <div class="panes">
        <div class="pane" data-pane="pick">
          <div class="field">
            <label for="q">Nama tempat / bisnis kamu</label>
            <div class="inputwrap">
              <input id="q" placeholder="Ketik minimal 3 huruf... cth: Kopi Senja" autocomplete="off" required>
            </div>
            <ul class="results" id="results"></ul>
          </div>
          <input type="hidden" name="place_id" id="place_id">
          <input type="hidden" name="place_name" id="place_name">
        </div>
        <div class="pane hidden" data-pane="paste">
          <div class="field">
            <label for="maps_url">Link Google Maps tempat kamu</label>
            <div class="inputwrap">
              <input id="maps_url" name="maps_url" placeholder="https://maps.app.goo.gl/xxxx atau https://www.google.com/maps/place/..." autocomplete="off">
            </div>
            <p class="hint2">Buka tempatmu di Google Maps → <b>Share</b> → <b>Copy link</b>, tempel di sini. Kami pakai link ini langsung tanpa API.</p>
          </div>
        </div>
      </div>
      <button type="submit" id="btn" disabled>Aktivasi kartu</button>
    </form>
    <p class="footer">Dengan aktivasi, kamu menghubungkan kartu ini ke review Google tempatmu. <a href="/privacy">Kebijakan privasi</a></p>
  </div>
<script>
const q=document.getElementById('q'),results=document.getElementById('results'),
pid=document.getElementById('place_id'),pname=document.getElementById('place_name'),btn=document.getElementById('btn');
const mapsU=document.getElementById('maps_url');
const pickPane=document.querySelector('[data-pane="pick"]'),pastePane=document.querySelector('[data-pane="paste"]');
let deb;
const pinSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function updateBtn(){
  if(pastePane.classList.contains('hidden')){
    btn.disabled = !(pid.value && pname.value);
  } else {
    btn.disabled = mapsU.value.trim().length < 10;
  }
}
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===t));
  const pick = t.dataset.tab==='pick';
  pickPane.classList.toggle('hidden',!pick);
  pastePane.classList.toggle('hidden',pick);
  updateBtn();
});
mapsU.addEventListener('input',updateBtn);
document.getElementById('form').addEventListener('submit',e=>{
  if(!pastePane.classList.contains('hidden')){ return; } // mode paste pakai field maps_url langsung
  if(!pid.value||!pname.value){ e.preventDefault(); q.focus(); }
});
q.addEventListener('input',()=>{clearTimeout(deb);deb=setTimeout(async()=>{
  const v=q.value.trim();
  if(v.length<3){results.classList.remove('show');results.innerHTML='';return;}
  try{
    const r=await fetch('/api/places?q='+encodeURIComponent(v));
    const d=await r.json();
    if(!d.predictions||!d.predictions.length){results.innerHTML='<li class="empty">Tempat nggak ketemu. Coba kata kunci lain.</li>';results.classList.add('show');return;}
    results.innerHTML=d.predictions.map(p=>'<li data-id="'+esc(p.place_id)+'" data-name="'+esc(p.desc)+'"><span class="pin">'+pinSvg+'</span>'+esc(p.desc)+'</li>').join('');
    results.classList.add('show');
    results.querySelectorAll('li[data-id]').forEach(li=>li.onclick=()=>{
      pid.value=li.dataset.id; pname.value=li.dataset.name; q.value=li.dataset.name;
      results.classList.remove('show'); updateBtn();
    });
  }catch(e){results.innerHTML='<li class="empty">Gagal cari. Coba lagi.</li>';results.classList.add('show');}
},350);});
q.addEventListener('focus',()=>{if(results.innerHTML&&!btn.disabled)results.classList.add('show');});
document.addEventListener('click',e=>{if(!e.target.closest('.inputwrap')&&!e.target.closest('.results'))results.classList.remove('show');});
</script>
</body></html>`;
}