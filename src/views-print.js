// views-print.js — cetak kartu kosong (batch 4x per A4)
import { FONT } from "./views-core.js";

export function printBlankCards(cards, baseUrl, qrFor) {
  const items = cards.map((c) => {
    const url = `${baseUrl}/c/${c.token}`;
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;
    return `<div class="card-wrap">
      <div class="card">
        <div class="brand"><span class="mark"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 5.1 5.6.7-4.1 3.9 1 5.6L12 14.6 7.1 17.3l1-5.6L4 7.8l5.6-.7L12 2z"/></svg></span> Bintangin <span class="brandsub">· aktivasi kartu</span></div>
        <span class="stamp">SCAN ME</span>
        <div class="qr"><img src="${qr}" alt="QR kartu"><i class="nw"></i><i class="ne"></i><i class="sw"></i><i class="se"></i></div>
        <div class="stars">
          <svg class="star-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 5.1 5.6.7-4.1 3.9 1 5.6L12 14.6 7.1 17.3l1-5.6L4 7.8l5.6-.7L12 2z"/></svg>
          <svg class="star-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 5.1 5.6.7-4.1 3.9 1 5.6L12 14.6 7.1 17.3l1-5.6L4 7.8l5.6-.7L12 2z"/></svg>
          <svg class="star-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 5.1 5.6.7-4.1 3.9 1 5.6L12 14.6 7.1 17.3l1-5.6L4 7.8l5.6-.7L12 2z"/></svg>
          <svg class="star-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 5.1 5.6.7-4.1 3.9 1 5.6L12 14.6 7.1 17.3l1-5.6L4 7.8l5.6-.7L12 2z"/></svg>
          <svg class="star-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 5.1 5.6.7-4.1 3.9 1 5.6L12 14.6 7.1 17.3l1-5.6L4 7.8l5.6-.7L12 2z"/></svg>
        </div>
        <div class="title">Kartu belum aktif</div>
        <div class="subtitle">Scan buat aktivasi ke tempat kamu</div>
        <div class="cta"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 5.1 5.6.7-4.1 3.9 1 5.6L12 14.6 7.1 17.3l1-5.6L4 7.8l5.6-.7L12 2z"/></svg> Bintangin, yuk</div>
        <div class="code">#${c.token.toUpperCase()}</div>
        <div class="foot">review google yang jujur</div>
      </div>
    </div>`;
  }).join("");

  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cetak Kartu Kosong — Bintangin</title>${FONT}
<style>
  @page { size: A4; margin: 8mm; }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:#E4DFD5;color:#1C1917}
  .toolbar{max-width:196mm;margin:0 auto;padding:14px 4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .toolbar .t{font-weight:800;margin-right:auto}
  .toolbar .t small{display:block;font-weight:500;color:#6B6359;font-size:.78rem}
  .tbtn{display:inline-flex;align-items:center;gap:7px;border:0;border-radius:11px;padding:11px 18px;font-weight:800;font-family:inherit;font-size:.9rem;cursor:pointer;text-decoration:none}
  .tbtn.print{background:#107C41;color:#fff}
  .tbtn.ghost{background:#fff;border:1px solid #D8D0C2;color:#1C1917}
  .sheet{width:196mm;margin:0 auto;background:#fff;border-radius:4px;box-shadow:0 6px 24px rgba(0,0,0,.12);padding:7mm 6mm;display:grid;grid-template-columns:repeat(2,91mm);justify-content:space-between;row-gap:7mm}
  .card-wrap{position:relative}
  .card{position:relative;width:91mm;height:134mm;background:#FFFDF8;border:0.4mm solid #E5DED2;border-radius:3mm;overflow:hidden;display:flex;flex-direction:column;align-items:center;padding:8mm 5mm 5mm;text-align:center}
  .card::before{content:"";position:absolute;inset:0;background:radial-gradient(130% 65% at 100% 0%, #E3F1E8 0%, transparent 58%),radial-gradient(110% 55% at 0% 100%, #FBF0DC 0%, transparent 60%)}
  .card>*{position:relative}
  .brand{display:flex;align-items:center;gap:1.8mm;font-weight:800;font-size:3.8mm;letter-spacing:.5mm;color:#107C41;text-transform:uppercase}
  .brand .mark{width:6.4mm;height:6.4mm;border-radius:1.8mm;background:#107C41;color:#fff;display:flex;align-items:center;justify-content:center}
  .brand .mark svg{width:3.6mm;height:3.6mm}
  .brandsub{font-weight:600;font-size:2.4mm;color:#A49B8E;letter-spacing:.2mm}
  .stamp{position:absolute;top:7.5mm;right:0;background:#E8A33D;color:#fff;font-weight:800;font-size:2.7mm;letter-spacing:.7mm;padding:1.7mm 6mm 1.7mm 3.5mm;border-radius:0 0 0 2mm}
  .qr{position:relative;width:47mm;height:47mm;background:#fff;border-radius:2.5mm;padding:1.6mm;margin-top:4.5mm;box-shadow:0 1.2mm 3.5mm rgba(28,25,23,.10)}
  .qr img{width:100%;height:100%;display:block;border-radius:1mm}
  .qr i{position:absolute;width:4.2mm;height:4.2mm;border:.55mm solid #107C41}
  .qr i.nw{top:2.4mm;left:2.4mm;border-right:0;border-bottom:0}
  .qr i.ne{top:2.4mm;right:2.4mm;border-left:0;border-bottom:0}
  .qr i.sw{bottom:2.4mm;left:2.4mm;border-right:0;border-top:0}
  .qr i.se{bottom:2.4mm;right:2.4mm;border-left:0;border-top:0}
  .stars{display:flex;gap:1.4mm;color:#E8A33D;margin-top:3.2mm}
  .star-svg{width:3.6mm;height:3.6mm;display:block}
  .title{font-weight:800;font-size:5.6mm;margin-top:2mm;letter-spacing:-.1mm}
  .subtitle{color:#6B6359;font-size:3mm;margin-top:1.6mm}
  .cta{margin-top:auto;background:#107C41;color:#fff;font-weight:800;font-size:4.2mm;padding:2.8mm 9mm;border-radius:10mm;display:inline-flex;align-items:center;gap:1.8mm}
  .cta svg{width:4mm;height:4mm}
  .foot{margin-top:2.6mm;color:#A49B8E;font-size:2.3mm;letter-spacing:.25mm;text-transform:uppercase;font-weight:600}
  .code{font-family:"JetBrains Mono",monospace;font-size:2.6mm;color:#6B6359;margin-top:1.8mm;letter-spacing:.4mm}
  @media print{body{background:#fff}.toolbar{display:none!important}.sheet{box-shadow:none;border-radius:0;padding:0;margin:0}.card-wrap{break-inside:avoid}}
  @media (max-width:760px){.sheet{transform:scale(.42);transform-origin:top left;width:196mm}.toolbar{max-width:100%;padding:10px 14px}}
</style></head>
<body>
  <div class="toolbar">
    <div class="t">Kartu Kosong <small>${cards.length} kartu · siap QR/NFC · 4 per lembar A4</small></div>
    <a class="tbtn ghost" href="/app">← Dashboard</a>
    <button class="tbtn print" onclick="window.print()">🖨️ Print</button>
  </div>
  <div class="sheet">${items}</div>
</body></html>`;
}