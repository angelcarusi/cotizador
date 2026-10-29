/**
 * Cheap on Tires · Lista de precios
 * Base de datos de lift y leveling kits que llena el panel de Rough Country (Firefox).
 *
 * Instalación (una vez):
 *  1. En la Google Sheet: Extensiones → Apps Script, pega este código y guarda.
 *  2. Ejecuta la función  crearBaseDeDatos  (borra la hoja y arma las pestañas).
 *  3. Implementar → Nueva implementación → Aplicación web → Ejecutar como: Yo,
 *     Acceso: Cualquier usuario → copia el enlace que termina en /exec
 *     y pégalo en Ajustes del cotizador.
 */

const T = {
  titulo: 'CHEAP ON TIRES · LISTA DE PRECIOS',
  sub: 'Lift y leveling kits Rough Country · precio instalado',
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

const CAT = 'Catálogo', BUS = 'Buscar', HIS = 'Historial', LIS = 'Listas';
const HEAD = ['Marca', 'Modelo', 'Tracción', 'Año desde', 'Año hasta', 'Tipo', 'Pulgadas',
  'Precio instalado', 'Precio base RC', 'Precio "desde"', 'Kit en Rough Country', 'Enlace', 'Actualizado', 'Clave'];
const ROW0 = 4; // primera fila de datos en Catálogo
const COLS = HEAD.length;

// ---------------------------------------------------------------- crear
function crearBaseDeDatos() {
  const ss = libro();
  ss.setSpreadsheetTimeZone(Session.getScriptTimeZone());
  ss.rename('Cheap on Tires · Lista de precios');

  // borrar todo
  const tmp = ss.insertSheet('_tmp' + Date.now());
  ss.getSheets().forEach(s => { if (s.getSheetId() !== tmp.getSheetId()) ss.deleteSheet(s); });

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
  const widths = [110, 150, 100, 82, 82, 86, 78, 120, 115, 86, 380, 70, 130, 10];
  widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.hideColumns(COLS);
  formatoDatos(sh, ROW0, 300);
  sh.getRange(ROW0, 1, 300, COLS).setFontFamily(T.font).setFontSize(10).setVerticalAlignment('middle');
}

function formatoDatos(sh, r, n) {
  sh.getRange(r, 4, n, 2).setNumberFormat('0').setHorizontalAlignment('center');
  sh.getRange(r, 3, n, 1).setHorizontalAlignment('center');
  sh.getRange(r, 6, n, 1).setHorizontalAlignment('center').setFontWeight('bold');
  sh.getRange(r, 7, n, 1).setNumberFormat('0.##"\\""').setHorizontalAlignment('center');
  sh.getRange(r, 8, n, 1).setNumberFormat('$#,##0').setFontWeight('bold').setHorizontalAlignment('right');
  sh.getRange(r, 9, n, 1).setNumberFormat('$#,##0.00').setFontColor(T.muted).setHorizontalAlignment('right');
  sh.getRange(r, 10, n, 1).setHorizontalAlignment('center').setFontColor(T.muted);
  sh.getRange(r, 11, n, 1).setWrap(false);
  sh.getRange(r, 12, n, 1).setHorizontalAlignment('center');
  sh.getRange(r, 13, n, 1).setNumberFormat('dd/mm/yyyy').setFontColor(T.muted).setHorizontalAlignment('center');
}

function estiloCatalogo(sh) {
  const last = Math.max(sh.getLastRow(), ROW0);
  const n = last - ROW0 + 1;
  sh.getBandings().forEach(b => b.remove());
  const rng = sh.getRange(3, 1, n + 1, COLS - 1);
  const b = rng.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
  b.setHeaderRowColor(T.accent).setFirstRowColor(T.band1).setSecondRowColor(T.band2);
  sh.getRange(ROW0, 1, n, COLS - 1).setBorder(null, null, true, null, null, true, T.line, SpreadsheetApp.BorderStyle.SOLID);
  // Tipo con color
  const tipo = sh.getRange(ROW0, 6, Math.max(n, 1), 1);
  const rules = [
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Lift').setBackground(T.accentSoft).setFontColor(T.accent).setRanges([tipo]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Leveling').setBackground(T.levelSoft).setFontColor('#1c64b0').setRanges([tipo]).build()
  ];
  sh.setConditionalFormatRules(rules);
  if (sh.getFilter()) sh.getFilter().remove();
  sh.getRange(3, 1, n + 1, COLS - 1).createFilter();
  sh.getRange(2, 1).setValue(T.sub + '  ·  ' + n + ' kits  ·  actualizado ' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'));
}

function armarHistorial(sh) {
  try { sh.setHiddenGridlines(true); } catch (e) { }
  banda(sh, 1, 4, 'HISTORIAL DE COTIZACIONES', 'Cada vez que copias una cotización en el panel');
  sh.getRange(3, 1, 1, 4).setValues([['Fecha', 'Vehículo', 'Mensaje del cliente', 'Cotización enviada']]);
  sh.setFrozenRows(3);
  [140, 200, 360, 420].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.getRange(4, 1, 300, 4).setFontFamily(T.font).setFontSize(10).setVerticalAlignment('top').setWrap(true);
  sh.getRange(4, 1, 300, 1).setNumberFormat('dd/mm/yyyy HH:mm');
}

function armarListas(sh) {
  sh.getRange('A1').setFormula(`=IFERROR(SORT(UNIQUE(FILTER('${CAT}'!A${ROW0}:A,'${CAT}'!A${ROW0}:A<>""))),"")`);
  sh.getRange('B1').setFormula(`=IFERROR(SORT(UNIQUE(FILTER('${CAT}'!B${ROW0}:B,'${CAT}'!A${ROW0}:A='${BUS}'!C5))),"")`);
  sh.getRange('C1:C3').setValues([['Todas'], ['4x4'], ['4x2']]);
}

function armarBuscar(sh) {
  try { sh.setHiddenGridlines(true); } catch (e) { }
  const W = 7;
  [24, 120, 170, 120, 130, 420, 90].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  banda(sh, 1, W, T.titulo, 'Elige el vehículo y te muestro los kits y precios');
  sh.getRange(3, 1, 1, W).setBackground('#ffffff');
  sh.setRowHeight(3, 12);

  const lab = [['Marca'], ['Modelo'], ['Año'], ['Tracción']];
  sh.getRange('B5:B8').setValues(lab).setFontWeight('bold').setFontColor(T.ink2).setFontFamily(T.font).setHorizontalAlignment('right');
  const inp = sh.getRange('C5:C8');
  inp.setBackground(T.accentSoft).setFontWeight('bold').setFontSize(12).setFontFamily(T.font)
    .setBorder(true, true, true, true, true, true, T.accent, SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange('C8').setValue('Todas');
  const lis = libro().getSheetByName(LIS);
  sh.getRange('C5').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(lis.getRange('A1:A500'), true).setAllowInvalid(false).build());
  sh.getRange('C6').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(lis.getRange('B1:B500'), true).setAllowInvalid(true).build());
  sh.getRange('C7').setNumberFormat('0').setDataValidation(SpreadsheetApp.newDataValidation().requireNumberBetween(1950, 2100).setAllowInvalid(false).build());
  sh.getRange('C8').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(lis.getRange('C1:C3'), true).build());
  sh.getRange('D5:F8').setFontColor(T.muted).setFontSize(9).setFontFamily(T.font);
  sh.getRange('D5').setValue('Toca la celda naranja y elige de la lista');
  sh.getRange('D7').setValue('Encuentra los kits cuyo rango de años incluye este año');

  sh.getRange(10, 2, 1, 6).setValues([['Tipo', 'Pulgadas', 'Precio instalado', 'Precio base RC', 'Kit en Rough Country', 'Años']])
    .setBackground(T.ink).setFontColor('#ffffff').setFontWeight('bold').setFontFamily(T.font).setHorizontalAlignment('center');
  sh.setRowHeight(10, 28);
  const c = `'${CAT}'!`, R = (col) => `${c}${col}${ROW0}:${col}`;
  const cond =
    `${R('A')}=C5,${R('B')}=C6,` +
    `((${R('D')}="")+(${R('D')}<=C7))*((${R('E')}="")+(${R('E')}>=C7))>0,` +
    `(C8="Todas")+(${R('C')}=C8)+(${R('C')}="4x2 / 4x4")+(${R('C')}="Todas")>0`;
  sh.getRange('B11').setFormula(
    `=IF(OR(C5="",C6="",C7=""),"Elige marca, modelo y año arriba",` +
    `IFERROR(SORT(FILTER({${R('F')},${R('G')},${R('H')},${R('I')},${R('K')},${R('D')}&"–"&${R('E')}},${cond}),1,TRUE,2,TRUE,4,TRUE),"No hay kits guardados para ese vehículo y año"))`);
  sh.getRange('B11:G200').setFontFamily(T.font).setFontSize(10).setVerticalAlignment('middle');
  sh.getRange('B11:C200').setHorizontalAlignment('center');
  sh.getRange('C11:C200').setNumberFormat('0.##"\\""');
  sh.getRange('D11:D200').setNumberFormat('$#,##0').setFontWeight('bold').setFontColor(T.accent).setHorizontalAlignment('right');
  sh.getRange('E11:E200').setNumberFormat('$#,##0.00').setFontColor(T.muted).setHorizontalAlignment('right');
  sh.getRange('G11:G200').setHorizontalAlignment('center').setFontColor(T.muted);
  const res = sh.getRange('B11:G200');
  res.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false).setFirstRowColor(T.band1).setSecondRowColor(T.band2);
  sh.setFrozenRows(10);
}

