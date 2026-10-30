/**
 * Cheap on Tires · Price List
 * Lift & leveling kit database filled by the Rough Country panel (Firefox).
 *
 * Instalación (una vez):
 *  1. En la Google Sheet: Extensiones → Apps Script, pega este código y guarda.
 *  2. Ejecuta la función  crearBaseDeDatos  (borra la hoja y arma las pestañas).
 *  3. Implementar → Nueva implementación → Aplicación web → Ejecutar como: Yo,
 *     Acceso: Cualquier usuario → copia el enlace que termina en /exec
 *     y pégalo en Ajustes del cotizador.
 */

const T = {
  titulo: 'CHEAP ON TIRES · PRICE LIST',
  sub: 'Rough Country lift & leveling kits · installed price',
  ink: '#1c2430',      // encabezados
  ink2: '#2d3a4b',
  accent: '#e8590c',   // naranja
  accentSoft: '#fff1e8',
  levelSoft: '#e7f1fb',
  band1: '#ffffff',
  band2: '#f6f7f9',
  line: '#d9dde3',
  muted: '#6b7685',
  font: 'Roboto'
};

// ID de tu Google Sheet (lo que va entre /d/ y /edit en su enlace)
const SHEET_ID = '1KfC2RsAekVtyfL9du3neXsj22CDS-iDbwFEnNChfrk0';
function libro() { return SpreadsheetApp.getActive() || SpreadsheetApp.openById(SHEET_ID); }

const CAT = 'Catalog', BUS = 'Search', HIS = 'History', LIS = 'Lists';
const HEAD = ['Make', 'Model', 'Drive', 'Year from', 'Year to', 'Type', 'Lift',
  'Installed price', 'RC base price', '"Starting at"', 'Rough Country kit', 'Link', 'Updated', 'Install time', 'Dually', 'Fitment notes', 'Key'];
const ROW0 = 4; // primera fila de datos en Catálogo
const COLS = HEAD.length;

// ---------------------------------------------------------------- crear
function crearBaseDeDatos() {
  const ss = libro();
  ss.setSpreadsheetTimeZone(Session.getScriptTimeZone());
  ss.rename('Cheap on Tires · Price List');

  // borrar todo
  const tmp = ss.insertSheet('_tmp' + Date.now());
  ss.getSheets().forEach(s => { if (s.getSheetId() !== tmp.getSheetId()) { try { s.getRange(1, 1, s.getMaxRows(), s.getMaxColumns()).clearDataValidations(); } catch (e) { } } });
  SpreadsheetApp.flush();
  ss.getSheets().forEach(s => { if (s.getSheetId() !== tmp.getSheetId()) ss.deleteSheet(s); });
  SpreadsheetApp.flush();

  const cat = ss.insertSheet(CAT);
  const bus = ss.insertSheet(BUS);
  const his = ss.insertSheet(HIS);
  const lis = ss.insertSheet(LIS);
  ss.deleteSheet(tmp);

  const paso = f => { SpreadsheetApp.flush(); Utilities.sleep(800); for (let i = 0; i < 3; i++) { try { return f(); } catch (e) { if (i === 2) throw e; Utilities.sleep(2500); } } };
  paso(() => armarCatalogo(cat));
  paso(() => armarHistorial(his));
  paso(() => armarListas(lis));
  paso(() => armarBuscar(bus));
  paso(() => estiloCatalogo(cat));
  SpreadsheetApp.flush();
  lis.hideSheet();
  ss.setActiveSheet(bus); ss.moveActiveSheet(1);
  ss.setActiveSheet(cat); ss.moveActiveSheet(2);
  ss.setActiveSheet(bus);
}

function banda(sh, row, cols, title, sub) {
  sh.getRange(1, 1, 2, cols).setBackground(T.ink).setFontColor('#ffffff').setFontFamily(T.font);
  sh.getRange(1, 1, 1, cols).merge().setValue(title).setFontSize(16).setFontWeight('bold')
    .setVerticalAlignment('middle').setHorizontalAlignment('left');
  sh.getRange(2, 1, 1, cols).merge().setValue(sub).setFontSize(10).setFontColor('#c5ccd6')
    .setVerticalAlignment('top');
  sh.setRowHeight(1, 40); sh.setRowHeight(2, 24);
  sh.getRange(3, 1, 1, cols).setBackground(T.accent).setFontColor('#ffffff').setFontWeight('bold')
    .setFontFamily(T.font).setFontSize(10).setVerticalAlignment('middle').setHorizontalAlignment('center');
  sh.setRowHeight(3, 30);
}

