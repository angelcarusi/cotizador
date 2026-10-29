/* Cotizador Cheap on Tires — lógica pura (reglas, lectura de Rough Country, mensajes).
   Sin dependencias. La usa index.html y también las pruebas. */
(function (root) {
  'use strict';

  // ---------- Vehículos conocidos ----------
  // mk/md = cómo los nombra Rough Country en sus direcciones: /lift-kits/{mk}/{md}/{año}
  // alias = formas en que los escriben los clientes (se comparan sin espacios ni guiones)
  // match = el título del kit debe mencionar el modelo (Rough Country mezcla otros vehículos en la página)
  const MAKES = [
    ['ford', 'Ford'], ['chevy', 'Chevy'], ['gmc', 'GMC'], ['ram', 'Ram'], ['dodge', 'Dodge'],
    ['toyota', 'Toyota'], ['jeep', 'Jeep'], ['nissan', 'Nissan'], ['honda', 'Honda'],
    ['mercedes-benz', 'Mercedes-Benz'], ['mitsubishi', 'Mitsubishi'], ['subaru', 'Subaru'],
    ['cadillac', 'Cadillac'], ['rivian', 'Rivian'], ['suzuki', 'Suzuki'], ['tesla', 'Tesla']
  ];

  const MODELS = [
    { mk: 'ford', md: 'f-150', label: 'F-150', alias: ['f150', 'fordf150', 'lobo'], match: /f-?150(?!\s*(lightning|raptor))/i },
    { mk: 'ford', md: 'f-150-raptor', label: 'Raptor', alias: ['raptor', 'f150raptor'], match: /raptor/i },
    { mk: 'ford', md: 'f-150-lightning', label: 'F-150 Lightning', alias: ['lightning', 'f150lightning'], match: /lightning/i },
    { mk: 'ford', md: 'f-250-super-duty', label: 'F-250 Super Duty', alias: ['f250', 'f250superduty', 'superduty250'], match: /f-?250|super ?duty/i },
    { mk: 'ford', md: 'f-350-super-duty', label: 'F-350 Super Duty', alias: ['f350', 'f350superduty', 'superduty350'], match: /f-?350|super ?duty/i },
    { mk: 'ford', md: 'ranger', label: 'Ranger', alias: ['fordranger', 'ranger'], match: /ranger/i },
    { mk: 'ford', md: 'bronco', label: 'Bronco', alias: ['bronco'], match: /bronco/i, not: /bronco sport/i },
    { mk: 'ford', md: 'expedition', label: 'Expedition', alias: ['expedition'], match: /expedition/i },
    { mk: 'chevy', md: 'silverado-1500', label: 'Silverado 1500', alias: ['silverado1500', 'silverado', 'chevy1500', 'chevrolet1500', 'cheyenne'], match: /silverado|chevy\s*\/\s*gmc[^|]*1500|\bgm\b[^|]*1500/i, not: /2500|3500|hd\b/i },
    { mk: 'chevy', md: 'silverado-2500-hd', label: 'Silverado 2500 HD', alias: ['silverado2500hd', 'silverado2500', 'chevy2500', 'chevrolet2500'], match: /2500/i },
    { mk: 'chevy', md: 'colorado', label: 'Colorado', alias: ['colorado'], match: /colorado/i },
    { mk: 'chevy', md: 'tahoe', label: 'Tahoe', alias: ['tahoe'], match: /tahoe|1500 (truck & )?suv/i },
    { mk: 'gmc', md: 'sierra-1500', label: 'Sierra 1500', alias: ['sierra1500', 'sierra', 'gmc1500'], match: /sierra|chevy\s*\/\s*gmc[^|]*1500|\bgm\b[^|]*1500/i, not: /2500|3500|hd\b/i },
    { mk: 'gmc', md: 'sierra-2500-hd', label: 'Sierra 2500 HD', alias: ['sierra2500hd', 'sierra2500', 'gmc2500'], match: /2500/i },
    { mk: 'gmc', md: 'canyon', label: 'Canyon', alias: ['canyon'], match: /canyon/i },
    { mk: 'gmc', md: 'yukon', label: 'Yukon', alias: ['yukon'], match: /yukon|1500 (truck & )?suv/i },
    { mk: 'ram', md: '1500', label: '1500', alias: ['ram1500', 'dodgeram1500', 'dodge1500'], match: /1500/i, not: /classic/i },
    { mk: 'ram', md: '1500-classic', label: '1500 Classic', alias: ['ram1500classic', 'classic1500'], match: /1500/i },
    { mk: 'ram', md: '2500', label: '2500', alias: ['ram2500', 'dodgeram2500', 'dodge2500'], match: /2500/i },
    { mk: 'ram', md: '3500', label: '3500', alias: ['ram3500', 'dodgeram3500', 'dodge3500'], match: /3500/i },
    { mk: 'toyota', md: 'tacoma', label: 'Tacoma', alias: ['tacoma', 'taco'], match: /tacoma/i },
    { mk: 'toyota', md: 'tundra', label: 'Tundra', alias: ['tundra'], match: /tundra/i },
    { mk: 'toyota', md: '4runner', label: '4Runner', alias: ['4runner', 'forerunner', 'fourrunner'], match: /4runner/i },
    { mk: 'jeep', md: 'wrangler-jl', label: 'Wrangler JL', alias: ['wranglerjl', 'jl'], match: /wrangler|\bjl\b/i },
    { mk: 'jeep', md: 'wrangler-jk', label: 'Wrangler JK', alias: ['wranglerjk', 'jk'], match: /wrangler|\bjk\b/i },
    { mk: 'jeep', md: 'gladiator', label: 'Gladiator', alias: ['gladiator'], match: /gladiator|\bjt\b/i },
    { mk: 'jeep', md: 'grand-cherokee', label: 'Grand Cherokee', alias: ['grandcherokee'], match: /grand cherokee/i },
    { mk: 'nissan', md: 'frontier', label: 'Frontier', alias: ['frontier'], match: /frontier/i },
    { mk: 'nissan', md: 'titan', label: 'Titan', alias: ['titan'], match: /titan/i }
  ];

  const makeLabel = mk => (MAKES.find(m => m[0] === mk) || [mk, cap(mk)])[1];
  function cap(s) { return String(s || '').replace(/\b\w/g, c => c.toUpperCase()); }
  const squash = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const slugify = s => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Modelo para una marca y texto/slug cualquiera. Si no lo conocemos, se arma uno genérico.
  function resolveModel(mk, text) {
    mk = slugify(mk);
    const s = squash(text);
    if (!mk || !s) return null;
    const known = MODELS.filter(m => m.mk === mk);
    const hit = known.find(m => squash(m.md) === s || squash(m.label) === s) ||
      known.find(m => m.alias.includes(s));
    if (hit) return hit;
    const md = slugify(text);
    const words = md.split('-').filter(w => w && !/^(super|duty|hd)$/.test(w));
    const named = words.filter(w => /[a-z]/.test(w));
    const key = (named.length ? named : words).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return { mk, md, label: cap(text), alias: [], match: key.length ? new RegExp(key.join('|'), 'i') : /./, generic: true };
  }

  // ---------- Leer el mensaje del cliente (sin IA) ----------
  function localParse(msg) {
    const raw = String(msg || '');
    const low = raw.toLowerCase();
    const sq = squash(raw);
    const out = { model: null, year: null, drive: null, inches: null, kind: null };

    // modelo: alias más largo primero
    // modelo: alias más largo primero. Un número solo ("1500") no basta: necesita la marca.
    const all = [];
    MODELS.forEach(m => {
      const own = squash(m.md);
      m.alias.concat(/[a-z]/.test(own) ? [own] : []).forEach(a => all.push([a, m]));
    });
    all.sort((a, b) => b[0].length - a[0].length);
    for (const [a, m] of all) {
      const ok = a.length < 3 ? new RegExp('\\b' + a + '\\b', 'i').test(low) : sq.includes(a);
      if (ok) { out.model = m; break; }
    }

    const y4 = low.match(/\b(19[89]\d|20[0-4]\d)\b/);
    if (y4) out.year = +y4[1];
    else {
      const y2 = low.match(/(?:'|’|\bdel\s|\bmodelo\s|\byear\s)(\d{2})\b/);
      if (y2) out.year = +y2[1] < 50 ? 2000 + +y2[1] : 1900 + +y2[1];
    }

    // tracción: 4WD / AWD / 4x4 → 4x4 ; 2WD / RWD / 4x2 → 4x2 (acepta 4×4, 4-wd, "4 wheel drive", "4 por 4"…)
    const dl = low.replace(/[×✕✖*]/g, 'x');
    const is4 = /\b4\s*-?\s*x\s*-?\s*4s?\b|\b4\s*-?\s*w\.?\s*d\b|\ba\.?\s*w\.?\s*d\b|\b(?:4|four)[\s-]*wheel|all[\s-]*wheel|\b4\s*por\s*4\b|\b4\s*by\s*4\b|doble\s+tracci|\b4x4s?\b|\b4wd\b/;
    const is2 = /\b4\s*-?\s*x\s*-?\s*2\b|\b2\s*-?\s*w\.?\s*d\b|\br\.?\s*w\.?\s*d\b|\b(?:2|two)[\s-]*wheel|rear[\s-]*wheel|\b4\s*por\s*2\b|\b2\s*x\s*4\b|tracci[oó]n\s+(?:trasera|sencilla|simple)|\b4x2\b|\b2wd\b/;
    const has4 = is4.test(dl), has2 = is2.test(dl);
    if (has4 && !has2) out.drive = '4WD';
    else if (has2 && !has4) out.drive = '2WD';

    const reIn = /(\d+(?:[.,]\d+)?)\s*(?:"|”|''|′′|in\b|inch(?:es)?\b|pulg(?:adas?)?\b|pulgada\b)/gi;
    let mi;
    while ((mi = reIn.exec(raw))) {
      const v = parseFloat(mi[1].replace(',', '.'));
      if (v > 0 && v <= 12) { out.inches = v; break; } // 33", 35" son llantas, no lift
    }

    if (/level/i.test(low)) out.kind = 'leveling';
    else if (/\blift|levant/i.test(low) && out.inches != null) out.kind = 'lift';
    return out;
  }

  // ---------- Reglas de precio ----------
  function liftPrice(base) {
    const x = Math.round((base * 0.665 + 1000) * 100) / 100;
    const h = Math.floor(x / 100) * 100;
    const r = Math.round((x - h) * 100) / 100;
    if (r === 0) return x;
    return r <= 80 ? h + 100 : h + 200;
  }
  function levelPrice(base) {
    if (base <= 70) return 350;
    if (base <= 200) return 450;
    return null; // más de $200: se ignora
  }
  const money = n => '$' + Math.round(n).toLocaleString('en-US');
  const inchStr = n => String(+(+n).toFixed(2));

  function lineFor(k, lang) {
    const i = inchStr(k.inches), p = money(k.sale);
    if (lang === 'es') {
      return k.kind === 'leveling'
        ? `${i}" leveling kit por ${p} instalado`
        : `${i}" lift kit por ${p} instalado y alineado`;
    }
    return k.kind === 'leveling'
      ? `${i}" leveling kit for ${p} installed`
      : `${i}" lift kit for ${p} installed and aligned`;
  }

  // ¿El mensaje del cliente está en español?
  function isSpanish(msg) {
    const w = String(msg || '').toLowerCase().match(/[a-záéíóúñü]+/g) || [];
    const es = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'que', 'para', 'por', 'cuanto', 'cuánto', 'cuesta', 'precio', 'mi', 'tengo', 'quiero', 'una', 'un', 'con', 'como', 'cómo', 'hola', 'buenas', 'buenos', 'camioneta', 'troca', 'levantar', 'pulgadas', 'sale', 'tienen', 'es', 'y', 'año', 'gracias', 'necesito', 'me', 'informacion', 'información', 'cuánto']);
    const en = new Set(['the', 'for', 'how', 'much', 'my', 'is', 'a', 'an', 'what', 'price', 'do', 'you', 'have', 'i', 'need', 'want', 'on', 'lift', 'with', 'and', 'hi', 'hello', 'thanks', 'truck', 'can', 'get', 'would', 'cost', 'quote', 'inch']);
    let a = 0, b = 0;
    w.forEach(x => { if (es.has(x)) a++; if (en.has(x)) b++; });
    return a > b;
  }

  // ---------- Leer títulos de Rough Country ----------
  function analyzeTitle(t) {
    const low = t.toLowerCase();
    const kind = /level/.test(low) ? 'leveling' : (/lift kit/.test(low) ? 'lift' : null);
    let inches = null;
    const fr = t.match(/(?:(\d+)[\s-]+)?(\d+)\s*\/\s*(\d+)\s*(?:inch\b|in\b|"|”)/i);
    const m = t.match(/(?:(\d+(?:\.\d+)?)\s*-\s*)?(\d+(?:\.\d+)?)\s*(?:inch\b|in\b|"|”)/i);
    if (fr && (!m || fr.index <= m.index)) inches = (fr[1] ? +fr[1] : 0) + (+fr[2] / +fr[3]);
    else if (m) inches = parseFloat(m[2]);
    const drives = new Set();
    (t.match(/\b(2WD|4WD|4X4|4X2|RWD|AWD)\b/gi) || []).forEach(d => {
      d = d.toUpperCase();
      drives.add(d === '4X4' || d === 'AWD' ? '4WD' : (d === '4X2' || d === 'RWD' ? '2WD' : d));
    });
    const years = [];
    const re = /\b(\d{4}|\d{2})\s*[-–]\s*(\d{4}|\d{2})\b/g;
    let y;
    while ((y = re.exec(t))) {
      const a = toYear(y[1]), b = toYear(y[2]);
      if (a && b && b >= a && b - a < 40) years.push([a, b]);
    }
    const plus = t.match(/\b(\d{4})\s*\+/);
    if (plus) years.push([+plus[1], 2100]);
    return { kind, inches, drives: drives.size ? drives : null, years };
  }
  function toYear(s) {
    const n = +s;
    if (s.length === 4) return n >= 1950 && n <= 2100 ? n : null;
    return n < 50 ? 2000 + n : 1900 + n;
  }

  // Busca kits en el HTML de una página de Rough Country. doc = Document ya parseado.
  function parseListing(doc) {
    const body = doc.body || doc.documentElement;
    body.querySelectorAll('script,style,noscript,svg,template').forEach(n => n.remove());
    const norm = s => String(s || '').replace(/\s+/g, ' ').trim();

    const texts = [];
    const idx = new Map();
    const SHOW_TEXT = 4;
    const w = doc.createTreeWalker(body, SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const t = norm(n.nodeValue);
      if (!t) continue;
      idx.set(n, texts.length);
      texts.push({ t, node: n });
    }
    const isTitle = t => t.length >= 8 && t.length <= 220 && t.includes('|') && !t.includes('$') && /lift kit|level/i.test(t);
    const pages = new Set();
    body.querySelectorAll('a[href*="/page/"]').forEach(a => {
      const h = a.getAttribute('href');
      if (/\/page\/\d+/.test(h) && !/\/page\/1(\/|$|\?)/.test(h)) {
        try { pages.add(new URL(h, 'https://www.roughcountry.com/').href); } catch (e) { }
      }
    });

    // 1) Tarjetas de producto (como se ven en el celular): el nombre ("3.5 INCH LIFT KIT")
    //    y el vehículo ("Chevy Silverado 1500 2WD/4WD (2019-2024)") van en líneas separadas.
    const isPrice = t => /^\$\s*[\d,]+\.\d{2}$/.test(t);
    const kitWord = /lift kit|level/i;
    const junk = /reviews?\b|rating|out of 5|starting at|configurable|in stock|out of stock|add to cart|compare|^sale$|save \$|free shipping|ships |^\(?\d+\)?$|^new$|^best seller$|^[★☆✩✪\s]+$/i;
    const productHrefs = el => new Set([...el.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => /\.html/i.test(h)).map(h => h.split('#')[0].split('?')[0]));
    // precio = elemento cuyo texto completo es "$559.95" (aunque venga partido en <span>)
    const priceEls = [];
    body.querySelectorAll('*').forEach(el => {
      const t = norm(el.textContent);
      if (!isPrice(t)) return;
      for (const c of el.children) if (norm(c.textContent) === t) return;
      priceEls.push(el);
    });
    const countPrices = el => priceEls.filter(p => el.contains(p)).length;
    const cardEls = [];
    priceEls.forEach(pe => {
      let el = pe.parentElement;
      for (let k = 0; k < 12 && el && el !== body; k++, el = el.parentElement) {
        if (!kitWord.test(el.textContent)) continue;
        if (countPrices(el) <= 3 && productHrefs(el).size <= 1 && !cardEls.includes(el)) cardEls.push(el);
        break;
      }
    });
    const cardItems = [];
    const cardSeen = new Set();
    cardEls.forEach(el => {
      const segs = [];
      let price = null, starting = false, full = null;
      const myPrices = priceEls.filter(p => el.contains(p));
      const inPrice = node => myPrices.some(p => p.contains(node));
      const tw = doc.createTreeWalker(el, SHOW_TEXT); let d;
      while ((d = tw.nextNode())) {
        const t = norm(d.nodeValue);
        if (!t) continue;
        if (/starting at/i.test(t)) starting = true;
        if (inPrice(d)) {
          if (price == null) { const pe = myPrices.find(p => p.contains(d)); price = parseFloat(norm(pe.textContent).replace(/[$,\s]/g, '')); }
          continue;
        }
        if (price != null) continue;
        if (isTitle(t)) full = full || t;
        if (t.length < 2 || t.length > 160 || junk.test(t)) continue;
        if (!segs.some(s => s.toLowerCase() === t.toLowerCase())) segs.push(t);
      }
      const title = full || segs.join(' | ');
      if (price == null || !kitWord.test(title)) return;
      const key = title.toLowerCase() + '|' + price;
      if (cardSeen.has(key)) return;
      cardSeen.add(key);
      const href = [...productHrefs(el)][0] || null;
      let url = null;
      try { url = href ? new URL(href, 'https://www.roughcountry.com/').href : null; } catch (e) { url = null; }
      cardItems.push({ title, price, starting, url });
    });
    if (cardItems.length) return { items: cardItems, pages: Array.from(pages) };

    // 2) Respaldo: elemento más profundo que contiene el título completo con " | "
    const found = [];
    body.querySelectorAll('*').forEach(el => {
      const t = norm(el.textContent);
      if (!isTitle(t)) return;
      for (const c of el.children) if (norm(c.textContent) === t) return;
      found.push({ el, t });
    });
    // quitar contenedores que incluyen otros títulos
    const titles = found.filter(f => !found.some(g => g !== f && f.el.contains(g.el)));

    const items = [];
    const seen = new Set();
    titles.forEach(({ el, t }) => {
      let last = -1, first = -1;
      const tw = doc.createTreeWalker(el, SHOW_TEXT);
      let d;
      while ((d = tw.nextNode())) {
        if (idx.has(d)) { const i = idx.get(d); if (first < 0) first = i; last = i; }
      }
      if (last < 0) return;
      let price = null, starting = false;
      for (let j = last + 1; j < Math.min(texts.length, last + 16); j++) {
        const u = texts[j].t;
        if (isTitle(u)) break;
        if (/starting at|desde/i.test(u)) starting = true;
        const p = u.match(/\$\s*([\d,]+\.\d{2})/);
        if (p) { price = parseFloat(p[1].replace(/,/g, '')); break; }
      }
      if (price == null) return;
      let a = el.closest('a[href]');
      let href = a && /\.html/i.test(a.getAttribute('href')) ? a.getAttribute('href') : null;
      if (!href) {
        for (let j = first; j >= Math.max(0, first - 25) && !href; j--) {
          const pa = texts[j].node.parentElement && texts[j].node.parentElement.closest('a[href]');
          if (pa && /\.html/i.test(pa.getAttribute('href'))) href = pa.getAttribute('href');
        }
      }
      if (!href) {
        let card = el.parentElement;
        for (let k = 0; k < 6 && card && !href; k++, card = card.parentElement) {
          const ca = card.querySelector('a[href$=".html"], a[href*=".html?"]');
          if (ca) href = ca.getAttribute('href');
        }
      }
      const key = t + '|' + price;
      if (seen.has(key)) return;
      seen.add(key);
      let url = null;
      try { url = href ? new URL(href, 'https://www.roughcountry.com/').href : null; } catch (e) { url = null; }
      items.push({ title: t, price, starting, url });
    });
    return { items, pages: Array.from(pages) };
  }

  // Igual que parseListing pero sobre texto plano/markdown (lo que devuelve el lector en modo texto).
  function parseText(text) {
    const lines = String(text || '').split(/\n+/).map(l => l.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const isTitle = t => t.length >= 8 && t.length <= 260 && t.includes('|') && !/\$\s*\d/.test(t) && /lift kit|level/i.test(t);
    const items = [], seen = new Set();
    for (let i = 0; i < lines.length; i++) {
      let t = lines[i], url = null;
      const md = t.match(/^\W*\[([^\]]+)\]\((https?:[^)\s]+)/);
      if (md) { t = md[1].trim(); url = md[2]; }
      t = t.replace(/^[#>*\-\s]+/, '').replace(/[*_`]/g, '').trim();
      if (!isTitle(t)) continue;
      let price = null, starting = false;
      for (let j = i + 1; j < Math.min(lines.length, i + 14); j++) {
        const u = lines[j].replace(/[*_`]/g, '');
        const um = u.match(/^\W*\[([^\]]+)\]/);
        if (isTitle(um ? um[1] : u)) break;
        if (/starting at/i.test(u)) starting = true;
        const p = u.match(/\$\s*([\d,]+\.\d{2})/);
        if (p) { price = parseFloat(p[1].replace(/,/g, '')); break; }
      }
      if (price == null) continue;
      const key = t + '|' + price;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ title: t, price, starting, url: url && /roughcountry\.com/.test(url) ? url : null });
    }
    return items;
  }

  // ---------- Armar la cotización ----------
  // items: [{title, price, url, starting}] ; q: {model, year, drive, inches, kind}
  function buildQuote(items, q) {
    const fits = [], others = [];
    items.forEach(it => {
      const a = analyzeTitle(it.title);
      const k = Object.assign({}, it, a);
      if (!a.kind || a.inches == null) return; // no es lift ni leveling, o sin pulgadas
      const modelOk = q.model && q.model.match.test(it.title) && !(q.model.not && q.model.not.test(it.title));
      const yearOk = !q.year || !a.years.length || a.years.some(([x, y]) => q.year >= x && q.year <= y);
      if (!modelOk || !yearOk) { others.push(k); return; }
      fits.push(k);
    });

    const drives = q.drive ? [q.drive] : ['4WD', '2WD'];
    const blocks = drives.map(drive => {
      const pool = fits.filter(k => !k.drives || k.drives.has(drive));
      const best = new Map();
      pool.forEach(k => {
        const extra = +k.extra || 0;
        const base = k.price + extra;
        const sale = k.kind === 'leveling' ? levelPrice(base) : liftPrice(base);
        if (sale == null) return;
        const key = k.kind + ':' + k.inches;
        const cur = best.get(key);
        // el más barato se elige por el precio base de Rough Country; los amortiguadores se suman después
        if (!cur || k.price < cur.price) best.set(key, Object.assign({}, k, { base, sale }));
      });
      let list = Array.from(best.values());
      const sizes = list.slice();
      if (q.kind) list = list.filter(k => k.kind === q.kind);
      let nearest = null;
      if (q.inches != null) {
        const exact = list.filter(k => Math.abs(k.inches - q.inches) < 0.01);
        if (exact.length || !list.length) list = exact;
        else {
          // no existe esa medida: la más cercana por debajo y por encima
          const below = list.filter(k => k.inches < q.inches).map(k => k.inches);
          const above = list.filter(k => k.inches > q.inches).map(k => k.inches);
          const lo = below.length ? Math.max(...below) : null;
          const hi = above.length ? Math.min(...above) : null;
          list = list.filter(k => k.inches === lo || k.inches === hi);
          nearest = { asked: q.inches, lower: lo, higher: hi };
        }
      }
      list.sort((a, b) => (a.kind === b.kind ? a.inches - b.inches : (a.kind === 'leveling' ? -1 : 1)));
      return { drive, kits: list, sizes, nearest, text: list.map(k => lineFor(k, q.lang)).join('\n\n') };
    });
    return { blocks, others, fitsCount: fits.length };
  }

  const api = { MAKES, MODELS, makeLabel, resolveModel, localParse, liftPrice, levelPrice, money, inchStr, lineFor, isSpanish, analyzeTitle, parseListing, parseText, buildQuote, slugify, squash };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Core = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
