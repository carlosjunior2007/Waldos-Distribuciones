# Excel Module

Módulo reutilizable para crear una hoja de cálculo editable tipo Excel dentro de React.

Este módulo contiene el motor genérico: grid, fórmulas, selección, edición, pegado, formato, ayuda, exportación y utilidades de datos. No contiene lógica específica de productos, clientes, pedidos, Supabase ni reglas de un negocio particular.

---

## 1. Objetivo del módulo

El objetivo es que puedas copiar esta carpeta a otro proyecto y tener una base funcional de hoja de cálculo sin reprogramar todo desde cero.

Sirve para crear pantallas como:

- Editor de productos.
- Cambios masivos.
- Presupuestos.
- Cotizaciones.
- Tablas contables.
- Reportes editables.
- Plantillas internas.
- Hojas colaborativas.

La parte importante: este módulo no sabe qué es un producto, una factura o un cliente. Solo sabe trabajar con celdas.

---

## 2. Estructura

```txt
excelModule/
├── components/
│   ├── ExcelGrid.jsx
│   └── ExcelHelpModal.jsx
├── excel.constants.js
├── excel.helpers.js
├── excelData.helpers.js
├── excelExport.helpers.js
├── index.js
└── README.md
```

---

## 3. Exportaciones principales

Importa desde `index.js`:

```js
import {
  ExcelGrid,
  ExcelHelpModal,
  createEmptyGrid,
  makeWorkbookContext,
  exportWorkbookAsExcel,
} from './excelModule';
```

### `ExcelGrid`

Componente principal de hoja de cálculo.

### `ExcelHelpModal`

Modal de ayuda integrado con funciones, shortcuts y explicación de uso.

### `createEmptyGrid`

Crea una matriz de celdas vacías.

### `makeWorkbookContext`

Crea el contexto necesario para evaluar fórmulas y referencias entre hojas.

### `exportWorkbookAsExcel`

Exporta el workbook a `.xls`.

---

## 4. Contrato de celda

Cada celda debe tener esta forma:

```js
{
  value: '',
  formula: '',
  style: {}
}
```

Ejemplos:

```js
{ value: 'Producto A', formula: '', style: {} }
{ value: 120, formula: '', style: { textAlign: 'right' } }
{ value: '', formula: '=SUM(A1:A10)', style: { bold: true } }
```

### Campos

| Campo | Tipo | Uso |
|---|---:|---|
| `value` | string/number | Valor directo escrito por el usuario. |
| `formula` | string | Fórmula original, por ejemplo `=SUM(A1:A10)`. |
| `style` | object | Estilos visuales de la celda. |

### Estilos soportados

```js
{
  bold: true,
  italic: true,
  underline: true,
  fontSize: 14,
  textColor: '#0f172a',
  bgColor: '#ffffff',
  textOpacity: 1,
  bgOpacity: 1,
  textAlign: 'left' // 'left' | 'center' | 'right'
}
```

---

## 5. Uso mínimo

```jsx
import { useMemo, useState } from 'react';
import {
  ExcelGrid,
  createEmptyGrid,
  makeWorkbookContext,
} from './excelModule';

function cloneGrid(grid) {
  return grid.map((row) =>
    row.map((cell) => ({
      ...cell,
      style: { ...(cell.style || {}) },
    }))
  );
}

export default function Example() {
  const [grid, setGrid] = useState(() => createEmptyGrid());

  const workbookContext = useMemo(() => {
    return makeWorkbookContext({
      sheets: [{ id: 'sheet-1', name: 'Hoja 1' }],
      gridsBySheet: { 'sheet-1': grid },
      activeSheetId: 'sheet-1',
      activeGrid: grid,
    });
  }, [grid]);

  function updateCell(rowIndex, colIndex, value) {
    setGrid((prev) => {
      const copy = cloneGrid(prev);
      const text = String(value ?? '');
      const isFormula = text.trim().startsWith('=');

      copy[rowIndex][colIndex] = {
        ...copy[rowIndex][colIndex],
        value: isFormula ? '' : value,
        formula: isFormula ? text : '',
      };

      return copy;
    });
  }

  return (
    <ExcelGrid
      grid={grid}
      sheetId="sheet-1"
      sheetName="Hoja 1"
      workbookContext={workbookContext}
      onChange={updateCell}
    />
  );
}
```