function armarCatalogo(sh) {
  try { sh.setHiddenGridlines(true); } catch (e) { }
  banda(sh, 1, COLS, T.titulo, T.sub);
  sh.getRange(3, 1, 1, COLS).setValues([HEAD]);
  sh.setFrozenRows(3);
  const widths = [110, 150, 100, 82, 82, 86, 78, 120, 115, 86, 380, 70, 130, 120, 150, 420, 10];
  widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.hideColumns(COLS);
  formatoDatos(sh, ROW0, 300);
  sh.getRange(ROW0, 1, 300, COLS).setFontFamily(T.font).setFontSize(10).setVerticalAlignment('middle');
}

function formatoDatos(sh, r, n) {
  sh.getRange(r, 4, n, 2).setNumberFormat('0').setHorizontalAlignment('center');
  sh.getRange(r, 1, n, 2).setNumberFormat('@');
  sh.getRange(r, 3, n, 1).setHorizontalAlignment('center');
  sh.getRange(r, 6, n, 1).setHorizontalAlignment('center').setFontWeight('bold');
  sh.getRange(r, 7, n, 1).setNumberFormat('0.##"″"').setHorizontalAlignment('center');
  sh.getRange(r, 8, n, 1).setNumberFormat('$#,##0').setFontWeight('bold').setHorizontalAlignment('right');
  sh.getRange(r, 9, n, 1).setNumberFormat('$#,##0.00').setFontColor(T.muted).setHorizontalAlignment('right');
  sh.getRange(r, 10, n, 1).setHorizontalAlignment('center').setFontColor(T.muted);
  sh.getRange(r, 11, n, 1).setWrap(false);
  sh.getRange(r, 12, n, 1).setHorizontalAlignment('center');
  sh.getRange(r, 14, n, 2).setHorizontalAlignment('center').setFontWeight('bold');
  sh.getRange(r, 16, n, 1).setWrap(false).setFontSize(9);
  sh.getRange(r, 13, n, 1).setNumberFormat('mm/dd/yyyy').setFontColor(T.muted).setHorizontalAlignment('center');
}

// ---------------------------------------------------------------- colores por marca y modelo
// Cada marca tiene su color; cada modelo es una variación (más claro / menos intenso) de ese color.
const MAKE_COLORS = {
  'Ram': [0, 62], 'Dodge': [22, 70], 'Honda': [44, 75], 'Rivian': [66, 55], 'Jeep': [95, 42],
  'Toyota': [128, 42], 'Suzuki': [158, 42], 'Ford': [184, 52], 'Chevy': [212, 66], 'Subaru': [238, 50],
  'GMC': [262, 46], 'Cadillac': [288, 40], 'Nissan': [318, 50], 'Mitsubishi': [340, 60],
  'Mercedes-Benz': [210, 14], 'Tesla': [0, 0]
};
function makeHS(make) {
  if (MAKE_COLORS[make]) return MAKE_COLORS[make];
  let x = 0; for (const ch of String(make)) x = (x * 31 + ch.charCodeAt(0)) % 360;
  return [x, 45];
}
function hsl(hh, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + hh / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}
// variaciones de modelo: [luminosidad, factor de saturación]
const MODEL_STEPS = [[86, 1], [91, 0.85], [83, 0.55], [89, 0.6], [93, 1], [85, 0.35], [90, 0.45]];

