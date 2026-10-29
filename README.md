# Cotizador Cheap on Tires

App para el celular que convierte el mensaje de un cliente en la cotización lista para copiar, con precios base de Rough Country.

## Reglas
- **Lift kit** (el título dice "lift kit"): (precio − 33.5%) + $1,000. Redondeo: si pasa del centenar por 80 o menos, sube al siguiente; si pasa de 80, salta uno más ($1,776 → $1,800; $1,981 → $2,100).
- **Leveling kit** (el título dice "leveling"): hasta $70 → $350; más de $70 hasta $200 → $450; más de $200 se ignora.
- Lo que no diga "lift kit" ni "leveling" se ignora.
- Un solo kit por medida y tipo: el más barato.
- Orden: leveling primero, luego lift, cada grupo por pulgadas.
- Inglés: `6" lift kit for $2,000 installed and aligned` · `2" leveling kit for $350 installed`
- Español: `6" lift kit por $2,000 instalado y alineado` · `2" leveling kit por $350 instalado`

## Archivos
- `index.html` — la app (pantallas, Gemini, copiar).
- `core.js` — reglas de precio, lectura de mensajes y de las páginas de Rough Country.
- `puente/Codigo.gs` — script de Google Apps Script que trae las páginas de roughcountry.com y anota el historial en la hoja «Cotizador - historial».
