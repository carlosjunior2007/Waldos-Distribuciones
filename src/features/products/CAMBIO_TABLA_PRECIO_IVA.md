# Cambio tabla de productos

Se ajustó la tabla de productos para que no se vea tan amontonada y para mostrar el precio de venta con IVA.

## Cambios

- Se reemplazaron las columnas separadas de `Compra` y `Venta` por una columna agrupada llamada `Precios`.
- La columna `Precios` muestra:
  - Compra
  - Venta s/IVA
  - Venta c/IVA
- Se calcula `Venta c/IVA` usando `precio * (1 + iva_porcentaje / 100)`.
- Se mejoró el ancho de columnas con `table-fixed` y `colgroup`.
- Se mejoró la presentación del producto, proveedor, código y categoría para evitar que se amontone el contenido.
- También se agregó `Venta c/IVA` en la vista móvil.

## Archivos modificados

- `products/components/ProductsTable.jsx`
- `products/components/ProductsMobileList.jsx`
- `products/product.helpers.js`