function estiloCatalogo(sh) {
  const last = Math.max(sh.getLastRow(), ROW0);
  const n = last - ROW0 + 1;
  sh.getBandings().forEach(b => b.remove());
  const vals = sh.getRange(ROW0, 1, n, 2).getValues();
  const models = {};
  vals.forEach(([mk, md]) => { if (!mk) return; (models[mk] = models[mk] || []); if (!models[mk].includes(String(md))) models[mk].push(String(md)); });
  Object.keys(models).forEach(mk => models[mk].sort());
  const bgs = [], fonts = [];
  vals.forEach(([mk, md]) => {
    if (!mk) { bgs.push(new Array(COLS - 1).fill('#ffffff')); fonts.push(new Array(COLS - 1).fill(T.ink)); return; }
    const [hh, s] = makeHS(mk);
    const i = models[mk].indexOf(String(md));
    const [l, sf] = MODEL_STEPS[i % MODEL_STEPS.length];
    const row = hsl(hh, Math.round(s * sf), l);
    const head = hsl(hh, s, 74); // la columna Make lleva el color de la marca más intenso
    const r = new Array(COLS - 1).fill(row); r[0] = head;
    bgs.push(r);
    const f = new Array(COLS - 1).fill(T.ink); f[8] = '#4a5462'; f[9] = '#4a5462'; f[12] = '#4a5462';
    fonts.push(f);
  });
  const body = sh.getRange(ROW0, 1, n, COLS - 1);
  body.setBackgrounds(bgs).setFontColors(fonts);
  sh.getRange(ROW0, 1, n, 1).setFontWeight('bold');
  body.setBorder(null, null, true, null, null, true, '#ffffff', SpreadsheetApp.BorderStyle.SOLID);
  // Tipo: se distingue igual en cualquier color de fila
  const tipo = sh.getRange(ROW0, 6, Math.max(n, 1), 1);
  const dcol = sh.getRange(ROW0, COLS - 2, Math.max(n, 1), 1);
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith('DUALLY').setBackground('#ffd43b').setFontColor('#1c2430').setBold(true).setRanges([dcol]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Lift').setBackground(T.ink).setFontColor('#ffffff').setBold(true).setRanges([tipo]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Leveling').setBackground('#ffffff').setFontColor(T.ink).setBold(true).setRanges([tipo]).build()
  ]);
  if (sh.getFilter()) sh.getFilter().remove();
  sh.getRange(3, 1, n + 1, COLS - 1).createFilter();
  sh.getRange(2, 1).setValue(T.sub + '  ·  ' + (vals.filter(v => v[0]).length) + ' kits  ·  updated ' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MM/dd/yyyy h:mm a'));
}

function armarHistorial(sh) {
  try { sh.setHiddenGridlines(true); } catch (e) { }
  banda(sh, 1, 4, 'QUOTE HISTORY', 'Every quote copied from the Rough Country panel');
  sh.getRange(3, 1, 1, 4).setValues([['Date', 'Vehicle', 'Customer message', 'Quote sent']]);
  sh.setFrozenRows(3);
  [140, 200, 360, 420].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.getRange(4, 1, 300, 4).setFontFamily(T.font).setFontSize(10).setVerticalAlignment('top').setWrap(true);
  sh.getRange(4, 1, 300, 1).setNumberFormat('mm/dd/yyyy h:mm am/pm');
}

function armarListas(sh) {
  sh.getRange('A1').setFormula(`=IFERROR(SORT(UNIQUE(FILTER('${CAT}'!A${ROW0}:A,'${CAT}'!A${ROW0}:A<>""))),"")`);
  sh.getRange('B1').setFormula(`=IFERROR(SORT(UNIQUE(FILTER('${CAT}'!B${ROW0}:B,'${CAT}'!A${ROW0}:A='${BUS}'!C5))),"")`);
  sh.getRange('C1:C3').setValues([['All'], ['4x4'], ['4x2']]);
}

