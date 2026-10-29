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

## Cómo funciona
Rough Country bloquea las visitas de servidores (Cloudflare), así que la página la abre el navegador del teléfono:
1. En la app pegas el mensaje del cliente y tocas **Cotizar**. La app (o Gemini) entiende vehículo, año, tracción y pulgadas.
2. Se abre la página de lift kits de Rough Country de ese vehículo.
3. El script de Tampermonkey (`cotizador.user.js`) lee los kits de esa página y muestra la cotización con botón **Copiar**.

## Archivos
- `index.html` — la app (mensaje del cliente, Gemini, consultas).
- `core.js` — reglas de precio, lectura de mensajes y de las páginas de Rough Country (lo usan la app y el script).
- `cotizador.user.js` — script para Tampermonkey en Firefox.
- `puente/Codigo.gs` — puente de Google Apps Script (ya no se usa: Rough Country lo bloquea).
