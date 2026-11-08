# Validacion de la entrega

- `npm run build` en client: correcto (Next.js 14.2.35).
- `node --check server/scripts/checkDatabase.js`: correcto.
- Interfaz compilada cargada en DOM de prueba (JSDOM) con API simulada:
  - Catalogo publico: tres tarjetas y precios.
  - ADMIN: volver sin confirmar no envia cambios.
  - ADMIN: confirmar cambio actualiza el plan visible.
  - ADMIN: cancelar muestra CANCELADA y retira el boton de cancelacion.
  - ADMIN: activar despues de cancelar devuelve ACTIVA.
  - CLIENTE: controles de cambio desactivados y sin boton de cancelacion.
- SQL ejecutado en PostgreSQL embebido de prueba (PGlite):
  - Esquema original: cuatro tablas OK.
  - Tablas productos, pedidos y archivos agregadas como prueba: REVISAR.
  - Tabla usuarios ausente: FALTA.
- Sin DATABASE_URL, db:check informa la configuracion faltante y sale con codigo 1.

Limites de la validacion: no se recibio conexion ni copia de la base PostgreSQL
local del usuario. No se ejecutaron cambios contra ella. Las pruebas de interfaz
usan respuestas simuladas, no una API conectada a datos reales. La revision visual
en navegador y la prueba de integracion con el PostgreSQL del equipo deben
completarse siguiendo el README. No se eliminaron tablas.