function armarBuscar(sh, soloResultados) {
  if (!soloResultados) {
    try { sh.setHiddenGridlines(true); } catch (e) { }
    const W = 8;
    [24, 120, 170, 120, 130, 420, 90, 170].forEach((w, i) => sh.setColumnWidth(i + 1, w));
    banda(sh, 1, W, T.titulo, 'Pick a vehicle to see its kits and prices');
    sh.getRange(3, 1, 1, W).setBackground('#ffffff');
    sh.setRowHeight(3, 12);

    const lab = [['Make'], ['Model'], ['Year'], ['Drive']];
    sh.getRange('B5:B8').setValues(lab).setFontWeight('bold').setFontColor(T.ink2).setFontFamily(T.font).setHorizontalAlignment('right');
    const inp = sh.getRange('C5:C8');
    inp.setBackground(T.accentSoft).setFontWeight('bold').setFontSize(12).setFontFamily(T.font)
      .setBorder(true, true, true, true, true, true, T.accent, SpreadsheetApp.BorderStyle.SOLID);
    sh.getRange('C8').setValue('All');
    const lis = libro().getSheetByName(LIS);
    sh.getRange('C5').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(lis.getRange('A1:A500'), true).setAllowInvalid(false).build());
    sh.getRange('C6').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(lis.getRange('B1:B500'), true).setAllowInvalid(true).build());
    sh.getRange('C5:C6').setNumberFormat('@');
    sh.getRange('C7').setNumberFormat('0').setDataValidation(SpreadsheetApp.newDataValidation().requireNumberBetween(1950, 2100).setAllowInvalid(false).build());
    sh.getRange('C8').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(lis.getRange('C1:C3'), true).build());
    sh.getRange('D5:F8').setFontColor(T.muted).setFontSize(9).setFontFamily(T.font);
    sh.getRange('D5').setValue('Tap an orange cell and pick from the list');
    sh.getRange('D7').setValue('Finds every kit whose year range includes this year');
  }
  sh.setColumnWidth(8, 170); sh.setColumnWidth(9, 420);
  sh.getRange('I11:I200').setFontSize(9).setFontColor('#c92a2a');
  sh.getRange(1, 8, 2, 2).setBackground(T.ink);
  sh.getRange(10, 2, 1, 8).setValues([['Type', 'Lift', 'Installed price', 'RC base price', 'Rough Country kit', 'Years', 'Dually', 'Fitment notes']])
    .setBackground(T.ink).setFontColor('#ffffff').setFontWeight('bold').setFontFamily(T.font).setHorizontalAlignment('center');
  sh.setRowHeight(10, 28);
  const c = `'${CAT}'!`, R = (col) => `${c}${col}${ROW0}:${col}`;
  const cond =
    `${R('A')}=C5,${R('B')}=C6,` +
    `((${R('D')}="")+(${R('D')}<=C7))*((${R('E')}="")+(${R('E')}>=C7))>0,` +
    `(C8="All")+(${R('C')}=C8)+(${R('C')}="4x2 / 4x4")+(${R('C')}="All")>0`;
  sh.getRange('B11').setFormula(
    `=IF(OR(C5="",C6="",C7=""),"Pick make, model and year above",` +
    `IFERROR(SORT(FILTER({${R('F')},${R('G')},${R('H')},${R('I')},${R('K')},${R('D')}&"–"&${R('E')},${R('O')},${R('P')}},${cond}),1,TRUE,2,TRUE,4,TRUE),"No saved kits for that vehicle and year yet"))`);
  sh.getRange('B11:H200').setFontFamily(T.font).setFontSize(10).setVerticalAlignment('middle');
  sh.getRange('B11:C200').setHorizontalAlignment('center');
  sh.getRange('C11:C200').setNumberFormat('0.##"″"');
  sh.getRange('D11:D200').setNumberFormat('$#,##0').setFontWeight('bold').setFontColor(T.accent).setHorizontalAlignment('right');
  sh.getRange('E11:E200').setNumberFormat('$#,##0.00').setFontColor(T.muted).setHorizontalAlignment('right');
  sh.getRange('G11:G200').setHorizontalAlignment('center').setFontColor(T.muted);
  sh.getRange('H11:H200').setHorizontalAlignment('center').setFontWeight('bold');
  sh.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith('DUALLY').setBackground('#ffd43b').setFontColor('#1c2430').setBold(true).setRanges([sh.getRange('H11:H200')]).build()]);
  sh.getBandings().forEach(x => x.remove());
  const res = sh.getRange('B11:I200');
  res.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false).setFirstRowColor(T.band1).setSecondRowColor(T.band2);
  sh.setFrozenRows(10);
}