Este ejemplo funciona, pero para rendimiento real debes agregar `onBulkChange`.

---

## 6. Uso recomendado con cambios por lote

```jsx
function updateCellsBulk(changes) {
  setGrid((prev) => {
    const copy = cloneGrid(prev);

    changes.forEach(({ rowIndex, colIndex, value, formula, style }) => {
      if (!copy[rowIndex] || !copy[rowIndex][colIndex]) return;

      const text = String(value ?? formula ?? '');
      const isFormula = text.trim().startsWith('=');

      copy[rowIndex][colIndex] = {
        ...copy[rowIndex][colIndex],
        value: isFormula ? '' : value ?? '',
        formula: isFormula ? text : formula ?? '',
        style: style
          ? { ...(copy[rowIndex][colIndex].style || {}), ...style }
          : { ...(copy[rowIndex][colIndex].style || {}) },
      };
    });

    return copy;
  });
}
```

Render:

```jsx
<ExcelGrid
  grid={grid}
  sheetId="sheet-1"
  sheetName="Hoja 1"
  workbookContext={workbookContext}
  onChange={updateCell}
  onBulkChange={updateCellsBulk}
/>
```

`onBulkChange` es importante para:

- Pegar muchas celdas.
- Borrar rangos grandes.
- Arrastrar relleno.
- Aplicar operaciones masivas.

Sin `onBulkChange`, el grid puede funcionar, pero será más lento en acciones grandes. La física sigue existiendo, lamentablemente.

---

## 7. Props de `ExcelGrid`

```jsx
<ExcelGrid
  grid={grid}
  sheetId="sheet-1"
  sheetName="Hoja 1"
  workbookContext={workbookContext}
  onChange={updateCell}
  onBulkChange={updateCellsBulk}
  onSave={saveSheet}
  onApplyStyle={applyStyle}
  readOnly={false}
/>
```

| Prop | Requerida | Para qué sirve |
|---|---:|---|
| `grid` | Sí | Matriz de celdas visibles/editables. |
| `sheetId` | Sí | ID de la hoja actual. |
| `sheetName` | Sí | Nombre visible de la hoja. |
| `workbookContext` | Sí | Contexto para fórmulas, hojas y referencias. |
| `onChange` | Sí | Cambios de una sola celda. |
| `onBulkChange` | Recomendado | Cambios de muchas celdas en lote. |
| `onSave` | Opcional | Guardar con shortcut o botón externo. |
| `onApplyStyle` | Recomendado | Aplicar estilos a rangos. |
| `readOnly` | Opcional | Bloquear edición. |

---

## 8. `onApplyStyle`

Implementación ejemplo:

```js
function applyStyle(range, style) {
  setGrid((prev) => {
    const copy = cloneGrid(prev);

    const startRow = Math.min(range.startRow, range.endRow);
    const endRow = Math.max(range.startRow, range.endRow);
    const startCol = Math.min(range.startCol, range.endCol);
    const endCol = Math.max(range.startCol, range.endCol);

    for (let row = startRow; row <= endRow; row += 1) {
      for (let col = startCol; col <= endCol; col += 1) {
        if (!copy[row] || !copy[row][col]) continue;
        copy[row][col] = {
          ...copy[row][col],
          style: {
            ...(copy[row][col].style || {}),
            ...style,
          },
        };
      }
    }

    return copy;
  });
}
```

Ejemplos de estilos enviados:

```js
{ bold: true }
{ italic: true }
{ underline: true }
{ textAlign: 'center' }
{ bgColor: '#fef3c7' }
{ textColor: '#dc2626' }
{ fontSize: 16 }
```

---