// ---------------------------------------------------------------- recibir datos
function doGet(e) { return json({ ok: true, msg: 'Base de datos activa' }); }

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      let n = 0;
      if (d.kits && d.kits.length) n = guardarKits(d.kits);
      if (d.copy) guardarHistorial(d.copy);
      return json({ ok: true, saved: n });
    } finally { lock.releaseLock(); }
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

function guardarKits(kits) {
  const ss = libro();
  const sh = ss.getSheetByName(CAT);
  if (!sh) throw new Error('Falta la pestaña Catálogo: ejecuta crearBaseDeDatos');
  const last = sh.getLastRow();
  const keys = last >= ROW0 ? sh.getRange(ROW0, COLS, last - ROW0 + 1, 1).getValues().map(r => String(r[0])) : [];
  const pos = {};
  keys.forEach((k, i) => { if (k) pos[k] = ROW0 + i; });
  const now = new Date();
  const nuevos = [];
  let n = 0;
  kits.forEach(k => {
    const row = [k.marca || '', k.modelo || '', k.traccion || 'Todas', k.desde || '', k.hasta || '',
      k.tipo === 'leveling' ? 'Leveling' : 'Lift', +k.pulgadas || '',
      k.instalado == null ? 'No se ofrece' : +k.instalado, +k.base || '', k.starting ? 'Sí' : '',
      k.titulo || '', k.url ? '=HYPERLINK("' + String(k.url).replace(/"/g, '') + '","Ver")' : '', now, k.clave];
    if (!k.clave) return;
    if (pos[k.clave]) sh.getRange(pos[k.clave], 1, 1, COLS).setValues([row]);
    else { nuevos.push(row); pos[k.clave] = -1; }
    n++;
  });
  if (nuevos.length) {
    const start = Math.max(sh.getLastRow() + 1, ROW0);
    sh.getRange(start, 1, nuevos.length, COLS).setValues(nuevos);
    formatoDatos(sh, start, nuevos.length);
    sh.getRange(start, 1, nuevos.length, COLS).setFontFamily(T.font).setFontSize(10).setVerticalAlignment('middle');
  }
  const total = sh.getLastRow() - ROW0 + 1;
  if (total > 1) {
    if (sh.getFilter()) sh.getFilter().remove();
    sh.getRange(ROW0, 1, total, COLS).sort([{ column: 1 }, { column: 2 }, { column: 4 }, { column: 6 }, { column: 7 }, { column: 9 }]);
  }
  estiloCatalogo(sh);
  return n;
}

function guardarHistorial(c) {
  const sh = libro().getSheetByName(HIS);
  if (!sh) return;
  sh.insertRowAfter(3);
  sh.getRange(4, 1, 1, 4).setValues([[new Date(), c.vehiculo || '', c.mensaje || '', c.texto || '']])
    .setBackground('#ffffff').setFontColor(T.ink).setFontWeight('normal').setFontFamily(T.font).setFontSize(10).setWrap(true).setVerticalAlignment('top');
  sh.getRange(4, 1).setNumberFormat('dd/mm/yyyy HH:mm');
  sh.getRange(4, 1, 1, 4).setBorder(null, null, true, null, null, null, T.line, SpreadsheetApp.BorderStyle.SOLID);
}

function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// Prueba manual: agrega un kit de ejemplo (bórralo después si quieres)
function probarGuardado() {
  guardarKits([{ clave: 'prueba', marca: 'Ram', modelo: '1500', traccion: '4x4', desde: 2019, hasta: 2024, tipo: 'lift', pulgadas: 6, instalado: 2100, base: 1499.95, starting: true, titulo: '6 Inch Lift Kit | Ram 1500 4WD (2019-2024)', url: 'https://www.roughcountry.com/' }]);
}