// ---------------------------------------------------------------- recibir datos
function doGet(e) {
  if (e && e.parameter && e.parameter.urls) return json({ ok: true, urls: listaUrls() });
  return json({ ok: true, msg: 'Database online' });
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      let n = 0;
      if (d.kits && d.kits.length) n = guardarKits(d.kits);
      if (d.copy) guardarHistorial(d.copy);
      if (d.detalles) n = guardarDetalles(d.detalles, d.fin);
      return json({ ok: true, saved: n });
    } finally { lock.releaseLock(); }
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

function guardarKits(kits) {
  const ss = libro();
  const sh = ss.getSheetByName(CAT);
  if (!sh) throw new Error('Missing Catalog tab: run crearBaseDeDatos');
  asegurarColumnas(sh);
  const last = sh.getLastRow();
  const keys = last >= ROW0 ? sh.getRange(ROW0, COLS - 3, last - ROW0 + 1, 4).getValues() : [];
  const pos = {}, prevTime = {}, prevDw = {}, prevNotes = {};
  keys.forEach(([t, dw, nt, k], i) => { if (k) { pos[k] = ROW0 + i; prevTime[k] = t; prevDw[k] = String(dw); prevNotes[k] = nt; } });
  const now = new Date();
  const nuevos = [];
  let n = 0;
  kits = kits.filter(k => k.instalado != null && k.instalado !== '');
  kits.forEach(k => {
    const row = [k.marca || '', k.modelo || '', (k.traccion === 'Todas' ? 'All' : (k.traccion || 'All')), k.desde || '', k.hasta || '',
      k.tipo === 'leveling' ? 'Leveling' : 'Lift', +k.pulgadas || '',
      +k.instalado, +k.base || '', k.starting ? 'Yes' : '',
      k.titulo || '', k.url ? '=HYPERLINK("' + String(k.url).replace(/"/g, '') + '","View")' : '', now,
      k.instala || prevTime[k.clave] || '',
      /^NO dually/.test(prevDw[k.clave] || '') ? prevDw[k.clave] : (k.dually || /^DUALLY/.test(prevDw[k.clave] || '') ? 'DUALLY  +$200 → $' + (+k.instalado + 200).toLocaleString('en-US') : ''),
      k.notas || prevNotes[k.clave] || '', k.clave];
    if (!k.clave) return;
    if (pos[k.clave]) sh.getRange(pos[k.clave], 1, 1, COLS).setValues([row]);
    else { nuevos.push(row); pos[k.clave] = -1; }
    n++;
  });
  if (nuevos.length) {
    const start = Math.max(sh.getLastRow() + 1, ROW0);
    sh.getRange(start, 1, nuevos.length, 2).setNumberFormat('@');
    sh.getRange(start, 1, nuevos.length, COLS).setValues(nuevos);
    formatoDatos(sh, start, nuevos.length);
    sh.getRange(start, 1, nuevos.length, COLS).setFontFamily(T.font).setFontSize(10).setVerticalAlignment('middle');
  }
  // quitar filas sin precio instalado (antes salían como "Not offered")
  if (sh.getLastRow() >= ROW0) {
    const hv = sh.getRange(ROW0, 8, sh.getLastRow() - ROW0 + 1, 1).getValues();
    for (let i = hv.length - 1; i >= 0; i--) if (hv[i][0] === 'Not offered' || hv[i][0] === 'No se ofrece') sh.deleteRow(ROW0 + i);
  }
  const total = sh.getLastRow() - ROW0 + 1;
  if (total > 1) {
    if (sh.getFilter()) sh.getFilter().remove();
    sh.getRange(ROW0, 1, total, COLS).sort([{ column: 1 }, { column: 2 }, { column: 4 }, { column: 6 }, { column: 7 }, { column: 9 }]);
  }
  estiloCatalogo(sh);
  return n;
}

