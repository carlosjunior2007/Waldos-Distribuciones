# Guía completa para reutilizar el módulo de Excel

Esta guía explica cómo mover el módulo tipo Excel a otro proyecto, cómo conectarlo con tu propia base de datos, qué archivos debes copiar, qué partes no debes copiar y cómo extenderlo sin volverlo un monstruo imposible de mantener. Porque copiar carpetas sin saber qué hacen es una tradición humana, pero intentemos no practicarla aquí.

---

## 1. Idea general

El playground quedó separado en dos capas:

```txt
playground/
├── excelModule/                 # Motor genérico reutilizable
├── domain/                      # Adaptadores específicos del proyecto actual
├── components/                  # Componentes del playground actual
├── hooks/                       # Hooks del playground actual
├── pages/                       # Pantallas privadas y públicas
└── README_REUTILIZAR_EXCEL.md   # Esta guía
```

La carpeta importante para reutilizar es:

```txt
playground/excelModule/
```

Esa carpeta debe poder moverse a otro proyecto sin depender de productos, Waldo, Supabase, pedidos, clientes ni permisos específicos.

---

## 2. Qué debes copiar a otro proyecto

Copia completa esta carpeta:

```txt
playground/excelModule/
```

Y pégala, por ejemplo, en:

```txt
src/modules/excel/
```

La estructura queda así:

```txt
src/modules/excel/
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

No copies a ciegas `domain/productExcel.adapter.js` si el nuevo proyecto no maneja productos. Ese archivo es un adaptador del sistema actual, no del motor de Excel.

---

## 3. Qué hace cada archivo del módulo

### `components/ExcelGrid.jsx`

Es el grid editable tipo Excel.

Se encarga de:

- Renderizar celdas.
- Permitir edición directa.
- Seleccionar celdas y rangos.
- Copiar, cortar y pegar.
- Arrastrar para rellenar.
- Insertar fórmulas.
- Mostrar sugerencias de funciones.
- Insertar referencias al hacer click en celdas mientras escribes fórmula.
- Aplicar estilos.
- Manejar scroll y renderizado optimizado.

Este componente no guarda en DB. Solo avisa hacia afuera usando callbacks como `onChange`, `onBulkChange`, `onSave` y `onApplyStyle`.

### `components/ExcelHelpModal.jsx`

Es el modal de ayuda del módulo.

Sirve para mostrar:

- Cómo usar fórmulas.
- Shortcuts.
- Funciones soportadas.
- Ejemplos de uso.
- Explicación de argumentos.
- Consejos para selección, pegado y rangos.

Puedes usarlo en cualquier proyecto donde uses el grid.

### `excel.constants.js`

Contiene constantes del motor, como:

- Cantidad base de filas.
- Cantidad base de columnas.
- Tamaños iniciales.
- Configuración base.

Si quieres que una hoja empiece con más o menos columnas/filas, normalmente ajustas aquí.

### `excel.helpers.js`

Es el corazón del motor.

Incluye:

- Conversión de índices a letras de columna.
- Lectura de referencias como `A1`, `$A$1`, `Productos!C2`.
- Evaluación de fórmulas.
- Catálogo de funciones.
- Autocompletado de funciones.
- Formato visual de celdas.
- Creación de contexto de workbook.

Este archivo debe mantenerse genérico. No metas aquí lógica de productos, clientes ni pedidos. Si lo haces, felicidades, acabas de empezar otra deuda técnica.

### `excelData.helpers.js`

Sirve para manipular datos de hoja.

Incluye helpers para:

- Convertir arrays de objetos a grid.
- Rellenar celdas al arrastrar.
- Detectar series numéricas.
- Copiar fórmulas ajustando referencias.
- Convertir datos externos al formato del grid.

### `excelExport.helpers.js`

Sirve para exportar la hoja o workbook a archivo `.xls`.

### `index.js`

Es el punto de entrada del módulo.

Importa todo desde aquí para evitar rutas largas:

```js
import {
  ExcelGrid,
  ExcelHelpModal,
  createEmptyGrid,
  makeWorkbookContext,
  exportWorkbookAsExcel,
} from '@/modules/excel';
```

---

## 4. Qué NO debe ir dentro del módulo

No metas dentro de `excelModule` cosas como:

- Consultas directas a Supabase.
- Consultas directas a MySQL.
- Lógica de productos.
- Lógica de clientes.
- Permisos de usuarios.
- Realtime específico de un sistema.
- PDFs.
- Correos.
- Cambios masivos específicos de una tabla.

Eso debe vivir fuera, en adaptadores o servicios.

El módulo debe saber hacer hojas de cálculo. Tu sistema debe decidir qué significan esas hojas.

---

## 5. Modelo de celda

Cada celda usa esta forma base:

```js
{
  value: '',
  formula: '',
  style: {}
}
```

### `value`

Es el valor escrito o mostrado cuando no hay fórmula.

Ejemplos:

```js
{ value: 'Producto A', formula: '', style: {} }
{ value: 150, formula: '', style: {} }
```

### `formula`

Es la fórmula original escrita por el usuario.

Ejemplo:

```js
{ value: '', formula: '=SUM(A1:A10)', style: {} }
```

Cuando una celda tiene `formula`, el valor mostrado se calcula usando el contexto del workbook.

### `style`

Es el estilo visual de la celda.

Ejemplo:

```js
{
  value: 'Total',
  formula: '',
  style: {
    bold: true,
    italic: false,
    underline: false,
    fontSize: 14,
    textColor: '#111827',
    bgColor: '#f9fafb',
    textAlign: 'right'
  }
}
```

Estilos soportados:

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
  textAlign: 'left' | 'center' | 'right'
}
```

