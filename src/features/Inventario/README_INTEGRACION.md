# Inventario FIFO

Feature nueva para controlar stock separado del catálogo de productos.

## Archivos incluidos

- `Inventario/pages/InventoryPage.jsx`
- `Inventario/components/InventoryEntryModal.jsx`
- `Inventario/hooks/useInventory.js`
- `Inventario/services/inventory.service.js`
- `Inventario/sql/INVENTARIO_FIFO_SETUP.sql`

## Cómo conectar la página

Agrega la ruta según tu router:

```jsx
import InventoryPage from "./features/Inventario/pages/InventoryPage";

<Route path="/inventario" element={<InventoryPage />} />
```

O si tus features están en otra estructura, ajusta el import.

## Menú lateral sugerido

```js
{
  label: "Inventario",
  path: "/inventario",
  icon: Boxes,
}
```

## Flujo de inventario

1. En `Inventario`, registra una entrada de compra.
2. Cada producto de esa entrada crea un lote.
3. Al guardar una entrega con estado `entregada`, se llama `consumir_inventario_fifo`.
4. El sistema descuenta primero los lotes más viejos.
5. Si se edita o elimina una entrega que ya consumió stock, se llama `revertir_inventario_entrega`.

## Nota

La primera versión no lee PDFs automáticamente. Guarda la URL del archivo como referencia y captura manualmente los productos.