// Hojas creadas antes de la columna "Install time": la agrega antes de la clave sin perder datos
function asegurarColumnas(sh) {
  let changed = false;
  ['Install time', 'Dually', 'Fitment notes'].forEach(name => {
    const head = sh.getRange(3, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    if (head.indexOf(name) >= 0) return;
    const keyCol = head.indexOf('Key') + 1;
    if (keyCol < 1) return;
    if (sh.getFilter()) sh.getFilter().remove();
    sh.insertColumnBefore(keyCol);
    sh.getRange(3, keyCol).setValue(name);
    sh.setColumnWidth(keyCol, name === 'Dually' ? 150 : name === 'Fitment notes' ? 420 : 120);
    sh.showColumns(keyCol);
    sh.hideColumns(keyCol + 1);
    changed = true;
  });
  if (changed) { SpreadsheetApp.flush(); armarBuscar(libro().getSheetByName(BUS), true); }
}

// Tiempo de instalación, Fitment notes y dually leídos de la página de cada kit (por URL)
function guardarDetalles(det, fin) {
  const sh = libro().getSheetByName(CAT);
  asegurarColumnas(sh);
  const last = sh.getLastRow(); if (last < ROW0) return 0;
  const n = last - ROW0 + 1;
  const links = sh.getRange(ROW0, 12, n, 1).getFormulas().map(r => (String(r[0]).match(/HYPERLINK\("([^"]+)"/) || [])[1] || '');
  const inst = sh.getRange(ROW0, 8, n, 1).getValues();
  const cur = sh.getRange(ROW0, 14, n, 3).getValues();
  const byUrl = {}; det.forEach(x => { if (x && x.url) byUrl[x.url.split('?')[0]] = x; });
  let c = 0;
  links.forEach((u, i) => {
    const x = byUrl[u.split('?')[0]]; if (!x) return;
    if (x.instala) cur[i][0] = x.instala;
    if (x.dually === 'no') cur[i][1] = 'NO dually';
    else if (x.dually === 'yes' || /^DUALLY/.test(String(cur[i][1]))) cur[i][1] = 'DUALLY  +$200 → $' + (+inst[i][0] + 200).toLocaleString('en-US');
    if (x.notas != null) cur[i][2] = x.notas;
    c++;
  });
  sh.getRange(ROW0, 14, n, 3).setValues(cur);
  if (fin) estiloCatalogo(sh);
  return c;
}

// URLs de todos los kits del Catalog (para leer sus detalles)
function listaUrls() {
  const sh = libro().getSheetByName(CAT);
  const last = sh.getLastRow(); if (last < ROW0) return [];
  const f = sh.getRange(ROW0, 12, last - ROW0 + 1, 1).getFormulas();
  const t = sh.getRange(ROW0, 14, last - ROW0 + 1, 3).getValues();
  const out = {};
  f.forEach((r, i) => { const u = (String(r[0]).match(/HYPERLINK\("([^"]+)"/) || [])[1]; if (u) out[u] = out[u] || !!(t[i][0] || t[i][2]); });
  return Object.keys(out).map(u => ({ u, done: out[u] }));
}

function guardarHistorial(c) {
  const sh = libro().getSheetByName(HIS);
  if (!sh) return;
  sh.insertRowAfter(3);
  sh.getRange(4, 1, 1, 4).setValues([[new Date(), c.vehiculo || '', c.mensaje || '', c.texto || '']])
    .setBackground('#ffffff').setFontColor(T.ink).setFontWeight('normal').setFontFamily(T.font).setFontSize(10).setWrap(true).setVerticalAlignment('top');
  sh.getRange(4, 1).setNumberFormat('mm/dd/yyyy h:mm am/pm');
  sh.getRange(4, 1, 1, 4).setBorder(null, null, true, null, null, null, T.line, SpreadsheetApp.BorderStyle.SOLID);
}

function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// Prueba manual: agrega un kit de ejemplo (bórralo después si quieres)
function probarGuardado() {
  guardarKits([{ clave: 'prueba', marca: 'Ram', modelo: '1500', traccion: '4x4', desde: 2019, hasta: 2024, tipo: 'lift', pulgadas: 6, instalado: 2100, base: 1499.95, starting: true, titulo: '6 Inch Lift Kit | Ram 1500 4WD (2019-2024)', url: 'https://www.roughcountry.com/' }]);
}