## 9. Workbook con varias hojas

```js
const sheets = [
  { id: 'products', name: 'Productos' },
  { id: 'summary', name: 'Resumen' },
];

const gridsBySheet = {
  products: productsGrid,
  summary: summaryGrid,
};

const activeSheetId = 'products';
const activeGrid = gridsBySheet[activeSheetId];

const workbookContext = makeWorkbookContext({
  sheets,
  gridsBySheet,
  activeSheetId,
  activeGrid,
});
```

Así puedes usar fórmulas como:

```txt
=Productos!A1
=SUM(Productos!B2:B100)
=Resumen!C5
```

---

## 10. Fórmulas

Las fórmulas empiezan con `=`.

```txt
=A1+B1
=SUM(A1:A10)
=ROUND(B2*0.16,2)
=IF(C2>0,"Activo","Sin datos")
=XLOOKUP("P001",Productos!A:A,Productos!C:C,"No encontrado")
```

### Espacios permitidos

```txt
= SUM ( A1 : A10 )
= ROUND ( B2 * 0.16 , 2 )
```

### Referencias

```txt
A1       Referencia normal
$A$1     Columna y fila fijas
A$1      Fila fija
$A1      Columna fija
A1:B10   Rango
Hoja!A1  Referencia entre hojas
```

---

## 11. Autocompletado

Al escribir `=`, aparecen sugerencias de funciones.

Controles:

```txt
Flecha arriba / abajo  Navegar sugerencias
Enter                  Insertar sugerencia
Tab                    Insertar sugerencia
Escape                 Cerrar sugerencias
Click                  Insertar con mouse
```

Ejemplo:

1. Escribe `=su`.
2. Selecciona `SUM`.
3. Presiona `Enter`.
4. Queda `=SUM(`.
5. Arrastra `A1:A10`.
6. Cierra con `)`.

Resultado:

```txt
=SUM(A1:A10)
```

---

## 12. Selección y edición

### Selección normal

- Click en una celda: selecciona esa celda.
- Arrastrar: selecciona un rango.
- `Shift + flechas`: extiende selección.
- `Ctrl/Cmd + A`: selecciona la hoja visible/cargada.

### Edición

- Escribir directamente: reemplaza la celda activa.
- `F2`: editar contenido existente.
- `Enter`: confirmar.
- `Tab`: confirmar y avanzar.
- `Escape`: cancelar.

### Fórmulas con selección de rango

Mientras editas fórmula:

- Click en una celda inserta `A1`.
- Arrastrar varias celdas inserta `A1:B5`.

---

## 13. Shortcuts principales

### Archivo y edición

```txt
Ctrl/Cmd + S       Guardar
Ctrl/Cmd + Z       Deshacer
Ctrl/Cmd + Y       Rehacer
Ctrl/Cmd + Shift+Z Rehacer
Ctrl/Cmd + C       Copiar
Ctrl/Cmd + X       Cortar
Ctrl/Cmd + V       Pegar
Delete/Backspace   Limpiar contenido
F2                 Editar celda
Escape             Cancelar edición o cerrar sugerencias
```

### Navegación

```txt
Flechas              Mover selección
Shift + Flechas      Extender selección
Ctrl/Cmd + Flechas   Saltar a bordes
Home / End           Inicio/final de fila
Ctrl/Cmd + Home/End  Inicio/final de hoja
Page Up/Page Down    Mover por bloques
Tab / Shift+Tab      Derecha/izquierda
```

### Formato

```txt
Ctrl/Cmd + B         Negrita
Ctrl/Cmd + I         Cursiva
Ctrl/Cmd + U         Subrayado
Ctrl/Cmd + Shift + F Limpiar formato
Ctrl/Cmd + Alt + 1   Alinear izquierda
Ctrl/Cmd + Alt + 2   Alinear centro
Ctrl/Cmd + Alt + 3   Alinear derecha
Ctrl/Cmd + Alt + 7   Bajar tamaño de fuente
Ctrl/Cmd + Alt + 8   Subir tamaño de fuente
Ctrl/Cmd + Alt + 9   Fuente a 14px
```

