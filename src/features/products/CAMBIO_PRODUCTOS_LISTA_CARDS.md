# Cambio: productos en cards limpias

Se reemplazó la tabla de escritorio por una lista de cards para evitar que los precios, proveedor, estado y acciones se vieran amontonados.

## Cambios

- Cada producto ahora se muestra como card horizontal.
- Los precios quedan separados en bloques:
  - Compra
  - Venta s/IVA
  - Venta c/IVA
- Se conserva código, categoría, proveedor, utilidad, estado y acciones.
- La columna de precios ya no usa una mini-tabla apretada.
- El diseño mantiene más aire visual y se lee mejor en pantallas grandes.

## Archivo modificado

- `products/components/ProductsTable.jsx`