---

## 6. Instalación mínima en otro proyecto

### Paso 1: copiar carpeta

Copia:

```txt
playground/excelModule/
```

A:

```txt
src/modules/excel/
```

### Paso 2: importar el módulo

```jsx
import { useMemo, useState } from 'react';
import {
  ExcelGrid,
  ExcelHelpModal,
  createEmptyGrid,
  makeWorkbookContext,
} from '@/modules/excel';
```

### Paso 3: crear estado de hoja

```jsx
const [grid, setGrid] = useState(() => createEmptyGrid());
const [helpOpen, setHelpOpen] = useState(false);
```

### Paso 4: crear contexto del workbook

```jsx
const workbookContext = useMemo(() => {
  return makeWorkbookContext({
    sheets: [{ id: 'sheet-1', name: 'Hoja 1' }],
    gridsBySheet: { 'sheet-1': grid },
    activeSheetId: 'sheet-1',
    activeGrid: grid,
  });
}, [grid]);
```

### Paso 5: renderizar el grid

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
/>

<ExcelHelpModal
  open={helpOpen}
  onClose={() => setHelpOpen(false)}
/>
```

---

## 7. Ejemplo completo básico

```jsx
import { useMemo, useState } from 'react';
import {
  ExcelGrid,
  ExcelHelpModal,
  createEmptyGrid,
  makeWorkbookContext,
} from '@/modules/excel';

function cloneGrid(grid) {
  return grid.map((row) =>
    row.map((cell) => ({
      ...cell,
      style: { ...(cell.style || {}) },
    }))
  );
}