### Fórmulas rápidas

```txt
Alt + =              Autosuma
Alt + S              =SUM(
Alt + A              =AVERAGE(
Alt + M              =MAX(
Alt + N              =MIN(
Alt + I              =IF(
Alt + V              =VLOOKUP(
Alt + X              =XLOOKUP(
Alt + P              =PMT(
Alt + T              =TEXTJOIN(
```

Hay más shortcuts especializados en la ayuda integrada. No los memorices todos el primer día, no estamos entrenando para las olimpiadas de teclado.

---

## 14. Funciones soportadas

El módulo soporta funciones de estas familias:

- Básicas: `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, `COUNTA`, `PRODUCT`.
- Condicionales: `IF`, `IFS`, `IFERROR`, `SUMIF`, `SUMIFS`, `COUNTIF`, `COUNTIFS`, `AVERAGEIF`, `AVERAGEIFS`.
- Matemáticas: `ROUND`, `ABS`, `SQRT`, `POWER`, `MOD`, `INT`, `TRUNC`, `CEILING`, `FLOOR`, `RAND`, `PI`, trigonométricas.
- Texto: `LEFT`, `RIGHT`, `MID`, `UPPER`, `LOWER`, `TRIM`, `TEXTJOIN`, `TEXTBEFORE`, `TEXTAFTER`, `TEXTSPLIT`.
- Fechas: `TODAY`, `NOW`, `DATE`, `DAY`, `MONTH`, `YEAR`, `DAYS`, `DAYS360`, `NETWORKDAYS`, `WORKDAY`, `YEARFRAC`, `EOMONTH`.
- Búsqueda: `INDEX`, `MATCH`, `XMATCH`, `VLOOKUP`, `HLOOKUP`, `XLOOKUP`.
- Estadística: `MEDIAN`, `STDEV.S`, `STDEV.P`, `VAR.S`, `VAR.P`, `PERCENTILE`, `QUARTILE`, `FORECAST.LINEAR`.
- Finanzas: `PMT`, `PV`, `FV`, `NPV`, `IRR`, `RATE`, `NPER`, `IPMT`, `PPMT`.
- Matrices: `FILTER`, `UNIQUE`, `SORT`, `TRANSPOSE`, `HSTACK`, `VSTACK`, `SEQUENCE`.
- Contabilidad general: funciones de IVA, margen, utilidad, depreciación, conciliación y razones financieras.

La lista completa está en el modal de ayuda porque ya es larga. Excel lleva décadas acumulando funciones como si fueran estampitas, así que no intentemos meter toda la biblia en esta sección.

---

## 15. Exportar workbook

```js
import { exportWorkbookAsExcel } from './excelModule';

exportWorkbookAsExcel({
  sheets,
  gridsBySheet,
  filename: 'reporte.xls',
});
```

---

## 16. Persistencia recomendada

### MVP simple: guardar grid como JSON

```sql
create table excel_sheets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grid jsonb not null,
  updated_at timestamptz default now()
);
```

### Sistema serio: guardar por celda

```sql
create table excel_cells (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null,
  row_index integer not null,
  col_index integer not null,
  value text,
  formula text,
  style jsonb default '{}',
  updated_at timestamptz default now(),
  unique(sheet_id, row_index, col_index)
);
```

Recomendación concreta: usa JSON para prototipos y por celda para colaboración o auditoría.

---

## 17. Cómo conectar con datos reales

No edites el módulo para cada caso. Crea adaptadores.

Ejemplo:

```txt
features/products/productExcel.adapter.js
features/accounting/accountingExcel.adapter.js
features/orders/orderExcel.adapter.js
```

Un adaptador debe encargarse de:

- Convertir datos de DB a grid.
- Interpretar cambios del grid.
- Validar campos.
- Crear/actualizar registros reales.

El módulo solo da la hoja. El adaptador traduce esa hoja al negocio.

---

## 18. Rendimiento

Para mantenerlo fluido:

- Usa `onBulkChange`.
- No guardes en DB cada tecla.
- Guarda con debounce o con botón Guardar.
- No recrees `workbookContext` sin `useMemo`.
- No conviertas datos grandes a grid en cada render.
- Evita meter lógica pesada dentro de render.
- Mantén lógica específica fuera del módulo.

Ejemplo correcto:

```js
const workbookContext = useMemo(() => {
  return makeWorkbookContext({ sheets, gridsBySheet, activeSheetId, activeGrid });
}, [sheets, gridsBySheet, activeSheetId, activeGrid]);
```

---

## 19. Vista pública con permiso de editar

Si tienes una vista compartida por link, usa el mismo módulo:

```jsx
<ExcelGrid
  grid={grid}
  sheetId={activeSheetId}
  sheetName={activeSheetName}
  workbookContext={workbookContext}
  onChange={canEdit ? updateCell : undefined}
  onBulkChange={canEdit ? updateCellsBulk : undefined}
  onApplyStyle={canEdit ? applyStyle : undefined}
  readOnly={!canEdit}
