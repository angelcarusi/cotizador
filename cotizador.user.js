// ==UserScript==
// @name         Cotizador Cheap on Tires
// @namespace    https://angelcarusi.github.io/cotizador/
// @version      1.1.0
// @description  Muestra la cotización lista para copiar sobre las páginas de lift kits de Rough Country.
// @match        https://www.roughcountry.com/*
// @match        https://roughcountry.com/*
// @require      https://angelcarusi.github.io/cotizador/core.js?v=7
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @connect      angelcarusi.github.io
// @run-at       document-idle
// @updateURL    https://angelcarusi.github.io/cotizador/cotizador.user.js
// @downloadURL  https://angelcarusi.github.io/cotizador/cotizador.user.js
// ==/UserScript==

(function () {
  'use strict';
  const C = (typeof Core !== 'undefined' && Core) || globalThis.Core;
  if (!C) return;
  const APP = 'https://angelcarusi.github.io/cotizador/';
  const SCRIPT_V = 2; // sube con cada cambio; script-version.txt dice cuál es la última

  // ---------- qué vehículo es ----------
  // La app manda los datos en el hash: #cot=<json>. Si no viene, se saca de la dirección.
  function readRequest() {
    let req = {};
    const h = location.hash.match(/cot=([^&]+)/);
    if (h) { try { req = JSON.parse(decodeURIComponent(h[1])); } catch (e) { req = {}; } }
    const parts = location.pathname.split('/').filter(Boolean);
    // /lift-kits/{marca}/{modelo}/{año}  ó  /lift-kits/{marca}/page/N/{modelo}/{año}
    const i = parts.findIndex(p => /lift-kits$/.test(p));
    if (i >= 0) {
      const rest = parts.slice(i + 1).filter((p, k, a) => !(p === 'page' || (a[k - 1] === 'page' && /^\d+$/.test(p))));
      if (!req.mk && rest[0]) req.mk = rest[0];
      if (!req.md && rest[1]) req.md = rest[1];
      if (!req.y && rest[2] && /^\d{4}$/.test(rest[2])) req.y = +rest[2];
    }
    return req;
  }
  const req = readRequest();
  if (!req.mk || !req.md) return; // no es una página de vehículo

  const model = C.resolveModel(req.mk, req.md);
  if (req.label && model.generic) model.label = req.label;
  const st = {
    drive: req.d || null,
    lang: req.l || 'en',
    inches: req.i != null && req.i !== '' ? +req.i : null,
    kind: req.k || null
  };

  // ---------- panel ----------
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
  <style>
    :host{all:initial}
    .p{font:15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#1b1f24;color:#e8eaec;
       border-radius:16px 16px 0 0;box-shadow:0 -6px 24px rgba(0,0,0,.35);padding:12px 14px calc(14px + env(safe-area-inset-bottom));
       max-height:72vh;overflow:auto;-webkit-overflow-scrolling:touch}
    .top{display:flex;align-items:center;gap:8px}
    .top b{flex:1;font-size:15px}
    .x{background:none;border:0;color:#9aa3ab;font-size:22px;line-height:1;padding:2px 6px}
    .chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
    .chips button{border:1px solid #30363c;background:#14171a;color:#e8eaec;border-radius:18px;padding:6px 11px;font:inherit;font-size:13px}
    .chips button.on{background:#e8eaec;color:#14171a;border-color:#e8eaec}
    .chips input{width:72px;border:1px solid #30363c;background:#14171a;color:#e8eaec;border-radius:18px;padding:6px 10px;font:inherit;font-size:13px}
    h3{font-size:12px;letter-spacing:.5px;text-transform:uppercase;color:#9aa3ab;margin:12px 0 6px;font-weight:600}
    pre{font:14px/1.45 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;word-break:break-word;background:#14171a;border:1px solid #30363c;border-radius:10px;padding:10px;margin:0 0 8px;user-select:all;-webkit-user-select:all}
    .copy{width:100%;border:0;border-radius:10px;padding:12px;font:inherit;font-weight:700;background:#ff6b2c;color:#111}
    .msg{color:#9aa3ab;font-size:13px;margin-top:8px}
    .warn{color:#ffa94d}
    .kits{font-size:12px;color:#9aa3ab;margin-top:6px}
    .kit{border-top:1px solid #30363c;padding:5px 0;display:flex;gap:6px;align-items:center}
    .kit span{flex:1;min-width:0}
    .kit button{border:1px solid #30363c;background:none;color:#e8eaec;border-radius:8px;padding:4px 8px;font-size:12px}
    .shk{padding:4px 0 6px}
    .shk input{width:110px}
    a{color:#ff8a50}
    .mini{position:fixed;right:14px;bottom:calc(16px + env(safe-area-inset-bottom));border:0;border-radius:24px;padding:12px 16px;font:600 15px -apple-system,Roboto,sans-serif;background:#ff6b2c;color:#111;box-shadow:0 4px 16px rgba(0,0,0,.35)}
    .toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(80px + env(safe-area-inset-bottom));background:#e8eaec;color:#14171a;padding:8px 14px;border-radius:18px;font:14px -apple-system,Roboto,sans-serif;opacity:0;transition:opacity .2s}
    .toast.on{opacity:1}
  </style>
  <div class="p" id="p">
    <div class="top"><b id="ttl"></b><button class="x" id="min" title="Minimizar">–</button></div>
    <div class="chips" id="drv"><button data-v="4WD">4x4</button><button data-v="2WD">4x2</button><button data-v="">Ambas</button></div>
    <div class="chips" id="lng"><button data-v="en">Inglés</button><button data-v="es">Español</button></div>
    <div class="chips"><input id="inch" inputmode="decimal" placeholder='Pulg.'><span id="kndBox"></span></div>
    <div id="out"><div class="msg">Leyendo los kits de esta página…</div></div>
    <div class="msg" id="upd" hidden><a href="${APP}cotizador.user.js">Hay una versión nueva del script: toca aquí y luego Actualizar</a></div>
    <div class="msg"><a href="${APP}">← Volver al cotizador</a></div>
  </div>
  <button class="mini" id="open" hidden>Cotización</button>
  <div class="toast" id="toast"></div>`;
  document.documentElement.appendChild(host);
  const $ = s => root.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  $('#ttl').textContent = `${C.makeLabel(model.mk)} ${model.label}${req.y ? ' ' + req.y : ''}`;
  $('#min').onclick = () => { $('#p').hidden = true; $('#open').hidden = false; };
  $('#open').onclick = () => { $('#p').hidden = false; $('#open').hidden = true; };
  function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('on'); setTimeout(() => e.classList.remove('on'), 1500); }
  function chips(id, key) {
    const box = $(id);
    const sync = () => box.querySelectorAll('button').forEach(b => b.classList.toggle('on', (b.dataset.v || null) === (st[key] || null)));
    box.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st[key] = b.dataset.v || null; sync(); render(); });
    sync();
  }
  chips('#drv', 'drive');
  chips('#lng', 'lang');
  const inch = $('#inch');
  if (st.inches != null) inch.value = C.inchStr(st.inches);
  inch.addEventListener('input', () => { const v = parseFloat(inch.value.replace(',', '.')); st.inches = v > 0 && v <= 12 ? v : null; render(); });
  if (st.kind) $('#kndBox').innerHTML = `<button class="on" id="kndX">${st.kind === 'leveling' ? 'Solo leveling' : 'Solo lift'} ✕</button>`;
  root.addEventListener('click', e => { if (e.target.id === 'kndX') { st.kind = null; $('#kndBox').innerHTML = ''; render(); } });

  // ---------- leer kits (con el navegador del usuario) ----------
  let items = [];
  const extras = {};
  function readThisPage() {
    return C.parseListing(document.cloneNode(true));
  }
  async function readAll() {
    const first = readThisPage();
    let all = first.items;
    const here = location.href.split('#')[0];
    const pages = first.pages.filter(u => u !== here && u.includes('/lift-kits/') && u.includes('/' + req.md)).slice(0, 6);
    if (pages.length) {
      const more = await Promise.all(pages.map(u => fetch(u, { credentials: 'include' }).then(r => r.text())
        .then(h => C.parseListing(new DOMParser().parseFromString(h, 'text/html')).items).catch(() => [])));
      more.forEach(x => { all = all.concat(x); });
    }
    const seen = new Set();
    return all.filter(it => { const k = it.title + '|' + it.price; if (seen.has(k)) return false; seen.add(k); return true; });
  }

  function render() {
    const out = $('#out');
    if (!items.length) {
      out.innerHTML = `<div class="msg warn">No encontré lift ni leveling kits en esta página. Si la página dice que no existe, revisa modelo y año en el cotizador.</div>`;
      return;
    }
    const q = { model, year: req.y || null, drive: st.drive, inches: st.inches, kind: st.kind, lang: st.lang };
    const res = C.buildQuote(items.map(it => Object.assign({}, it, { extra: extras[it.url || it.title] || 0 })), q);
    let html = '';
    res.blocks.forEach((b, bi) => {
      html += `<h3>${b.drive === '4WD' ? '4x4' : '4x2'}</h3>`;
      if (!b.kits.length) {
        const sizes = [...new Set(b.sizes.map(k => (k.kind === 'leveling' ? 'leveling ' : 'lift ') + C.inchStr(k.inches) + '"'))];
        html += `<div class="msg">No hay ${st.inches != null || st.kind ? 'ese kit' : 'kits'} para esta tracción.${sizes.length ? ' Disponibles: ' + esc(sizes.join(', ')) + '.' : ''}</div>`;
        return;
      }
      html += `<pre>${esc(b.text)}</pre><button class="copy" data-b="${bi}">Copiar</button><div class="kits">`;
      b.kits.forEach(k => {
        const key = k.url || k.title;
        html += `<div class="kit"><span>${C.inchStr(k.inches)}" ${k.kind} · ${C.money(k.price)}${k.extra ? ' + ' + C.money(k.extra) : ''} → <b>${C.money(k.sale)}</b> · ${esc(k.title)}</span>${k.kind === 'lift' ? `<button data-shk="${esc(key)}">Amort.</button>` : ''}</div><div class="shk" data-for="${esc(key)}" hidden></div>`;
      });
      html += `</div>`;
    });
    if (res.others.length) html += `<div class="msg">${res.others.length} kits de la página son de otro vehículo o año y no se cotizan.</div>`;
    out.innerHTML = html;
    out.querySelectorAll('.copy').forEach(btn => btn.onclick = () => copy(res.blocks[+btn.dataset.b].text));
    out.querySelectorAll('[data-shk]').forEach(btn => btn.onclick = () => shocks(btn.dataset.shk));
  }

  function copy(text) {
    try { GM_setClipboard(text, 'text'); toast('Copiado'); return; } catch (e) { }
    navigator.clipboard.writeText(text).then(() => toast('Copiado'), () => toast('Mantén presionado el texto para copiar'));
  }

  // amortiguadores opcionales: busca "+$" en la página del kit; si no, se escribe a mano
  async function shocks(key) {
    const box = [...root.querySelectorAll('.shk')].find(x => x.dataset.for === key);
    if (!box) return;
    if (!box.hidden) { box.hidden = true; return; }
    box.hidden = false;
    const manual = `<div class="chips"><input inputmode="decimal" placeholder="Extra $" data-m value="${extras[key] || ''}"><button data-ap>Aplicar</button></div>`;
    box.innerHTML = '<div class="msg">Buscando opciones…</div>' + manual;
    const wire = () => {
      const ap = box.querySelector('[data-ap]'), inp = box.querySelector('[data-m]');
      if (ap) ap.onclick = () => setExtra(key, parseFloat((inp.value || '0').replace(/[$,]/g, '')) || 0);
      box.querySelectorAll('[data-add]').forEach(b => b.onclick = () => setExtra(key, +b.dataset.add));
    };
    wire();
    if (!/^https?:/.test(key)) { box.querySelector('.msg').textContent = 'Escribe el precio extra del amortiguador:'; return; }
    try {
      const doc = new DOMParser().parseFromString(await fetch(key, { credentials: 'include' }).then(r => r.text()), 'text/html');
      const opts = shockOptions(doc);
      if (!opts.length) { box.querySelector('.msg').textContent = 'No encontré las opciones. Escribe el precio extra:'; return; }
      box.innerHTML = '<div class="chips">' + [{ name: 'Básico', add: 0 }].concat(opts).map(o => `<button data-add="${o.add}" class="${Math.abs(o.add - (extras[key] || 0)) < .01 ? 'on' : ''}">${esc(o.name)}${o.add ? ' +' + C.money(o.add) : ''}</button>`).join('') + '</div>' + manual;
      wire();
    } catch (e) { box.querySelector('.msg').textContent = 'No pude abrir el kit. Escribe el precio extra:'; }
  }
  function setExtra(key, add) { if (add) extras[key] = add; else delete extras[key]; render(); }
  function shockOptions(doc) {
    const seen = new Map();
    const lines = [];
    doc.querySelectorAll('script,style').forEach(n => n.remove());
    const w = doc.createTreeWalker(doc.body, 4); let n;
    while ((n = w.nextNode())) { const t = n.nodeValue.replace(/\s+/g, ' ').trim(); if (t) lines.push(t); }
    const re = /([A-Za-z0-9][A-Za-z0-9 .,'\/\-]{1,48}?)\s*\+\s*\$\s*([\d,]+\.\d{2})/g; let m;
    const joined = lines.join('\n');
    while ((m = re.exec(joined))) {
      const name = m[1].trim(); const add = parseFloat(m[2].replace(/,/g, ''));
      if (add > 0 && add < 5000 && !seen.has(name)) seen.set(name, add);
    }
    return [...seen].map(([name, add]) => ({ name, add })).slice(0, 8);
  }

  // ---------- arrancar ----------
  // La lista puede terminar de cargar después; se vuelve a leer unas veces si cambia.
  let lastCount = -1, tries = 0;
  async function run() {
    try { items = await readAll(); } catch (e) { items = []; }
    if (items.length !== lastCount) { lastCount = items.length; render(); }
    if (++tries < 4) setTimeout(run, tries === 1 ? 1200 : 2500);
  }
  run();

  // aviso de versión nueva
  try {
    GM_xmlhttpRequest({ method: 'GET', url: APP + 'script-version.txt?t=' + Date.now(), onload: r => {
      const v = parseInt(String(r.responseText || '').trim(), 10);
      if (v > SCRIPT_V) $('#upd').hidden = false;
    } });
  } catch (e) { }
})();
