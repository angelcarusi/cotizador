// Puente del Cotizador: trae páginas de roughcountry.com y anota el historial.
// Se pega en script.google.com y se publica como "Aplicación web" con acceso "Cualquier usuario".

function doGet(e) {
  var p = (e && e.parameter) || {};
  var out;
  try {
    if (p.url) {
      if (!/^https:\/\/(www\.)?roughcountry\.com\//.test(p.url)) throw new Error('Solo se permite roughcountry.com');
      var r = UrlFetchApp.fetch(p.url, {
        muteHttpExceptions: true,
        followRedirects: true,
        headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', 'Accept-Language': 'en-US,en;q=0.9' }
      });
      var code = r.getResponseCode();
      var html = r.getContentText();
      if (!p.raw) html = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<svg[\s\S]*?<\/svg>/gi, '');
      out = { ok: code === 200, status: code, html: code === 200 ? html : '' };
    } else if (p.log) {
      anotar(JSON.parse(p.log));
      out = { ok: true };
    } else {
      out = { ok: true, msg: 'Puente activo' };
    }
  } catch (err) {
    out = { ok: false, error: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function anotar(d) {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('HOJA');
  var ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create('Cotizador - historial');
    ss.getSheets()[0].appendRow(['Fecha', 'Vehículo', 'Mensaje del cliente', 'Cotización']);
    props.setProperty('HOJA', ss.getId());
  }
  ss.getSheets()[0].appendRow([new Date(), d.v || '', d.m || '', d.r || '']);
}

// Ejecuta esta función una vez desde el editor para dar los permisos.
function probar() {
  var r = doGet({ parameter: { url: 'https://www.roughcountry.com/lift-kits/ford/f-150/2024' } });
  Logger.log(r.getContent().slice(0, 300));
  anotar({ v: 'Prueba', m: 'Prueba del puente', r: 'OK' });
}