/>
```

Si `canEdit` es verdadero, la vista pública debe recibir:

- Misma barra de herramientas.
- Mismo grid.
- Mismo modal de ayuda.
- Mismos shortcuts.
- Mismo autocompletado.

Si no, el invitado termina usando una versión mutilada y luego todos preguntan por qué “en mi compu sí sale”. Qué misterio tan evitable.

---

## 20. Errores comunes

### La celda se borra mientras escribo

Casi siempre pasa por actualizar estado global en cada tecla o por forzar re-render del input. Mantén edición local y confirma al terminar.

### Pegar desde Excel es lento

Falta `onBulkChange`.

### Las fórmulas no ven otras hojas

`makeWorkbookContext` no recibió todas las hojas o `gridsBySheet` no coincide con los IDs.

### El formato no se guarda

Tu persistencia no está guardando `style`.

### Hay demasiadas requests

No llames auth, DB o servicios dentro de render/celdas. Cachea usuario y guarda por lotes.

---

## 21. Qué no hacer

No hagas esto:

```js
// Mal: guardar en DB cada tecla
onChange={(row, col, value) => {
  updateCell(row, col, value);
  saveToDatabase(row, col, value);
}}
```

Mejor:

```js
// Mejor: actualizar UI y guardar después
onChange={updateCell}
onBulkChange={updateCellsBulk}
onSave={saveSheet}
```

Tampoco metas lógica de negocio en `excel.helpers.js`. Ese archivo debe ser genérico.

---

## 22. Roadmap sugerido

Mejoras futuras sanas:

- Importar `.xlsx` real.
- Exportar `.xlsx` real con estilos.
- Validaciones por columna.
- Bloqueo de rangos.
- Comentarios por celda.
- Historial por usuario.
- Formato de moneda/fecha por celda.
- Filtros visuales por columna.
- Ordenamiento visual por columna.
- Tablas con encabezados inteligentes.

No metas todo antes de tener un usuario real usando el módulo. Ya sabemos cómo termina eso: mucho sistema, poca entrega.

## Corrección de guardado y bloques con huecos

El módulo no debe asumir que la hoja termina en la última fila visible. Una hoja puede tener datos en filas lejanas, por ejemplo fila 90, 94 y 99, con huecos entre ellas. Para evitar pérdida visual o pérdida de guardado:

- `cellsToGrid` calcula el tamaño real desde las celdas guardadas en DB.
- `getCellsDataBounds` detecta la última fila y columna con datos reales.
- `getGridDataBounds` detecta la última fila y columna con datos en memoria.
- El grid virtual usa esos límites para renderizar/permitir scroll hasta todos los bloques con datos.
- El guardado pendiente se vacía antes de recargar, cambiar de hoja, importar datos o presionar Guardar.
- Las celdas se guardan en lotes para evitar fallos silenciosos cuando hay muchas filas o textos largos.

Regla práctica: el módulo puede virtualizar filas para rendimiento, pero nunca debe usar la ventana visible como fuente de verdad. La fuente de verdad son las celdas con `value`, `formula` o `style`.

## Guardado seguro y carga de bloques con huecos

El módulo no debe asumir que los datos están en filas continuas. Una hoja puede tener datos en la fila 10, luego en la 80, luego en la 300. Por eso la reconstrucción del grid usa los índices reales `row_index` y `col_index` guardados en la base de datos.

Correcciones importantes incluidas:

- `cellsToGrid()` ordena las celdas por fila y columna antes de reconstruir el grid.
- `cellsToGrid()` acepta tanto `row_index`/`col_index` como `rowIndex`/`colIndex`.
- El tamaño visible de la hoja se calcula usando la última celda con contenido real.
- `saveSheetCells()` ya no borra toda la hoja antes de insertar.
- Primero hace `upsert` de todas las celdas con datos y después elimina las celdas viejas que ya no existen en el grid.

Esto evita el caso peligroso donde un guardado grande falla a media operación: antes se podía borrar la hoja y quedarse solo con algunos chunks insertados. Ahora, si falla un guardado, los datos anteriores permanecen en la base de datos.

Si al abrir una hoja siguen faltando filas, revisa directamente la tabla `playground_cells` filtrando por `sheet_id`. Si las celdas ya no están ahí, no es un problema de render: fueron eliminadas o nunca llegaron a guardarse. En ese caso hay que volver a importar esos datos.

## Corrección de filas vacías entre datos importados

El módulo ahora compacta automáticamente las filas con datos cuando detecta una tabla importada con encabezados y huecos entre registros. Esto evita que un catálogo se vea así:

```txt
77 Producto A
78 Producto B
79 vacío
80 vacío
...
93 Producto C
```

Y lo reconstruye visualmente como tabla corrida:

```txt
77 Producto A
78 Producto B
79 Producto C
```

La corrección está en:

```js
cellsToGrid(cells, DEFAULT_ROWS, DEFAULT_COLUMNS, { compactRows: true })
```

Internamente usa:

- `rowHasContent(row)`
- `shouldCompactTableRows(grid)`
- `compactGridDataRows(grid)`

Esto está pensado para datos tabulares importados. Si en otro proyecto necesitas respetar filas vacías intencionales, puedes llamar:

```js
cellsToGrid(cells, DEFAULT_ROWS, DEFAULT_COLUMNS, { compactRows: false })
```

## Corrección: productos incompletos al cargar

Para hojas de productos, el módulo ya no intenta compactar filas vacías para esconder huecos. Eso era incorrecto cuando el problema real era que no aparecían todos los productos.

Ahora, si la hoja parece una tabla de productos porque tiene columnas como `codigo`, `producto_id`, `precio` o el nombre de la hoja contiene `Productos`, el playground reconstruye las filas usando la tabla real de `productos` al cargar.

Regla aplicada:

- La fuente de verdad para la lista de productos es la tabla `productos`.
- Si existen 109 productos habilitados, deben renderizarse 109 filas de productos.
- No se rellenan huecos artificialmente.
- No se compactan filas para ocultar datos faltantes.
- Se preservan columnas personalizadas que no vienen de productos cuando se puede empatar por `id`, `codigo` o `nombre`.

Archivos involucrados:

```txt
playground/domain/productExcel.adapter.js
playground/hooks/usePlaygroundWorkbook.js
playground/excelModule/excel.helpers.js
```

Funciones clave:

```js
isProductSheetLike(sheet, grid)
reconcileProductSheetGrid(grid, products)
cellsToGrid(cells, rows, cols, { compactRows: false })
```

Si vuelven a faltar productos, revisa primero cuántos productos devuelve `getProductsForPlayground()`. Si ahí devuelve 109, la hoja debe mostrar 109 filas. Si devuelve menos, el problema está en la consulta a la tabla `productos`, no en el grid.