export default function SimpleExcelPage() {
  const [grid, setGrid] = useState(() => createEmptyGrid());
  const [helpOpen, setHelpOpen] = useState(false);

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
        formula: isFormula ? value : '',
      };

      return copy;
    });
  }

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

  function saveSheet() {
    console.log('Aquí guardarías en tu DB:', grid);
  }

  return (
    <section className="h-screen bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Mi Excel reutilizable</h1>
        <button onClick={() => setHelpOpen(true)}>Ayuda</button>
      </div>

      <ExcelGrid
        grid={grid}
        sheetId="sheet-1"
        sheetName="Hoja 1"
        workbookContext={workbookContext}
        onChange={updateCell}
        onBulkChange={updateCellsBulk}
        onSave={saveSheet}
        onApplyStyle={applyStyle}
      />

      <ExcelHelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </section>
  );
}
```

---

## 8. Props principales de `ExcelGrid`

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

### `grid`

Matriz de celdas.

```js
[
  [
    { value: 'Nombre', formula: '', style: { bold: true } },
    { value: 'Precio', formula: '', style: { bold: true } },
  ],
  [
    { value: 'Producto A', formula: '', style: {} },
    { value: 100, formula: '', style: {} },
  ]
]
```

### `sheetId`

ID interno de la hoja activa.

Ejemplo:

```js
'sheet-1'
```

### `sheetName`

Nombre visible de la hoja.

Ejemplo:

```js
'Productos'
```

### `workbookContext`

Objeto creado con `makeWorkbookContext`. Permite que las fórmulas puedan leer:

- La hoja actual.
- Otras hojas.
- Rangos.
- Referencias como `Productos!A1`.

### `onChange(rowIndex, colIndex, value)`

Se llama cuando cambia una celda individual.

Úsalo para cambios pequeños.

### `onBulkChange(changes)`

Se llama cuando cambian muchas celdas a la vez.

Se usa para:

- Pegar desde Excel.
- Borrar selección grande.
- Arrastrar relleno.
- Aplicar cambios masivos.

Formato:

```js
[
  { rowIndex: 0, colIndex: 0, value: 'Producto A' },
  { rowIndex: 0, colIndex: 1, value: 150 },
]
```

Usa siempre `onBulkChange` en proyectos serios. Si no, pegar 500 celdas llamará 500 veces a `onChange`, y luego fingiremos sorpresa cuando se trabe.

### `onSave()`

Se ejecuta con `Ctrl/Cmd + S` o con el botón de guardar si lo conectas desde tu UI.

### `onApplyStyle(range, style)`

Se llama cuando el usuario aplica formato.

Ejemplo de `range`:

```js
{
  startRow: 0,
  endRow: 4,
  startCol: 1,
  endCol: 3
}
```

Ejemplo de `style`:

```js
{
  bold: true,
  textAlign: 'center'
}
```

### `readOnly`

Si lo usas, puedes bloquear edición en vistas públicas o de solo lectura.

```jsx
<ExcelGrid readOnly />
```

---

## 9. Cómo manejar varias hojas

Estado recomendado:

```js
const [sheets, setSheets] = useState([
  { id: 'sheet-1', name: 'Productos' },
  { id: 'sheet-2', name: 'Resumen' },
]);

const [activeSheetId, setActiveSheetId] = useState('sheet-1');

const [gridsBySheet, setGridsBySheet] = useState({
  'sheet-1': createEmptyGrid(),
  'sheet-2': createEmptyGrid(),
});
```

Crear contexto:

```js
const activeGrid = gridsBySheet[activeSheetId];

const workbookContext = makeWorkbookContext({
  sheets,
  gridsBySheet,
  activeSheetId,
  activeGrid,
});
```

Render:

```jsx
<ExcelGrid
  grid={activeGrid}
  sheetId={activeSheetId}
  sheetName={sheets.find((s) => s.id === activeSheetId)?.name || 'Hoja'}
  workbookContext={workbookContext}
  onChange={(row, col, value) => updateCell(activeSheetId, row, col, value)}
  onBulkChange={(changes) => updateCellsBulk(activeSheetId, changes)}
/>
```

Referencias entre hojas:

```txt
=Productos!A1
=SUM(Productos!B2:B20)
=Resumen!C5
```

---

## 10. Cómo guardar en base de datos

El módulo no guarda solo. Tú decides.

### Opción A: guardar toda la hoja como JSON

Más simple para MVP.

Tabla sugerida:

```sql
create table excel_sheets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grid jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Guardar:

```js
async function saveSheet() {
  await supabase
    .from('excel_sheets')
    .upsert({
      id: sheetId,
      name: sheetName,
      grid,
      updated_at: new Date().toISOString(),
    });
}
```

Ventaja: rápido de implementar.

Desventaja: si varios usuarios editan al mismo tiempo, es más difícil resolver conflictos.

### Opción B: guardar por celda

Mejor para colaboración, cambios parciales y auditoría.

Tabla sugerida:

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

Guardar cambios por lote:

```js
async function saveBulkChanges(sheetId, changes) {
  const rows = changes.map((change) => ({
    sheet_id: sheetId,
    row_index: change.rowIndex,
    col_index: change.colIndex,
    value: change.value ?? '',
    formula: change.formula ?? '',
    style: change.style ?? {},
    updated_at: new Date().toISOString(),
  }));

  await supabase
    .from('excel_cells')
    .upsert(rows, {
      onConflict: 'sheet_id,row_index,col_index',
    });
}
```

Ventaja: mejor rendimiento con cambios pequeños y colaboración.

Desventaja: ocupa más código.

---

## 11. Cómo convertir datos de DB a grid

Si tu DB guarda filas normales, por ejemplo productos:

```js
const products = [
  { id: 1, codigo: 'P001', nombre: 'Toalla', precio: 120 },
  { id: 2, codigo: 'P002', nombre: 'Jabón', precio: 80 },
];
```

Puedes convertirlos a grid así:

```js
const headers = ['ID', 'Código', 'Nombre', 'Precio'];

const grid = [
  headers.map((header) => ({
    value: header,
    formula: '',
    style: { bold: true, bgColor: '#f3f4f6' },
  })),
  ...products.map((product) => [
    { value: product.id, formula: '', style: {} },
    { value: product.codigo, formula: '', style: {} },
    { value: product.nombre, formula: '', style: {} },
    { value: product.precio, formula: '', style: {} },
  ]),
];
```

Para otro tipo de dato, haz otro adaptador. No edites el módulo de Excel.

Ejemplo de adaptador:

```txt
src/features/inventory/inventoryExcel.adapter.js
src/features/accounting/accountingExcel.adapter.js
src/features/orders/ordersExcel.adapter.js
```

---

## 12. Cómo detectar cambios masivos

El módulo puede editar la hoja, pero tu adaptador debe interpretar qué significa cada fila.

Ejemplo:

```js
function detectProductChanges(grid, originalProducts) {
  const headerRow = grid[0];
  const headers = headerRow.map((cell) => String(cell.value).trim());

  const idIndex = headers.indexOf('ID');
  const nameIndex = headers.indexOf('Nombre');
  const priceIndex = headers.indexOf('Precio');

  const changes = [];
  const creates = [];

  grid.slice(1).forEach((row) => {
    const id = row[idIndex]?.value;
    const name = row[nameIndex]?.value;
    const price = Number(row[priceIndex]?.value || 0);

    if (!id && name) {
      creates.push({ name, price });
      return;
    }

    const original = originalProducts.find((p) => String(p.id) === String(id));
    if (!original) return;

    if (original.nombre !== name || Number(original.precio) !== price) {
      changes.push({ id, name, price });
    }
  });

  return { creates, changes };
}
```

Esto debe vivir fuera del módulo. El módulo no debe saber qué es un producto.

---

## 13. Cómo usar fórmulas

El usuario escribe fórmulas iniciando con `=`.

Ejemplos:

```txt
=A1+B1
=SUM(A1:A10)
=ROUND(B2*0.16,2)
=IF(C2>0,"Activo","Sin datos")
=XLOOKUP("P001",Productos!A:A,Productos!C:C,"No encontrado")
```

