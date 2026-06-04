# Optimización de colaboración del Playground

Cambios incluidos:

1. Presencia más estable
   - Cada pestaña tiene un `tabId` propio en `sessionStorage`.
   - Los usuarios invitados ya no se pisan entre pestañas.
   - La presencia manda heartbeat cada 12 segundos.
   - Se limpian usuarios viejos si llevan más de 45 segundos sin actualizar.
   - Ahora se envía `sheetId`, no solo el nombre de la hoja.

2. Mejor detección de celda activa
   - La presencia se cruza por `sheetId` cuando existe.
   - Evita errores cuando dos hojas tienen el mismo nombre.

3. Realtime menos agresivo
   - Los cambios de celdas se guardan en lote con debounce de 250 ms.
   - Al actualizar metadata del workbook ya no se recarga toda la hoja innecesariamente.
   - Al recargar por cambios de hojas se conserva la hoja activa del usuario.

4. Configuración Supabase
   - Se agregó `REALTIME_SETUP.sql` para habilitar realtime en las tablas necesarias.
