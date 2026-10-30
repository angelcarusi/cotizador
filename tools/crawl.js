/* Recorre el catálogo de lift/leveling kits de Rough Country marca por marca
   y manda todos los kits a la Google Sheet. Se ejecuta en una pestaña de roughcountry.com
   (el navegador pasa Cloudflare). Necesita core.js cargado como C. */
(function (root) {
  'use strict';

  const MAKE_WORDS = /\b(chevy|chevrolet|gmc|ford|ram|dodge|toyota|jeep|nissan|honda|cadillac|mercedes[- ]benz|mitsubishi|subaru|suzuki|rivian|tesla|hummer|lincoln|infiniti|isuzu|mazda|kia|hyundai|lexus|land rover|international|plymouth)\b/gi;
  const DRIVE = /\b(2wd|4wd|4x4|4x2|awd|rwd|2wd\/4wd|4wd\/2wd)\b/gi;
  const NUM_MODELS = {
    chevy: { 1500: 'silverado-1500', 2500: 'silverado-2500-hd', 3500: 'silverado-3500-hd' },
    gmc: { 1500: 'sierra-1500', 2500: 'sierra-2500-hd', 3500: 'sierra-3500-hd' },
    ram: { 1500: '1500', 2500: '2500', 3500: '3500' },
    dodge: { 1500: 'ram-1500', 2500: 'ram-2500', 3500: 'ram-3500' }
  };
  const cap = s => s.replace(/\s+/g, ' ').trim().replace(/\b([a-z])/g, c => c.toUpperCase());

  function toYear(s) { const n = +s; return s.length === 4 ? n : (n < 50 ? 2000 + n : 1900 + n); }

  // "Chevy/GMC Sierra 1500 (19-26)/Silverado 1500 (19-26)" → [{name:'Sierra 1500', years:[2019,2026]}, …]
  function vehicleParts(title) {
    const segs = title.split('|').map(s => s.trim()).filter(Boolean);
    let v = segs.length > 1 ? segs[segs.length - 1] : segs[0];
    // si el último segmento no parece un vehículo, buscar uno que lo sea
    if (!/\(|\d{4}|wd\b/i.test(v)) { const alt = segs.slice(1).reverse().find(s => /\(|\d{2}\s*-\s*\d{2}|wd\b/i.test(s)); if (alt) v = alt; }
    const allYears = []; const ry = /\b(\d{4}|\d{2})\s*[-–]\s*(\d{4}|\d{2})\b/g; let y;
    while ((y = ry.exec(v))) allYears.push([toYear(y[1]), toYear(y[2])]);
    const plus = v.match(/\b(\d{4})\s*\+/); if (plus) allYears.push([+plus[1], 2100]);
    let clean = v.replace(/&\s*refresh/gi, '').replace(MAKE_WORDS, ' ').replace(DRIVE, ' ').replace(/\b(truck|suv|trucks|&)\b/gi, ' ');
    const parts = [];
    clean.split('/').forEach(p => {
      const yy = p.match(/\(([^)]*)\)/);
      let years = null;
      if (yy) { const m = yy[1].match(/(\d{4}|\d{2})\s*[-–]\s*(\d{4}|\d{2})/); if (m) years = [toYear(m[1]), toYear(m[2])]; }
      const name = p.replace(/\([^)]*\)/g, ' ').replace(/[^A-Za-z0-9 .\-]/g, ' ').replace(/\b(19|20)\d{2}\b/g, ' ').replace(/\s+/g, ' ').trim();
      if (name && /[a-z0-9]/i.test(name) && name.length <= 32) parts.push({ name, years });
    });
    // "F-250/F-350 Super Duty" → F-250 Super Duty ; "2500/3500" hereda el prefijo
    for (let i = 0; i < parts.length; i++) {
      const n = parts[i].name, next = parts[i + 1];
      if (next && /^[A-Za-z]?-?\d{3,4}(HD)?$/i.test(n) && /^[A-Za-z]?-?\d{3,4}/.test(next.name)) { const tail = next.name.replace(/^[A-Za-z]*-?\d{3,4}\s*(HD)?\s*/i, '').trim(); if (tail && /[a-z]/i.test(tail)) parts[i].name = n + ' ' + tail; }
      const prev = parts[i - 1];
      if (prev && /^\d{3,4}(HD)?$/i.test(parts[i].name)) { const head = prev.name.replace(/\s*\d{3,4}\s*(HD)?.*$/i, '').trim(); if (head) parts[i].name = head + ' ' + parts[i].name; }
    }
    parts.forEach(p => { if (!p.years) p.years = allYears[0] || null; });
    return parts;
  }

  // nombre → modelo conocido de esa marca, de otra marca (null = no guardar aquí) o modelo nuevo
  function canonical(C, mk, name) {
    const s = C.squash(name);
    const num = (s.match(/^(?:silverado|sierra|ram)?(1500|2500|3500)(?:hd)?$/) || [])[1];
    if (num && NUM_MODELS[mk] && NUM_MODELS[mk][num]) {
      if (/^silverado/.test(s) && mk !== 'chevy') return null;
      if (/^sierra/.test(s) && mk !== 'gmc') return null;
      return C.MODELS.find(m => m.mk === mk && m.md === NUM_MODELS[mk][num]);
    }
    let best = null, bestLen = 0, other = false;
    C.MODELS.forEach(m => {
      const keys = [C.squash(m.label), C.squash(m.md)].concat(m.alias || []).filter(k => k && k.length >= 3 && /[a-z]/.test(k));
      keys.forEach(k => {
        if (s === k || s.replace(/(superduty|hd)$/, '') === k.replace(/(superduty|hd)$/, '')) {
          if (m.mk !== mk) { if (k.length >= bestLen) other = true; return; }
          if (k.length > bestLen) { best = m; bestLen = k.length; other = false; }
        }
      });
    });
    if (best) return best;
    if (other) return null;
    if (/^\d+$/.test(s)) return null;
    return { mk, md: C.slugify(name), label: cap(name), generic: true };
  }

  function rowsFor(C, mk, items) {
    const out = [], seen = new Set();
    items.forEach(it => {
      const a = C.analyzeTitle(it.title);
      if (!a.kind || a.inches == null) return;
      const inst = a.kind === 'leveling' ? C.levelPrice(it.price) : C.liftPrice(it.price);
      if (inst == null) return;
      const d = a.drives ? [...a.drives] : [];
      vehicleParts(it.title).forEach(p => {
        const m = canonical(C, mk, p.name);
        if (!m) return;
        const clave = m.mk + '/' + m.md + '|' + it.title.toLowerCase();
        if (seen.has(clave)) return; seen.add(clave);
        const y = p.years || [];
        out.push({
          clave, marca: C.makeLabel(m.mk), modelo: m.label,
          traccion: d.length === 1 ? (d[0] === '4WD' ? '4x4' : '4x2') : (d.length > 1 ? '4x2 / 4x4' : 'Todas'),
          desde: y[0] || '', hasta: y[1] && y[1] < 2100 ? y[1] : '',
          tipo: a.kind, pulgadas: a.inches, instalado: inst, base: it.price, starting: !!it.starting,
          titulo: it.title, url: it.url || '', instala: '',
          dually: C.hasDually(m, []) || /\bdually\b|\bdrw\b/i.test(it.title)
        });
      });
    });
    return out;
  }

  async function fetchMake(C, mk, log) {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let all = [], total = null;
    for (let p = 1; p <= 25; p++) {
      const url = '/lift-kits/' + mk + (p > 1 ? '/page/' + p : '');
      let html = '';
      for (let t = 0; t < 3 && !html; t++) {
        const r = await fetch(url, { credentials: 'include' });
        if (r.status === 404) return all;
        const tx = await r.text();
        if (/Un momento|Just a moment|challenges\.cloudflare/i.test(tx.slice(0, 3000)) && !/Filter Results/i.test(tx)) { await sleep(4000); continue; }
        html = tx;
      }
      if (!html) { log(mk + ' p' + p + ': bloqueado'); break; }
      if (total == null) { const m = html.replace(/<[^>]+>/g, ' ').match(/Filter Results:?\s*(\d+)/i); total = m ? +m[1] : null; }
      const items = C.parseListing(new DOMParser().parseFromString(html, 'text/html')).items;
      const before = all.length;
      const keys = new Set(all.map(i => i.title + '|' + i.price));
      items.forEach(i => { if (!keys.has(i.title + '|' + i.price)) all.push(i); });
      log(mk + ' p' + p + ': ' + items.length + ' kits (total ' + all.length + (total ? '/' + total : '') + ')');
      if (!items.length || all.length === before) break;
      if (total && all.length >= total) break;
      await sleep(600);
    }
    return all;
  }

  async function send(sheet, rows) {
    for (let i = 0; i < rows.length; i += 120) {
      await fetch(sheet, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ kits: rows.slice(i, i + 120) }) });
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  async function crawl(C, makes, sheet, log) {
    const res = {};
    for (const mk of makes) {
      const items = await fetchMake(C, mk, log);
      const rows = rowsFor(C, mk, items);
      res[mk] = { kits: items.length, rows: rows.length };
      log(mk + ': ' + rows.length + ' filas → Sheet');
      if (rows.length && sheet) await send(sheet, rows);
    }
    return res;
  }

  const api = { vehicleParts, canonical, rowsFor, fetchMake, crawl };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Crawl = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