### Espacios en fórmulas

El parser tolera espacios fuera de textos:

```txt
= SUM ( A1 : A10 )
= ROUND ( B2 * 0.16 , 2 )
```

### Referencias absolutas

```txt
=A1
=$A$1
=A$1
=$A1
```

Puedes usar `F4` mientras editas fórmula para convertir la última referencia a absoluta.

### Referencias entre hojas

```txt
=Productos!A1
=SUM(Productos!B2:B100)
```

---

## 14. Autocompletado de funciones

Cuando el usuario escribe `=`, se muestran sugerencias.

Ejemplos:

```txt
=
=su
=buscar
=iva
```

Controles:

```txt
Flecha arriba / abajo  Navegar sugerencias
Enter                  Insertar sugerencia
Tab                    Insertar sugerencia
Escape                 Cerrar sugerencias
Click                  Insertar sugerencia con mouse
```

Al insertar `SUM`, el editor deja:

```txt
=SUM(
```

Luego puedes hacer click o arrastrar celdas para insertar referencias.

---

## 15. Seleccionar celdas mientras editas fórmula

Flujo recomendado:

1. Escribe `=SUM(` en una celda.
2. Haz click en `A1`.
3. Se inserta `A1`.
4. Arrastra de `A1` a `A10`.
5. Se inserta `A1:A10`.
6. Cierra con `)` si ya terminaste.

Resultado:

```txt
=SUM(A1:A10)
```

No se cierra automáticamente el paréntesis porque a veces quieres seguir escribiendo más argumentos:

```txt
=SUM(A1:A10,C1:C10,25)
```

---

## 16. Exportar a Excel

Importa:

```js
import { exportWorkbookAsExcel } from '@/modules/excel';
```

Uso básico:

```js
exportWorkbookAsExcel({
  sheets,
  gridsBySheet,
  filename: 'mi_archivo.xls',
});
```

Si no quieres exportar todas las hojas, manda solo las que quieras.

---

## 17. Cómo usar el modal de ayuda

```jsx
import { ExcelHelpModal } from '@/modules/excel';

function Page() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <button onClick={() => setHelpOpen(true)}>Ayuda</button>

      <ExcelHelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </>
  );
}
```

El modal ya trae:

- Buscador.
- Categorías.
- Funciones.
- Shortcuts.
- Ejemplos.
- Explicación de argumentos.

---

## 18. Recomendación de arquitectura para proyectos nuevos

Usa esta separación:

```txt
src/modules/excel/                    # Motor genérico
src/features/products/productExcel.adapter.js
src/features/orders/orderExcel.adapter.js
src/features/accounting/accountingExcel.adapter.js
src/features/playground/PlaygroundPage.jsx
```

Regla simple:

- Si sirve para cualquier hoja de cálculo, va en `modules/excel`.
- Si habla de productos, clientes, pedidos, facturas o una tabla específica, va en `features/...`.

---

## 19. Checklist para reutilizar sin romperlo

Antes de llevarte el módulo a otro proyecto, revisa:

```txt
[ ] Copié completa la carpeta excelModule.
[ ] Estoy importando desde index.js.
[ ] Tengo estado para grid.
[ ] Tengo workbookContext con makeWorkbookContext.
[ ] Implementé onChange.
[ ] Implementé onBulkChange.
[ ] Implementé onApplyStyle si quiero formato.
[ ] Implementé onSave si quiero guardar.
[ ] Separé la lógica específica en un adapter.
[ ] No metí Supabase directo dentro del módulo.
[ ] No metí lógica de productos dentro del módulo.
[ ] Probé pegar desde Excel/Sheets.
[ ] Probé fórmulas con rangos.
[ ] Probé exportar.
```

---

## 20. Errores comunes

### La fórmula no calcula

Revisa:

- Que empiece con `=`.
- Que el `workbookContext` tenga la hoja activa.
- Que las referencias existan.
- Que los textos estén entre comillas.

Correcto:

```txt
=IF(A1>10,"Alto","Bajo")
```

Incorrecto:

```txt
=IF(A1>10,Alto,Bajo)
```

### Se traba al pegar muchos datos

Implementa `onBulkChange`. No uses solo `onChange` para pegados grandes.

### No reconoce otra hoja

Asegúrate de que `sheets` y `gridsBySheet` tengan el mismo `id`.

```js
sheets = [{ id: 'productos', name: 'Productos' }]
gridsBySheet = { productos: productosGrid }
```

### Se pierden estilos

Cuando clones celdas, copia también `style`.

```js
{ ...cell, style: { ...(cell.style || {}) } }
```

### La vista pública no tiene las mismas herramientas

Asegúrate de que la vista pública use el mismo `ExcelGrid`, el mismo `ExcelHelpModal` y las mismas props cuando el permiso sea de edición.

---

## 21. Qué mejorar después

Pendientes razonables para el futuro:

- Virtualizar columnas además de filas si crece demasiado.
- Guardado con debounce por lotes.
- Historial de cambios por usuario.
- Validaciones por columna.
- Tipos de columna.
- Protección de rangos.
- Comentarios en celdas.
- Importación real de `.xlsx`.
- Exportación `.xlsx` más avanzada.

No hagas todo eso ahorita solo porque suena bonito. Primero usa el módulo en un caso real, detecta fricción real y luego mejoras. Sí, ejecutar antes de sobreplanear, ese viejo enemigo.

## Importante: no perder datos por virtualización

El grid renderiza solo una ventana de filas para ser rápido. Eso no significa que solo existan esas filas. Cuando reutilices el módulo:

1. Guarda siempre desde el grid completo en memoria, no desde las filas visibles.
2. Al cargar desde DB, reconstruye el grid usando todas las celdas existentes.
3. Si hay datos en una fila lejana, por ejemplo fila 500, el grid debe crecer hasta esa fila aunque las filas anteriores estén vacías.
4. Antes de recargar o cambiar de hoja, vacía los cambios pendientes con `flushPendingCellSaves` o una función equivalente.
5. Para muchas celdas, guarda en lotes. No mandes miles de celdas en una sola petición.

El módulo ya incluye esta corrección en `cellsToGrid`, `getGridDataBounds`, `getCellsDataBounds`, `saveSheetCells`, `upsertSheetCells` y `usePlaygroundWorkbook`.

## Nota sobre datos que parecen desaparecer

El motor usa virtualización para renderizar rápido. Eso significa que no pinta todas las filas a la vez, pero sí debe reconstruir el grid completo desde las celdas guardadas.

La regla correcta es:

- El render puede ser virtual.
- El guardado no debe depender de lo visible.
- La carga debe usar todas las celdas guardadas, aunque estén separadas por muchas filas vacías.

Para evitar pérdida de datos, `saveSheetCells()` usa guardado seguro:

1. Convierte el grid a celdas con contenido.
2. Hace `upsert` de esas celdas.
3. Después borra celdas antiguas que ya no existen en el grid.

No hagas `delete().eq('sheet_id', sheetId)` antes de insertar celdas nuevas, porque si el insert falla por chunk, límite, red o esquema, puedes dejar la hoja incompleta. Sí, esa era una forma muy eficiente de fabricar pánico.

## Nota importante sobre tablas importadas

No uses compactación automática para esconder filas vacías cuando los datos vienen de una fuente real como productos, clientes o pedidos. Si deberían existir 109 registros, deben cargarse los 109 registros reales desde la fuente, no mover los que sí aparecieron.

En este playground, la hoja de productos usa una reconciliación especial:

```js
reconcileProductSheetGrid(loadedGrid, productsData)
```

Esto reconstruye la tabla usando los productos reales cargados desde Supabase y evita que parezca que algunos productos se perdieron.
