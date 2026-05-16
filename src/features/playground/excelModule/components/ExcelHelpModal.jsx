import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Filter,
  HelpCircle,
  Keyboard,
  Layers,
  Lightbulb,
  ListChecks,
  MousePointer2,
  Search,
  Sigma,
  Sparkles,
  Table2,
  X,
} from 'lucide-react';

import { EXCEL_FORMULA_CATALOG } from '../excel.helpers';

const FUNCTION_PAGE_SIZE = 6;

const helpSections = [
  { id: 'inicio', label: 'Inicio rápido', icon: Lightbulb },
  { id: 'formulas', label: 'Fórmulas', icon: Sigma },
  { id: 'funciones', label: 'Funciones', icon: BookOpen },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'seleccion', label: 'Selección', icon: MousePointer2 },
  { id: 'datos', label: 'Datos', icon: Table2 },
  { id: 'errores', label: 'Errores comunes', icon: HelpCircle },
];

const functionCategories = [
  { id: 'todas', label: 'Todas', description: 'Todas las funciones disponibles.' },
  { id: 'basicas', label: 'Básicas', keywords: ['SUM', 'AVERAGE', 'AVERAGEA', 'MIN', 'MAX', 'MINA', 'MAXA', 'COUNT', 'COUNTA', 'PRODUCT', 'SUMSQ', 'AGGREGATE'], description: 'Totales, promedios, conteos y operaciones rápidas.' },
  { id: 'condicionales', label: 'Condicionales', keywords: ['IF', 'IFS', 'IFERROR', 'AND', 'OR', 'NOT', 'SUMIF', 'SUMIFS', 'COUNTIF', 'COUNTIFS', 'AVERAGEIF', 'AVERAGEIFS', 'MAXIFS', 'MINIFS'], description: 'Reglas, criterios y cálculos según condiciones.' },
  { id: 'busqueda', label: 'Búsqueda', keywords: ['VLOOKUP', 'HLOOKUP', 'XLOOKUP', 'XMATCH', 'INDEX', 'MATCH', 'CHOOSE', 'SWITCH', 'CHOOSECOLS', 'CHOOSEROWS', 'TRANSPOSE', 'HSTACK', 'VSTACK'], description: 'Cruzar tablas, buscar códigos y traer datos.' },
  { id: 'texto', label: 'Texto', keywords: ['CONCAT', 'TEXTJOIN', 'TEXTBEFORE', 'TEXTAFTER', 'TEXTSPLIT', 'LEFT', 'RIGHT', 'MID', 'LEN', 'TRIM', 'UPPER', 'LOWER', 'PROPER', 'SUBSTITUTE', 'REPLACE', 'FIND', 'SEARCH', 'TEXT', 'FIXED', 'DOLLAR', 'NUMBERVALUE', 'CHAR', 'CODE', 'UNICHAR', 'UNICODE', 'T', 'N'], description: 'Limpiar, unir, extraer y transformar texto.' },
  { id: 'fechas', label: 'Fechas', keywords: ['TODAY', 'NOW', 'DATE', 'DATEVALUE', 'TIMEVALUE', 'DAY', 'MONTH', 'YEAR', 'DAYS', 'EDATE', 'EOMONTH', 'WEEKDAY', 'WEEKNUM', 'TIME', 'HOUR', 'MINUTE', 'SECOND', 'DAYS360', 'NETWORKDAYS', 'WORKDAY', 'NETWORKDAYS.INTL', 'WORKDAY.INTL', 'YEARFRAC', 'DATEDIF', 'ISOWEEKNUM'], description: 'Fechas actuales, vencimientos, días hábiles y cortes contables.' },
  { id: 'matematicas', label: 'Matemáticas', keywords: ['ROUND', 'ROUNDUP', 'ROUNDDOWN', 'ABS', 'SQRT', 'POWER', 'MOD', 'MROUND', 'CEILING', 'FLOOR', 'CEILING.MATH', 'FLOOR.MATH', 'FACT', 'FACTDOUBLE', 'COMBIN', 'COMBINA', 'PERMUT', 'PERMUTATIONA', 'MULTINOMIAL', 'QUOTIENT', 'BASE', 'DECIMAL', 'ROMAN', 'ARABIC', 'EVEN', 'ODD', 'SIGN'], description: 'Redondeos, potencias, residuos y ajustes numéricos.' },
  { id: 'estadistica', label: 'Estadística', keywords: ['MEDIAN', 'MODE', 'RANK', 'PERCENTILE', 'QUARTILE', 'PERCENTRANK', 'PERCENTILE.INC', 'PERCENTILE.EXC', 'QUARTILE.INC', 'QUARTILE.EXC', 'PERCENTRANK.INC', 'PERCENTRANK.EXC', 'STANDARDIZE', 'NORM.DIST', 'NORM.S.DIST', 'NORM.INV', 'NORM.S.INV', 'FORECAST.LINEAR', 'FORECAST.ETS', 'SLOPE', 'INTERCEPT', 'RSQ', 'TRIMMEAN', 'COVARIANCE', 'CORREL', 'GEOMEAN', 'HARMEAN', 'FREQUENCY', 'DEVSQ', 'AVEDEV'], description: 'Análisis de listas numéricas, dispersión, correlación y distribución.' },
  { id: 'validacion', label: 'Validación', keywords: ['ISBLANK', 'ISNUMBER', 'ISTEXT', 'ISNONTEXT', 'ISLOGICAL', 'ISEVEN', 'ISODD', 'ISERROR', 'IFNA', 'ISERR', 'ISDATE', 'ISFORMULA'], description: 'Detectar vacíos, números, textos y errores.' },
  { id: 'financiera', label: 'Financiera', keywords: ['PMT', 'PV', 'FV', 'NPER', 'RATE', 'IPMT', 'PPMT', 'CUMIPMT', 'CUMPRINC', 'NPV', 'IRR', 'MIRR', 'XNPV', 'XIRR', 'EFFECT', 'NOMINAL', 'RRI', 'PDURATION', 'FVSCHEDULE', 'DISC', 'INTRATE', 'RECEIVED', 'DURATION', 'MDURATION', 'PRICEDISC', 'YIELDDISC', 'TBILLEQ', 'TBILLPRICE', 'TBILLYIELD', 'ACCRINT', 'ACCRINTM', 'COUPDAYS', 'COUPDAYBS', 'COUPDAYSNC', 'COUPNUM', 'EFFECTIVE_MONTHLY_RATE', 'EFFECTIVE_ANNUAL_RATE', 'SIMPLE_INTEREST', 'COMPOUND_INTEREST', 'FINAL_CAPITAL', 'INITIAL_CAPITAL', 'SALDO_INSOLUTO', 'PAYBACK', 'PROFIT_FACTOR', 'ISPMT', 'CAGR'], description: 'Préstamos, intereses, valor presente, bonos, inversión, flujo de efectivo y tasas.' },
  { id: 'contabilidad', label: 'Contabilidad', keywords: ['SUBTOTAL', 'SUMPRODUCT', 'COUNTBLANK', 'IVA', 'IVA16', 'IVA8', 'PRECIOCONIVA', 'SINIVA', 'IMPUESTO', 'RETENCION_IVA', 'RETENCION_ISR', 'SUBTOTAL_FACTURA', 'TOTAL_FACTURA', 'BASE_DESDE_TOTAL', 'REDONDEO_FISCAL', 'DESCUENTO', 'MONTO_DESCUENTO', 'MARGEN', 'MARKUP', 'UTILIDAD', 'UTILIDADPORC', 'COSTO_TOTAL', 'VENTA_TOTAL', 'PUNTOEQUILIBRIO', 'DIFERENCIA', 'CONCILIADO', 'SALDO', 'DEUDOR_ACREEDOR', 'VARIACION', 'VARIACIONPORC', 'PORCENTAJE', 'PROMEDIO_PONDERADO', 'COSTO_PROMEDIO', 'MARGEN_BRUTO', 'MARGEN_OPERATIVO', 'MARGEN_NETO', 'EBITDA', 'EBITDA_MARGEN', 'CAPITAL_TRABAJO', 'APALANCAMIENTO', 'COBERTURA_INTERESES', 'CICLO_CONVERSION_EFECTIVO', 'DIO', 'DPO', 'DIASCARTERA', 'RAZONCORRIENTE', 'PRUEBAACIDA', 'ENDEUDAMIENTO', 'ROI', 'ROA', 'ROE', 'VENCIDO', 'DIAS_VENCIDO', 'ANTIGUEDAD_CARTERA', 'PROVISION_CARTERA', 'INTERES_MORATORIO', 'DESCUENTO_PRONTO_PAGO', 'NOMINA_NETA', 'COMISION', 'PRESUPUESTO_VARIACION', 'PRESUPUESTO_VARIACION_PORC', 'IVA_POR_PAGAR', 'IVA_TRASLADADO', 'IVA_ACREDITABLE', 'HONORARIOS_NETO', 'ISR_PROVISIONAL', 'CONTRIBUCION_UNITARIA', 'MARGEN_CONTRIBUCION', 'PUNTO_EQUILIBRIO_VENTAS', 'SALDO_FINAL', 'CUADRA_DEBE_HABER', 'CONCILIACION_BANCARIA', 'DSO', 'INVENTORY_TURNOVER', 'ASSET_TURNOVER', 'DEBT_TO_EQUITY', 'GROSS_PROFIT', 'OPERATING_PROFIT', 'NET_PROFIT', 'BREAK_EVEN_UNITS', 'SAFETY_MARGIN', 'PRORATE', 'ALLOCATE_BY_WEIGHT', 'AGING_BUCKET'], description: 'Impuestos, CFDI, retenciones, conciliación, cartera, márgenes, presupuesto, liquidez y razones financieras.' },
  { id: 'depreciacion', label: 'Depreciación', keywords: ['SLN', 'SYD', 'DDB', 'DB', 'DEPRECIACION_MENSUAL', 'DEPRECIACION_ACUMULADA', 'VALOR_LIBROS'], description: 'Depreciación lineal, suma de dígitos y saldo decreciente.' },
];

const shortcutGroups = [
  {
    title: 'Navegación y selección',
    description: 'Moverse por la hoja, seleccionar rangos y evitar depender del mouse para todo, avance histórico para la especie.',
    rows: [
      ['Flechas', 'Mueve la celda activa una posición arriba, abajo, izquierda o derecha.'],
      ['Shift + flechas', 'Extiende la selección desde el punto inicial hasta la nueva celda activa.'],
      ['Ctrl/Cmd + flechas', 'Salta al borde del bloque de datos o al límite de la hoja.'],
      ['Ctrl/Cmd + Shift + flechas', 'Extiende la selección hasta el borde del bloque de datos.'],
      ['Home', 'Va al inicio de la fila actual.'],
      ['End', 'Va al final de la fila actual.'],
      ['Ctrl/Cmd + Home', 'Va a la primera celda de la hoja.'],
      ['Ctrl/Cmd + End', 'Va a la última celda cargada.'],
      ['Shift + Home / End', 'Selecciona desde la celda activa hasta el inicio o final de la fila.'],
      ['Ctrl/Cmd + Shift + Home / End', 'Selecciona desde la celda activa hasta el inicio o final de la hoja.'],
      ['Page Up / Page Down', 'Mueve la vista por bloques grandes de filas.'],
      ['Shift + Page Up / Page Down', 'Extiende la selección por bloques grandes.'],
      ['Rueda del mouse', 'Hace scroll vertical dentro de la hoja.'],
      ['Shift + rueda del mouse', 'Hace scroll horizontal dentro de la hoja, útil cuando no quieres buscar la barra inferior como arqueólogo.'],
      ['Ctrl/Cmd + A', 'Selecciona toda la hoja cargada.'],
      ['Ctrl/Cmd + Espacio', 'Selecciona toda la columna activa.'],
      ['Shift + Espacio', 'Selecciona toda la fila activa.'],
    ],
  },
  {
    title: 'Edición de celdas',
    description: 'Editar, confirmar, cancelar y guardar valores sin pelearte con cada celda.',
    rows: [
      ['F2', 'Edita la celda activa sin borrar su contenido.'],
      ['Enter', 'Confirma la edición y baja una fila. Si hay sugerencia de fórmula activa, la inserta.'],
      ['Shift + Enter', 'Confirma la edición y sube una fila.'],
      ['Tab', 'Confirma la edición y avanza a la derecha. Si hay sugerencia, la inserta.'],
      ['Shift + Tab', 'Confirma la edición y avanza a la izquierda.'],
      ['Escape', 'Cierra sugerencias de fórmula o cancela la edición actual.'],
      ['Delete / Backspace', 'Limpia el contenido de la selección.'],
      ['Ctrl/Cmd + Z', 'Deshace el último cambio registrado.'],
      ['Ctrl/Cmd + Y', 'Rehace el último cambio deshecho.'],
      ['Ctrl/Cmd + Shift + Z', 'Rehace el último cambio deshecho, alternativa común en apps modernas.'],
      ['Ctrl/Cmd + S', 'Guarda la hoja actual.'],
      ['Ctrl/Cmd + ;', 'Inserta la fecha actual.'],
      ['Ctrl/Cmd + Shift + :', 'Inserta la hora actual.'],
      ['Alt + Enter', 'Agrega un salto de línea dentro de la celda mientras editas.'],
    ],
  },
  {
    title: 'Copiar, pegar y rellenar',
    description: 'Mover datos entre celdas, pegar desde Excel/Sheets y rellenar rangos sin dramas innecesarios.',
    rows: [
      ['Ctrl/Cmd + C', 'Copia la selección como tabla.'],
      ['Ctrl/Cmd + X', 'Corta la selección.'],
      ['Ctrl/Cmd + V', 'Pega desde Excel, Google Sheets o texto tabulado.'],
      ['Ctrl/Cmd + D', 'Rellena hacia abajo tomando como base la primera fila seleccionada.'],
      ['Ctrl/Cmd + R', 'Rellena hacia la derecha tomando como base la primera columna seleccionada.'],
      ['Ctrl/Cmd + Shift + D', 'Rellena hacia arriba.'],
      ['Ctrl/Cmd + Shift + R', 'Rellena hacia la izquierda.'],
      ['Arrastrar esquina inferior derecha', 'Copia valores o continúa series numéricas.'],
    ],
  },
  {
    title: 'Formato visual',
    description: 'Dar formato sin convertir la hoja en una feria de colores, tentación humana muy real.',
    rows: [
      ['Ctrl/Cmd + B', 'Activa o desactiva negrita.'],
      ['Ctrl/Cmd + I', 'Activa o desactiva cursiva.'],
      ['Ctrl/Cmd + U', 'Activa o desactiva subrayado.'],
      ['Ctrl/Cmd + Shift + F', 'Limpia formato de la selección.'],
      ['Ctrl/Cmd + Shift + U', 'Convierte texto seleccionado a MAYÚSCULAS.'],
      ['Ctrl/Cmd + Shift + L', 'Convierte texto seleccionado a minúsculas.'],
      ['Ctrl/Cmd + Shift + E', 'Limpia espacios extra del texto seleccionado.'],
      ['Ctrl/Cmd + Shift + N', 'Convierte texto seleccionado a Nombre Propio.'],
      ['Ctrl/Cmd + Alt + 0', 'Autoajusta filas y columnas seleccionadas.'],
      ['Ctrl/Cmd + Alt + 1', 'Alinea la selección a la izquierda.'],
      ['Ctrl/Cmd + Alt + 2', 'Alinea la selección al centro.'],
      ['Ctrl/Cmd + Alt + 3', 'Alinea la selección a la derecha.'],
      ['Ctrl/Cmd + Alt + 4', 'Aplica negrita a la selección.'],
      ['Ctrl/Cmd + Alt + 5', 'Aplica cursiva a la selección.'],
      ['Ctrl/Cmd + Alt + 6', 'Aplica subrayado a la selección.'],
      ['Ctrl/Cmd + Alt + 7', 'Reduce 1px el tamaño de fuente.'],
      ['Ctrl/Cmd + Alt + 8', 'Aumenta 1px el tamaño de fuente.'],
      ['Ctrl/Cmd + Alt + 9', 'Regresa la fuente a 14px.'],
      ['Ctrl/Cmd + Alt + H', 'Limpia contenido de la selección sin tocar formato.'],
      ['Ctrl/Cmd + Alt + D', 'Inserta fecha actual en la selección.'],
      ['Ctrl/Cmd + Alt + P', 'Convierte texto seleccionado a Nombre Propio.'],
      ['Ctrl/Cmd + Alt + E', 'Limpia espacios extra de la selección.'],
      ['Doble click en borde de columna', 'Autoajusta el ancho de la columna al contenido visible.'],
      ['Doble click en borde de fila', 'Autoajusta el alto de la fila al contenido visible.'],
    ],
  },
  {
    title: 'Fórmulas y funciones',
    description: 'Crear fórmulas, insertar funciones, seleccionar rangos y usar referencias entre hojas.',
    rows: [
      ['=', 'Inicia una fórmula y abre recomendaciones de funciones.'],
      ['Flecha arriba / abajo', 'Navega entre sugerencias de función.'],
      ['Enter / Tab en sugerencia', 'Inserta la función sugerida.'],
      ['Click en sugerencia', 'Inserta la función sugerida con el mouse.'],
      ['Click en celda editando fórmula', 'Inserta una referencia como A1.'],
      ['Arrastrar celdas editando fórmula', 'Inserta un rango como A1:B5.'],
      ['F4 editando fórmula', 'Convierte la última referencia A1 en referencia absoluta $A$1.'],
      ['Ctrl/Cmd + `', 'Alterna entre ver valores calculados y ver fórmulas.'],
      ['Alt + =', 'Autosuma inteligente sobre el rango cercano.'],
      ['Alt + S', 'Inicia =SUM(.'],
      ['Alt + A', 'Inicia =AVERAGE(.'],
      ['Alt + M', 'Inicia =MAX(.'],
      ['Alt + N', 'Inicia =MIN(.'],
      ['Alt + C', 'Inicia =COUNT(.'],
      ['Alt + I', 'Inicia =IF(.'],
      ['Alt + V', 'Inicia =VLOOKUP(.'],
      ['Alt + X', 'Inicia =XLOOKUP(.'],
      ['Alt + P', 'Inicia =PMT(.'],
      ['Alt + K', 'Inicia =IVA(.'],
      ['Alt + T', 'Inicia =TEXTJOIN(.'],
      ['Alt + F', 'Inicia =FILTER(.'],
      ['Alt + R', 'Inicia =ROUND(.'],
      ['Alt + U', 'Inicia =SUMIF(.'],
      ['Alt + O', 'Inicia =COUNTIF(.'],
      ['Alt + G', 'Inicia =AVERAGEIF(.'],
      ['Alt + D', 'Inicia =TODAY(.'],
      ['Alt + H', 'Inicia =NOW(.'],
      ['Alt + E', 'Inicia =IFERROR(.'],
      ['Alt + Q', 'Inicia =SUMIFS(.'],
      ['Alt + Y', 'Inicia =YEARFRAC(.'],
      ['Alt + J', 'Inicia =INDEX(.'],
      ['Alt + L', 'Inicia =XLOOKUP(.'],
      ['Alt + B', 'Inicia =SUBTOTAL(.'],
      ['Alt + Z', 'Inicia =SUMPRODUCT(.'],
      ['Alt + W', 'Inicia =WORKDAY(.'],
      ['Ctrl/Cmd + Shift + S', 'Inicia =SUM(.'],
      ['Ctrl/Cmd + Shift + A', 'Inicia =AVERAGE(.'],
      ['Ctrl/Cmd + Shift + M', 'Inicia =MAX(.'],
      ['Ctrl/Cmd + Shift + C', 'Inicia =COUNT(.'],
      ['Ctrl/Cmd + Shift + P', 'Inicia =PRODUCT(.'],
      ['Ctrl/Cmd + Shift + I', 'Inicia =IF(.'],
      ['Ctrl/Cmd + Shift + V', 'Inicia =VLOOKUP(.'],
      ['Ctrl/Cmd + Shift + X', 'Inicia =XLOOKUP(.'],
      ['Ctrl/Cmd + Shift + K', 'Inicia =IVA(.'],
      ['Ctrl/Cmd + Shift + W', 'Inicia =PMT(.'],
      ['Ctrl/Cmd + Shift + B', 'Inicia =BUSCARV(.'],
      ['Ctrl/Cmd + Shift + Y', 'Inicia =YEARFRAC(.'],
      ['Ctrl/Cmd + Shift + D', 'Inicia =DAYS360(.'],
      ['Ctrl/Cmd + Shift + R', 'Inicia =ROUND(.'],
      ['Ctrl/Cmd + Shift + N', 'Inicia =NETWORKDAYS(.'],
      ['Ctrl/Cmd + Shift + E', 'Inicia =EOMONTH(.'],
      ['Ctrl/Cmd + Shift + L', 'Inicia =UTILIDAD(.'],
      ['Ctrl/Cmd + Alt + F', 'Inicia =TOTAL_FACTURA(.'],
      ['Ctrl/Cmd + Alt + K', 'Inicia =IVA16(.'],
      ['Ctrl/Cmd + Alt + R', 'Inicia =RETENCION_ISR(.'],
      ['Ctrl/Cmd + Alt + T', 'Inicia =RETENCION_IVA(.'],
      ['Ctrl/Cmd + Shift + Q', 'Inicia =SUMIFS(.'],
      ['Ctrl/Cmd + Shift + T', 'Inicia =TEXTJOIN(.'],
      ['Ctrl/Cmd + Shift + O', 'Inicia =COUNTIFS(.'],
      ['Ctrl/Cmd + Shift + G', 'Inicia =AVERAGEIFS(.'],
      ['Ctrl/Cmd + Shift + H', 'Inicia =HLOOKUP(.'],
      ['Ctrl/Cmd + Shift + J', 'Inicia =INDEX(.'],
      ['Ctrl/Cmd + Shift + 1', 'Inicia =SUBTOTAL(.'],
      ['Ctrl/Cmd + Shift + 2', 'Inicia =SUMPRODUCT(.'],
      ['Ctrl/Cmd + Shift + 3', 'Inicia =SUMIF(.'],
      ['Ctrl/Cmd + Shift + 4', 'Inicia =COUNTIF(.'],
      ['Ctrl/Cmd + Shift + 5', 'Inicia =AVERAGEIF(.'],
      ['Ctrl/Cmd + Shift + 6', 'Inicia =SUMIFS(.'],
      ['Ctrl/Cmd + Shift + 7', 'Inicia =COUNTIFS(.'],
      ['Ctrl/Cmd + Shift + 8', 'Inicia =AVERAGEIFS(.'],
      ['Ctrl/Cmd + Shift + 9', 'Inicia =IFERROR(.'],
      ['Ctrl/Cmd + Alt + S', 'Envuelve la selección con SUM.'],
      ['Ctrl/Cmd + Alt + A', 'Envuelve la selección con AVERAGE.'],
      ['Ctrl/Cmd + Alt + M', 'Envuelve la selección con MAX.'],
      ['Ctrl/Cmd + Alt + N', 'Envuelve la selección con MIN.'],
      ['Ctrl/Cmd + Alt + I', 'Envuelve la selección con IFERROR.'],
      ['Ctrl/Cmd + Alt + O', 'Envuelve la selección con XLOOKUP.'],
      ['Ctrl/Cmd + Alt + U', 'Envuelve la selección con UPPER.'],
      ['Ctrl/Cmd + Alt + L', 'Envuelve la selección con LOWER.'],
      ['Alt + Shift + I', 'Inicia =IVA16(.'],
      ['Alt + Shift + R', 'Inicia =RETENCION_ISR(.'],
      ['Alt + Shift + T', 'Inicia =RETENCION_IVA(.'],
      ['Alt + Shift + F', 'Inicia =TOTAL_FACTURA(.'],
      ['Alt + Shift + C', 'Inicia =CONCILIADO(.'],
      ['Alt + Shift + D', 'Inicia =DIAS_VENCIDO(.'],
      ['Alt + Shift + V', 'Inicia =VARIACIONPORC(.'],
      ['Alt + Shift + P', 'Inicia =PRESUPUESTO_VARIACION(.'],
      ['Alt + Shift + G', 'Inicia =MARGEN_BRUTO(.'],
      ['Alt + Shift + E', 'Inicia =EBITDA(.'],
      ['Alt + Shift + L', 'Inicia =DEPRECIACION_MENSUAL(.'],
      ['Ctrl/Cmd + Alt + Shift + 1', 'Inicia =IVA_POR_PAGAR(.'],
      ['Ctrl/Cmd + Alt + Shift + 2', 'Inicia =HONORARIOS_NETO(.'],
      ['Ctrl/Cmd + Alt + Shift + 3', 'Inicia =ISR_PROVISIONAL(.'],
      ['Ctrl/Cmd + Alt + Shift + 4', 'Inicia =CONTRIBUCION_UNITARIA(.'],
      ['Ctrl/Cmd + Alt + Shift + 5', 'Inicia =MARGEN_CONTRIBUCION(.'],
      ['Ctrl/Cmd + Alt + Shift + 6', 'Inicia =PUNTO_EQUILIBRIO_VENTAS(.'],
      ['Ctrl/Cmd + Alt + Shift + 7', 'Inicia =SALDO_INSOLUTO(.'],
      ['Ctrl/Cmd + Alt + Shift + 8', 'Inicia =INTERES_SIMPLE(.'],
      ['Ctrl/Cmd + Alt + Shift + 9', 'Inicia =INTERES_COMPUESTO(.'],
      ['Ctrl/Cmd + Alt + Shift + 0', 'Inicia =CUADRA_DEBE_HABER(.'],
      ['Ctrl/Cmd + Alt + Shift + A', 'Inicia =ACCRINT(.'],
      ['Ctrl/Cmd + Alt + Shift + B', 'Inicia =BASE_DESDE_TOTAL(.'],
      ['Ctrl/Cmd + Alt + Shift + C', 'Inicia =CAGR(.'],
      ['Ctrl/Cmd + Alt + Shift + D', 'Inicia =DEPRECIACION_ACUMULADA(.'],
      ['Ctrl/Cmd + Alt + Shift + E', 'Inicia =EFFECT(.'],
      ['Ctrl/Cmd + Alt + Shift + F', 'Inicia =FV(.'],
      ['Ctrl/Cmd + Alt + Shift + G', 'Inicia =GROSS_PROFIT(.'],
      ['Ctrl/Cmd + Alt + Shift + I', 'Inicia =IPMT(.'],
      ['Ctrl/Cmd + Alt + Shift + M', 'Inicia =MIRR(.'],
      ['Ctrl/Cmd + Alt + Shift + N', 'Inicia =NPV(.'],
      ['Ctrl/Cmd + Alt + Shift + O', 'Inicia =OPERATING_PROFIT(.'],
      ['Ctrl/Cmd + Alt + Shift + P', 'Inicia =PPMT(.'],
      ['Ctrl/Cmd + Alt + Shift + Q', 'Inicia =QUOTIENT(.'],
      ['Ctrl/Cmd + Alt + Shift + R', 'Inicia =RATE(.'],
      ['Ctrl/Cmd + Alt + Shift + S', 'Inicia =SLN(.'],
      ['Ctrl/Cmd + Alt + Shift + T', 'Inicia =TEXT(.'],
      ['Ctrl/Cmd + Alt + Shift + U', 'Inicia =UNIQUE(.'],
      ['Ctrl/Cmd + Alt + Shift + V', 'Inicia =PV(.'],
      ['Ctrl/Cmd + Alt + Shift + W', 'Inicia =WORKDAY.INTL(.'],
      ['Ctrl/Cmd + Alt + Shift + X', 'Inicia =XIRR(.'],
      ['Ctrl/Cmd + Alt + Shift + Y', 'Inicia =XNPV(.'],
      ['Ctrl/Cmd + Alt + Shift + Z', 'Inicia =MATCH(.'],
      ['Alt + Shift + 1', 'Inicia =FACT(.'],
      ['Alt + Shift + 2', 'Inicia =COMBIN(.'],
      ['Alt + Shift + 3', 'Inicia =PERMUT(.'],
      ['Alt + Shift + 4', 'Inicia =WEIGHTED_AVERAGE(.'],
      ['Alt + Shift + 5', 'Inicia =RUNNING_TOTAL(.'],
      ['Alt + Shift + 6', 'Inicia =SEQUENCE(.'],
      ['Alt + Shift + 7', 'Inicia =TEXTBEFORE(.'],
      ['Alt + Shift + 8', 'Inicia =TEXTAFTER(.'],
      ['Alt + Shift + 9', 'Inicia =TOCOL(.'],
      ['Alt + Shift + 0', 'Inicia =TOROW(.'],
    ],
  },
];

const functionDetails = {
  SUM: { category: 'Básicas', use: 'Suma números, celdas o rangos completos.', example: '=SUM(D2:D100)', result: 'Suma todos los valores numéricos entre D2 y D100.', tips: ['Ignora textos dentro del rango.', 'Puedes mezclar rangos y números: =SUM(A1:A10,25).'] },
  AVERAGE: { category: 'Básicas', use: 'Calcula el promedio de números o rangos.', example: '=AVERAGE(D2:D100)', result: 'Devuelve el promedio de los valores numéricos.', tips: ['Ignora celdas vacías.', 'PROMEDIO funciona como alias en español.'] },
  MIN: { category: 'Básicas', use: 'Devuelve el número más pequeño.', example: '=MIN(D2:D100)', result: 'Encuentra el menor valor del rango.', tips: ['Útil para precios mínimos o fechas más antiguas.'] },
  MAX: { category: 'Básicas', use: 'Devuelve el número más grande.', example: '=MAX(D2:D100)', result: 'Encuentra el mayor valor del rango.', tips: ['Útil para precios máximos o totales más altos.'] },
  COUNT: { category: 'Básicas', use: 'Cuenta solo celdas numéricas.', example: '=COUNT(D2:D100)', result: 'Devuelve cuántos valores numéricos hay.', tips: ['No cuenta texto.', 'Para contar texto o cualquier dato usa COUNTA.'] },
  COUNTA: { category: 'Básicas', use: 'Cuenta celdas no vacías.', example: '=COUNTA(C2:C100)', result: 'Cuenta nombres, números, fechas o textos.', tips: ['Sirve para saber cuántas filas tienen datos.'] },
  PRODUCT: { category: 'Básicas', use: 'Multiplica números o rangos.', example: '=PRODUCT(A2,B2)', result: 'Multiplica A2 por B2.', tips: ['También puedes usar =A2*B2.'] },
  IF: { category: 'Condicionales', use: 'Devuelve un valor si una condición es verdadera y otro si es falsa.', example: '=IF(D2>0,"Disponible","Sin cantidad")', result: 'Muestra Disponible si D2 es mayor que cero.', tips: ['SI funciona como alias.', 'Los textos deben ir entre comillas.'] },
  IFS: { category: 'Condicionales', use: 'Evalúa varias condiciones en orden.', example: '=IFS(D2>100,"Alto",D2>50,"Medio",TRUE,"Bajo")', result: 'Devuelve el primer resultado cuya condición se cumpla.', tips: ['Agrega TRUE al final como caso por defecto.'] },
  IFERROR: { category: 'Condicionales', use: 'Muestra un respaldo cuando una fórmula da error.', example: '=IFERROR(A2/B2,0)', result: 'Si B2 es cero o hay error, devuelve 0.', tips: ['Muy útil con búsquedas como VLOOKUP/XLOOKUP.'] },
  SUMIF: { category: 'Condicionales', use: 'Suma valores que cumplen un criterio.', example: '=SUMIF(C:C,"Limpieza",D:D)', result: 'Suma D:D cuando C:C dice Limpieza.', tips: ['El rango de criterio y suma deben tener tamaños compatibles.'] },
  SUMIFS: { category: 'Condicionales', use: 'Suma usando varios criterios.', example: '=SUMIFS(D:D,C:C,"Limpieza",F:F,"Activo")', result: 'Suma D:D si categoría es Limpieza y estado Activo.', tips: ['Primero va el rango a sumar, luego pares rango/criterio.'] },
  COUNTIF: { category: 'Condicionales', use: 'Cuenta celdas que cumplen un criterio.', example: '=COUNTIF(F:F,"Activo")', result: 'Cuenta cuántas filas tienen Activo.', tips: ['Acepta criterios como ">=10".'] },
  COUNTIFS: { category: 'Condicionales', use: 'Cuenta usando varios criterios.', example: '=COUNTIFS(F:F,"Activo",C:C,"Limpieza")', result: 'Cuenta filas activas de categoría Limpieza.', tips: ['Usa pares de rango y criterio.'] },
  AVERAGEIF: { category: 'Condicionales', use: 'Promedia valores que cumplen un criterio.', example: '=AVERAGEIF(C:C,"Limpieza",D:D)', result: 'Promedia D:D donde C:C sea Limpieza.', tips: ['Si no pasas rango promedio, promedia el rango del criterio.'] },
  AVERAGEIFS: { category: 'Condicionales', use: 'Promedia usando varios criterios.', example: '=AVERAGEIFS(D:D,C:C,"Limpieza",F:F,"Activo")', result: 'Promedia precios activos de Limpieza.', tips: ['Primero va el rango a promediar.'] },
  MAXIFS: { category: 'Condicionales', use: 'Obtiene el máximo que cumple criterios.', example: '=MAXIFS(D:D,C:C,"Limpieza")', result: 'Devuelve el precio más alto de Limpieza.', tips: ['Sirve para detectar máximos por categoría.'] },
  MINIFS: { category: 'Condicionales', use: 'Obtiene el mínimo que cumple criterios.', example: '=MINIFS(D:D,C:C,"Limpieza")', result: 'Devuelve el precio más bajo de Limpieza.', tips: ['Sirve para mínimos por categoría o estado.'] },
  ROUND: { category: 'Matemáticas', use: 'Redondea a cierta cantidad de decimales.', example: '=ROUND((D2-E2)/D2*100,2)', result: 'Calcula utilidad con 2 decimales.', tips: ['REDONDEAR funciona como alias.'] },
  ROUNDUP: { category: 'Matemáticas', use: 'Redondea hacia arriba.', example: '=ROUNDUP(D2,0)', result: 'Sube D2 al entero superior.', tips: ['Útil para precios que no quieres dejar abajo.'] },
  ROUNDDOWN: { category: 'Matemáticas', use: 'Redondea hacia abajo.', example: '=ROUNDDOWN(D2,0)', result: 'Baja D2 al entero inferior.', tips: ['Útil para truncar decimales sin redondear normal.'] },
  ABS: { category: 'Matemáticas', use: 'Devuelve el valor absoluto.', example: '=ABS(A2)', result: 'Si A2 es -50, devuelve 50.', tips: ['Útil para diferencias sin importar signo.'] },
  SQRT: { category: 'Matemáticas', use: 'Calcula raíz cuadrada.', example: '=SQRT(A2)', result: 'Devuelve la raíz cuadrada de A2.', tips: ['RAIZ funciona como alias.'] },
  POWER: { category: 'Matemáticas', use: 'Eleva un número a una potencia.', example: '=POWER(A2,2)', result: 'Eleva A2 al cuadrado.', tips: ['También puedes usar =A2^2.'] },
  MOD: { category: 'Matemáticas', use: 'Devuelve el residuo de una división.', example: '=MOD(A2,2)', result: 'Devuelve 0 si A2 es par.', tips: ['Útil para alternar filas o validar múltiplos.'] },
  MROUND: { category: 'Matemáticas', use: 'Redondea al múltiplo más cercano.', example: '=MROUND(D2,5)', result: 'Redondea D2 al múltiplo de 5 más cercano.', tips: ['Bueno para precios en múltiplos comerciales.'] },
  CEILING: { category: 'Matemáticas', use: 'Redondea hacia arriba al múltiplo indicado.', example: '=CEILING(D2,5)', result: 'Sube D2 al siguiente múltiplo de 5.', tips: ['TECHO funciona como alias.'] },
  FLOOR: { category: 'Matemáticas', use: 'Redondea hacia abajo al múltiplo indicado.', example: '=FLOOR(D2,5)', result: 'Baja D2 al múltiplo de 5 anterior.', tips: ['PISO funciona como alias.'] },
  EVEN: { category: 'Matemáticas', use: 'Redondea al entero par superior.', example: '=EVEN(A2)', result: 'Devuelve el siguiente número par.', tips: ['PAR funciona como alias.'] },
  ODD: { category: 'Matemáticas', use: 'Redondea al entero impar superior.', example: '=ODD(A2)', result: 'Devuelve el siguiente número impar.', tips: ['IMPAR funciona como alias.'] },
  SIGN: { category: 'Matemáticas', use: 'Devuelve el signo de un número.', example: '=SIGN(A2)', result: 'Devuelve -1, 0 o 1.', tips: ['Sirve para detectar negativos, ceros o positivos.'] },
  MEDIAN: { category: 'Estadística', use: 'Obtiene el valor central de una lista.', example: '=MEDIAN(D2:D100)', result: 'Devuelve la mediana.', tips: ['Menos sensible a valores extremos que AVERAGE.'] },
  MODE: { category: 'Estadística', use: 'Obtiene el valor que más se repite.', example: '=MODE(D2:D100)', result: 'Devuelve la moda.', tips: ['Útil si se repiten muchos precios/cantidades.'] },
  RANK: { category: 'Estadística', use: 'Devuelve la posición de un número dentro de una lista.', example: '=RANK(D2,D:D,0)', result: 'Indica qué lugar ocupa D2 de mayor a menor.', tips: ['Usa 0 para descendente, 1 para ascendente.'] },
  PERCENTILE: { category: 'Estadística', use: 'Calcula un percentil.', example: '=PERCENTILE(D2:D100,0.9)', result: 'Devuelve el percentil 90.', tips: ['k debe ir de 0 a 1.'] },
  QUARTILE: { category: 'Estadística', use: 'Calcula cuartiles.', example: '=QUARTILE(D2:D100,1)', result: 'Devuelve el primer cuartil.', tips: ['Usa 1, 2 o 3 para Q1, Q2, Q3.'] },
  VLOOKUP: { category: 'Búsqueda', use: 'Busca un valor en la primera columna de una tabla y devuelve otra columna.', example: '=VLOOKUP("WAL-30E045",A:E,3,FALSE)', result: 'Busca el código y devuelve la columna 3.', tips: ['El valor buscado debe estar en la primera columna del rango.', 'Si no, usa XLOOKUP.'] },
  HLOOKUP: { category: 'Búsqueda', use: 'Busca horizontalmente en la primera fila de una tabla.', example: '=HLOOKUP("Precio",A1:E10,2,FALSE)', result: 'Busca Precio en la primera fila y devuelve la fila 2.', tips: ['Es como VLOOKUP, pero por filas.'] },
  XLOOKUP: { category: 'Búsqueda', use: 'Busca en un rango y devuelve el valor correspondiente de otro rango.', example: '=XLOOKUP("WAL-30E045",B:B,C:C,"No encontrado")', result: 'Busca código en B:B y devuelve nombre de C:C.', tips: ['Más flexible que VLOOKUP.', 'No necesita que el código esté en la primera columna de una tabla.'] },
  INDEX: { category: 'Búsqueda', use: 'Devuelve un valor por posición de fila y columna.', example: '=INDEX(A1:D10,2,3)', result: 'Devuelve la fila 2, columna 3 del rango.', tips: ['Se combina muy bien con MATCH.'] },
  MATCH: { category: 'Búsqueda', use: 'Devuelve la posición de un valor dentro de un rango.', example: '=MATCH("WAL-30E045",B:B,0)', result: 'Devuelve la posición del código en B:B.', tips: ['Usa 0 para coincidencia exacta.'] },
  CHOOSE: { category: 'Búsqueda', use: 'Elige un valor según un índice.', example: '=CHOOSE(2,"Bajo","Medio","Alto")', result: 'Devuelve Medio.', tips: ['El índice inicia en 1.'] },
  SWITCH: { category: 'Búsqueda', use: 'Compara un valor contra varios casos.', example: '=SWITCH(F2,"A","Activo","I","Inactivo","Otro")', result: 'Devuelve resultado según el valor de F2.', tips: ['El último valor puede ser el default.'] },
  CONCAT: { category: 'Texto', use: 'Une textos.', example: '=CONCAT(B2," - ",C2)', result: 'Une código y nombre.', tips: ['Para separadores más limpios, usa TEXTJOIN.'] },
  TEXTJOIN: { category: 'Texto', use: 'Une textos usando un separador.', example: '=TEXTJOIN(" - ",TRUE,B2:C2)', result: 'Une B2 y C2 con guion.', tips: ['TRUE ignora celdas vacías.'] },
  LEFT: { category: 'Texto', use: 'Extrae caracteres desde la izquierda.', example: '=LEFT(B2,3)', result: 'Devuelve los primeros 3 caracteres.', tips: ['Útil para prefijos de códigos.'] },
  RIGHT: { category: 'Texto', use: 'Extrae caracteres desde la derecha.', example: '=RIGHT(B2,4)', result: 'Devuelve los últimos 4 caracteres.', tips: ['Útil para terminaciones de SKU.'] },
  MID: { category: 'Texto', use: 'Extrae texto desde una posición.', example: '=MID(B2,5,3)', result: 'Desde el carácter 5 toma 3 caracteres.', tips: ['EXTRAE funciona como alias.'] },
  LEN: { category: 'Texto', use: 'Cuenta caracteres de un texto.', example: '=LEN(C2)', result: 'Devuelve la longitud del texto.', tips: ['LARGO funciona como alias.'] },
  TRIM: { category: 'Texto', use: 'Quita espacios extra.', example: '=TRIM(C2)', result: 'Limpia espacios dobles y bordes.', tips: ['Útil cuando pegas datos de otras fuentes.'] },
  UPPER: { category: 'Texto', use: 'Convierte texto a mayúsculas.', example: '=UPPER(C2)', result: 'Devuelve el texto en MAYÚSCULAS.', tips: ['MAYUSC funciona como alias.'] },
  LOWER: { category: 'Texto', use: 'Convierte texto a minúsculas.', example: '=LOWER(C2)', result: 'Devuelve el texto en minúsculas.', tips: ['MINUSC funciona como alias.'] },
  PROPER: { category: 'Texto', use: 'Convierte texto a Nombre Propio.', example: '=PROPER(C2)', result: 'Cada palabra inicia con mayúscula.', tips: ['NOMPROPIO funciona como alias.'] },
  SUBSTITUTE: { category: 'Texto', use: 'Sustituye partes de un texto.', example: '=SUBSTITUTE(C2,"lts","litros")', result: 'Reemplaza lts por litros.', tips: ['No depende de posición, busca coincidencias.'] },
  REPLACE: { category: 'Texto', use: 'Reemplaza texto según posición.', example: '=REPLACE(B2,1,3,"WAL")', result: 'Cambia los primeros 3 caracteres por WAL.', tips: ['Útil con códigos con estructura fija.'] },
  FIND: { category: 'Texto', use: 'Encuentra texto exacto y distingue mayúsculas.', example: '=FIND("Galon",C2)', result: 'Devuelve la posición donde empieza Galon.', tips: ['Si no encuentra, devuelve error.'] },
  SEARCH: { category: 'Texto', use: 'Encuentra texto sin distinguir mayúsculas.', example: '=SEARCH("galon",C2)', result: 'Encuentra galon aunque esté como Galon.', tips: ['Más flexible que FIND.'] },
  TODAY: { category: 'Fechas', use: 'Devuelve la fecha actual.', example: '=TODAY()', result: 'Muestra la fecha de hoy.', tips: ['No necesita argumentos.'] },
  NOW: { category: 'Fechas', use: 'Devuelve fecha y hora actual.', example: '=NOW()', result: 'Muestra fecha y hora.', tips: ['No necesita argumentos.'] },
  DATE: { category: 'Fechas', use: 'Crea una fecha con año, mes y día.', example: '=DATE(2026,5,16)', result: 'Devuelve 16/05/2026.', tips: ['FECHA funciona como alias.'] },
  EDATE: { category: 'Fechas', use: 'Suma o resta meses a una fecha.', example: '=EDATE(A2,1)', result: 'Devuelve un mes después de A2.', tips: ['Usa números negativos para restar meses.'] },
  EOMONTH: { category: 'Fechas', use: 'Obtiene el último día del mes.', example: '=EOMONTH(A2,0)', result: 'Último día del mes de A2.', tips: ['FIN.MES funciona como alias.'] },
  WEEKDAY: { category: 'Fechas', use: 'Devuelve el día de la semana.', example: '=WEEKDAY(A2)', result: 'Devuelve un número de día.', tips: ['DIASEM funciona como alias.'] },
  WEEKNUM: { category: 'Fechas', use: 'Devuelve el número de semana.', example: '=WEEKNUM(A2)', result: 'Devuelve la semana aproximada del año.', tips: ['NUM.DE.SEMANA funciona como alias.'] },
  HOUR: { category: 'Fechas', use: 'Extrae la hora de un valor de tiempo.', example: '=HOUR(A2)', result: 'Devuelve la hora.', tips: ['HORA funciona como alias.'] },
  MINUTE: { category: 'Fechas', use: 'Extrae minutos de un valor de tiempo.', example: '=MINUTE(A2)', result: 'Devuelve los minutos.', tips: ['MINUTO funciona como alias.'] },
  SECOND: { category: 'Fechas', use: 'Extrae segundos de un valor de tiempo.', example: '=SECOND(A2)', result: 'Devuelve los segundos.', tips: ['SEGUNDO funciona como alias.'] },
  AND: { category: 'Lógicas', use: 'Devuelve verdadero si todas las condiciones se cumplen.', example: '=AND(D2>0,F2="Activo")', result: 'Verdadero si hay cantidad y está activo.', tips: ['Y funciona como alias.'] },
  OR: { category: 'Lógicas', use: 'Devuelve verdadero si al menos una condición se cumple.', example: '=OR(F2="Activo",F2="Pendiente")', result: 'Verdadero si coincide con alguno.', tips: ['O funciona como alias.'] },
  NOT: { category: 'Lógicas', use: 'Invierte verdadero/falso.', example: '=NOT(F2="Activo")', result: 'Verdadero si F2 no es Activo.', tips: ['NO funciona como alias.'] },
  ISBLANK: { category: 'Validación', use: 'Comprueba si una celda está vacía.', example: '=ISBLANK(A2)', result: 'Verdadero si A2 está vacía.', tips: ['ESBLANCO funciona como alias.'] },
  ISNUMBER: { category: 'Validación', use: 'Comprueba si un valor es número.', example: '=ISNUMBER(D2)', result: 'Verdadero si D2 es numérico.', tips: ['ESNUMERO funciona como alias.'] },
  ISTEXT: { category: 'Validación', use: 'Comprueba si un valor es texto.', example: '=ISTEXT(C2)', result: 'Verdadero si C2 es texto.', tips: ['ESTEXTO funciona como alias.'] },
  ISERROR: { category: 'Validación', use: 'Comprueba si una fórmula devuelve error.', example: '=ISERROR(A2/B2)', result: 'Verdadero si la división falla.', tips: ['ESERROR funciona como alias.'] },
  PMT: { category: 'Financiera', use: 'Calcula el pago periódico de un préstamo.', example: '=PMT(0.02,12,10000)', result: 'Pago estimado con tasa, periodos y monto.', tips: ['PAGO funciona como alias.', 'La tasa debe estar en el mismo periodo que los pagos.'] },
  PV: { category: 'Financiera', use: 'Calcula el valor presente de pagos o flujos futuros.', example: '=PV(0.02,12,-950)', result: 'Devuelve cuánto vale hoy una serie de pagos futuros.', tips: ['Usa tasa por periodo, no anual si los pagos son mensuales.', 'VA funciona como alias.'] },
  FV: { category: 'Financiera', use: 'Calcula el valor futuro de una inversión o préstamo.', example: '=FV(0.02,12,-1000)', result: 'Valor futuro al final de los periodos.', tips: ['VF funciona como alias.', 'El signo de pagos puede cambiar el resultado.'] },
  NPER: { category: 'Financiera', use: 'Calcula cuántos periodos se necesitan para pagar o alcanzar un valor.', example: '=NPER(0.02,-1000,10000)', result: 'Número de pagos/periodos.', tips: ['La tasa debe coincidir con el periodo de pago.'] },
  RATE: { category: 'Financiera', use: 'Estima la tasa de interés por periodo.', example: '=RATE(12,-950,10000)', result: 'Tasa aproximada por periodo.', tips: ['TASA funciona como alias.', 'Es una aproximación iterativa.'] },
  IPMT: { category: 'Financiera', use: 'Calcula la parte de interés de un pago.', example: '=IPMT(0.02,1,12,10000)', result: 'Interés del periodo indicado.', tips: ['Útil para amortizaciones.', 'PAGOINT funciona como alias.'] },
  PPMT: { category: 'Financiera', use: 'Calcula la parte de capital de un pago.', example: '=PPMT(0.02,1,12,10000)', result: 'Capital abonado en el periodo.', tips: ['Sirve junto con IPMT para tablas de amortización.'] },
  CUMIPMT: { category: 'Financiera', use: 'Suma intereses entre dos periodos.', example: '=CUMIPMT(0.02,12,10000,1,6,0)', result: 'Interés acumulado del periodo 1 al 6.', tips: ['Bueno para reportes por trimestre o semestre.'] },
  CUMPRINC: { category: 'Financiera', use: 'Suma capital pagado entre dos periodos.', example: '=CUMPRINC(0.02,12,10000,1,6,0)', result: 'Capital acumulado del periodo 1 al 6.', tips: ['Útil para separar capital e intereses.'] },
  NPV: { category: 'Financiera', use: 'Calcula valor presente neto de flujos periódicos.', example: '=NPV(0.1,B2:B12)', result: 'Valor actual de flujos descontados.', tips: ['VNA funciona como alias.', 'No incluye normalmente la inversión inicial si la sumas aparte.'] },
  IRR: { category: 'Financiera', use: 'Calcula la tasa interna de retorno.', example: '=IRR(B2:B12)', result: 'Tasa aproximada que hace cero el valor presente neto.', tips: ['TIR funciona como alias.', 'Debe haber flujos positivos y negativos.'] },
  MIRR: { category: 'Financiera', use: 'Calcula TIR modificada con tasa de financiamiento y reinversión.', example: '=MIRR(B2:B12,0.12,0.08)', result: 'Retorno más realista que IRR en algunos casos.', tips: ['TIRM funciona como alias.'] },
  SLN: { category: 'Depreciación', use: 'Depreciación lineal por periodo.', example: '=SLN(100000,10000,5)', result: 'Depreciación igual por cada periodo.', tips: ['Costo, valor residual y vida útil.'] },
  SYD: { category: 'Depreciación', use: 'Depreciación por suma de dígitos.', example: '=SYD(100000,10000,5,1)', result: 'Depreciación acelerada para el periodo indicado.', tips: ['Mayor depreciación al inicio.'] },
  DDB: { category: 'Depreciación', use: 'Depreciación por doble saldo decreciente.', example: '=DDB(100000,10000,5,1)', result: 'Depreciación acelerada del periodo.', tips: ['Puedes pasar factor como quinto argumento.'] },
  DB: { category: 'Depreciación', use: 'Depreciación de saldo fijo aproximada.', example: '=DB(100000,10000,5,1)', result: 'Depreciación del periodo.', tips: ['Útil para estimaciones rápidas.'] },
  EFFECT: { category: 'Financiera', use: 'Convierte tasa nominal a tasa efectiva.', example: '=EFFECT(0.18,12)', result: 'Tasa efectiva anual.', tips: ['INT.EFECTIVO funciona como alias.'] },
  NOMINAL: { category: 'Financiera', use: 'Convierte tasa efectiva a tasa nominal.', example: '=NOMINAL(0.1956,12)', result: 'Tasa nominal aproximada.', tips: ['TASA.NOMINAL funciona como alias.'] },
  DAYS360: { category: 'Fechas', use: 'Calcula días con año comercial de 360 días.', example: '=DAYS360(A2,B2)', result: 'Días comerciales entre fechas.', tips: ['Muy usado en cálculos financieros.'] },
  NETWORKDAYS: { category: 'Fechas', use: 'Cuenta días hábiles entre fechas.', example: '=NETWORKDAYS(A2,B2)', result: 'Días laborales sin fines de semana.', tips: ['DIAS.LAB funciona como alias.'] },
  WORKDAY: { category: 'Fechas', use: 'Suma días hábiles a una fecha.', example: '=WORKDAY(A2,5)', result: 'Fecha después de 5 días hábiles.', tips: ['Útil para vencimientos y entregas.'] },
  YEARFRAC: { category: 'Fechas', use: 'Calcula fracción de año entre fechas.', example: '=YEARFRAC(A2,B2)', result: 'Años proporcionales entre dos fechas.', tips: ['Sirve para intereses proporcionales.'] },
  DATEDIF: { category: 'Fechas', use: 'Diferencia entre fechas por unidad.', example: '=DATEDIF(A2,B2,"M")', result: 'Meses completos entre fechas.', tips: ['Unidades: D días, M meses, Y años.'] },
  IVA: { category: 'Contabilidad', use: 'Calcula IVA sobre una base.', example: '=IVA(1000,0.16)', result: '160.', tips: ['Puedes usar 0.08 para frontera si aplica.', 'Si omites tasa usa 16%.'] },
  PRECIOCONIVA: { category: 'Contabilidad', use: 'Calcula precio total con IVA incluido.', example: '=PRECIOCONIVA(1000,0.16)', result: '1160.', tips: ['CONIVA funciona como alias.'] },
  SINIVA: { category: 'Contabilidad', use: 'Obtiene subtotal antes de IVA desde un total.', example: '=SINIVA(1160,0.16)', result: '1000.', tips: ['Útil cuando el precio ya viene con impuesto.'] },
  DESCUENTO: { category: 'Contabilidad', use: 'Calcula monto final después de descuento.', example: '=DESCUENTO(1000,0.10)', result: '900.', tips: ['Acepta 0.10 o 10 como 10%.'] },
  MONTO_DESCUENTO: { category: 'Contabilidad', use: 'Calcula cuánto dinero representa el descuento.', example: '=MONTO_DESCUENTO(1000,0.10)', result: '100.', tips: ['Sirve para mostrar descuento separado.'] },
  MARGEN: { category: 'Contabilidad', use: 'Calcula margen sobre precio de venta.', example: '=MARGEN(150,100)', result: '0.3333.', tips: ['Multiplica por 100 si quieres porcentaje.'] },
  MARKUP: { category: 'Contabilidad', use: 'Calcula markup sobre costo.', example: '=MARKUP(150,100)', result: '0.5.', tips: ['No es lo mismo que margen. Sí, contabilidad decidió que necesitábamos ambos.'] },
  UTILIDAD: { category: 'Contabilidad', use: 'Calcula ganancia monetaria.', example: '=UTILIDAD(150,100,3)', result: '150.', tips: ['Precio, costo y cantidad.'] },
  UTILIDADPORC: { category: 'Contabilidad', use: 'Calcula porcentaje de utilidad sobre venta.', example: '=UTILIDADPORC(150,100)', result: '33.3333.', tips: ['Usa la fórmula de margen sobre ingreso.'] },
  VENTA_TOTAL: { category: 'Contabilidad', use: 'Total de venta con cantidad, descuento e impuesto.', example: '=VENTA_TOTAL(100,5,0.10,0.16)', result: 'Total con descuento e IVA.', tips: ['Orden: precio, cantidad, descuento, impuesto.'] },
  PUNTOEQUILIBRIO: { category: 'Contabilidad', use: 'Calcula unidades necesarias para cubrir costos fijos.', example: '=PUNTOEQUILIBRIO(50000,120,80)', result: '1250 unidades.', tips: ['Precio debe ser mayor que costo variable.'] },
  ROTACION: { category: 'Contabilidad', use: 'Calcula rotación de inventario.', example: '=ROTACION(500000,100000)', result: '5.', tips: ['Costo vendido / inventario promedio.'] },
  DIASCARTERA: { category: 'Contabilidad', use: 'Calcula días promedio de cartera.', example: '=DIASCARTERA(80000,1200000,365)', result: 'Días de cobranza aproximados.', tips: ['También conocido como DSO.'] },
  RAZONCORRIENTE: { category: 'Contabilidad', use: 'Activo corriente entre pasivo corriente.', example: '=RAZONCORRIENTE(200000,100000)', result: '2.', tips: ['Mide liquidez general.'] },
  PRUEBAACIDA: { category: 'Contabilidad', use: 'Liquidez sin inventario.', example: '=PRUEBAACIDA(200000,50000,100000)', result: '1.5.', tips: ['Más conservadora que razón corriente.'] },
  ENDEUDAMIENTO: { category: 'Contabilidad', use: 'Pasivo total entre activo total.', example: '=ENDEUDAMIENTO(300000,1000000)', result: '0.3.', tips: ['Multiplica por 100 para porcentaje.'] },
  ROI: { category: 'Contabilidad', use: 'Retorno sobre inversión.', example: '=ROI(130000,100000)', result: '0.3.', tips: ['Ganancia final e inversión.'] },
  ROA: { category: 'Contabilidad', use: 'Retorno sobre activos.', example: '=ROA(150000,1000000)', result: '0.15.', tips: ['Utilidad neta / activos.'] },
  ROE: { category: 'Contabilidad', use: 'Retorno sobre capital.', example: '=ROE(150000,500000)', result: '0.3.', tips: ['Utilidad neta / capital.'] },
};


Object.assign(functionDetails, {
  'STDEV.S': { category: 'Estadística', use: 'Calcula dispersión muestral de importes, ventas o saldos.', example: '=STDEV.S(D2:D13)', result: 'Desviación estándar muestral de los importes.', tips: ['Úsala cuando tus datos son una muestra, no toda la población.'] },
  'STDEV.P': { category: 'Estadística', use: 'Calcula dispersión poblacional.', example: '=STDEV.P(D2:D13)', result: 'Desviación estándar poblacional.', tips: ['Úsala cuando tienes todos los datos del universo analizado.'] },
  'VAR.S': { category: 'Estadística', use: 'Varianza muestral.', example: '=VAR.S(D2:D13)', result: 'Varianza de la muestra.', tips: ['Es la desviación estándar al cuadrado.'] },
  'VAR.P': { category: 'Estadística', use: 'Varianza poblacional.', example: '=VAR.P(D2:D13)', result: 'Varianza poblacional.', tips: ['Útil para análisis completo de cartera o ventas históricas.'] },
  'PERCENTILE.INC': { category: 'Estadística', use: 'Encuentra el valor por debajo del cual cae cierto porcentaje.', example: '=PERCENTILE.INC(D2:D101,0.9)', result: 'Importe del percentil 90.', tips: ['0.9 equivale al 90%.'] },
  'PERCENTRANK.INC': { category: 'Estadística', use: 'Indica la posición porcentual de un valor dentro de una lista.', example: '=PERCENTRANK.INC(D2:D101,D2)', result: 'Rango porcentual de D2.', tips: ['Sirve para comparar una factura contra todas las demás.'] },
  'STANDARDIZE': { category: 'Estadística', use: 'Convierte un valor a puntaje Z.', example: '=STANDARDIZE(D2,AVERAGE(D:D),STDEV.S(D:D))', result: 'Qué tan lejos está D2 del promedio.', tips: ['Útil para detectar valores atípicos.'] },
  'NORM.DIST': { category: 'Estadística', use: 'Evalúa probabilidad en distribución normal.', example: '=NORM.DIST(120000,100000,15000,TRUE)', result: 'Probabilidad acumulada hasta 120000.', tips: ['Cumulative TRUE devuelve probabilidad acumulada.'] },
  'FORECAST.LINEAR': { category: 'Estadística', use: 'Pronostica un valor con tendencia lineal.', example: '=FORECAST.LINEAR(13,B2:B12,A2:A12)', result: 'Pronóstico del periodo 13.', tips: ['known_y son resultados, known_x son periodos.'] },
  SLOPE: { category: 'Estadística', use: 'Mide cuánto cambia Y por cada unidad de X.', example: '=SLOPE(B2:B12,A2:A12)', result: 'Pendiente de la tendencia.', tips: ['Útil para ver si ventas suben o bajan por periodo.'] },
  INTERCEPT: { category: 'Estadística', use: 'Valor estimado cuando X vale 0.', example: '=INTERCEPT(B2:B12,A2:A12)', result: 'Intersección de la tendencia.', tips: ['Se usa junto con SLOPE para pronóstico lineal.'] },
  RSQ: { category: 'Estadística', use: 'Mide qué tan bien explica X a Y.', example: '=RSQ(B2:B12,A2:A12)', result: 'Coeficiente R².', tips: ['Mientras más cerca de 1, mejor ajuste lineal.'] },
  ISPMT: { category: 'Financiera', use: 'Calcula interés de un periodo con amortización simple.', example: '=ISPMT(0.02,1,12,10000)', result: 'Interés estimado del primer periodo.', tips: ['rate es tasa por periodo, no anual si los periodos son meses.'] },
  CAGR: { category: 'Financiera', use: 'Tasa de crecimiento anual compuesto.', example: '=CAGR(100000,165000,3)', result: 'Crecimiento anual compuesto.', tips: ['begin_value es valor inicial, end_value el final.'] },
  DSO: { category: 'Contabilidad', use: 'Días promedio de cobranza.', example: '=DSO(85000,450000,365)', result: 'Días estimados para cobrar ventas a crédito.', tips: ['accounts_receivable es cuentas por cobrar.'] },
  INVENTORY_TURNOVER: { category: 'Contabilidad', use: 'Veces que rota el inventario.', example: '=INVENTORY_TURNOVER(720000,90000)', result: '8 rotaciones.', tips: ['cogs es costo de ventas.'] },
  ASSET_TURNOVER: { category: 'Contabilidad', use: 'Ventas generadas por cada peso de activo.', example: '=ASSET_TURNOVER(1200000,600000)', result: '2.', tips: ['Más alto suele indicar mejor uso de activos.'] },
  DEBT_TO_EQUITY: { category: 'Contabilidad', use: 'Compara deuda contra capital.', example: '=DEBT_TO_EQUITY(300000,500000)', result: '0.6.', tips: ['Útil para evaluar apalancamiento.'] },
  GROSS_PROFIT: { category: 'Contabilidad', use: 'Utilidad bruta en dinero.', example: '=GROSS_PROFIT(150000,90000)', result: '60000.', tips: ['Ventas menos costo de ventas.'] },
  OPERATING_PROFIT: { category: 'Contabilidad', use: 'Utilidad operativa.', example: '=OPERATING_PROFIT(60000,25000)', result: '35000.', tips: ['Utilidad bruta menos gastos operativos.'] },
  NET_PROFIT: { category: 'Contabilidad', use: 'Utilidad neta simple.', example: '=NET_PROFIT(150000,100000,12000)', result: '38000.', tips: ['Ingreso menos gastos menos impuestos.'] },
  BREAK_EVEN_UNITS: { category: 'Contabilidad', use: 'Unidades para punto de equilibrio.', example: '=BREAK_EVEN_UNITS(50000,120,80)', result: '1250 unidades.', tips: ['price menos variable_cost es contribución unitaria.'] },
  SAFETY_MARGIN: { category: 'Contabilidad', use: 'Margen de seguridad contra punto de equilibrio.', example: '=SAFETY_MARGIN(180000,125000)', result: '0.3056.', tips: ['Indica cuánto pueden bajar las ventas antes de llegar al equilibrio.'] },
  PRORATE: { category: 'Contabilidad', use: 'Prorratea un importe según una base.', example: '=PRORATE(10000,25,100)', result: '2500.', tips: ['amount es el total a repartir; weight es la parte; total_weight es la suma de pesos.'] },
  AGING_BUCKET: { category: 'Contabilidad', use: 'Clasifica días vencidos.', example: '=AGING_BUCKET(45)', result: '31-60.', tips: ['Útil para cartera vencida.'] },
  TEXTBEFORE: { category: 'Texto', use: 'Extrae texto antes de un separador.', example: '=TEXTBEFORE("WAL-30E045 - Acido", " - ")', result: 'WAL-30E045.', tips: ['Útil para separar código y nombre.'] },
  TEXTAFTER: { category: 'Texto', use: 'Extrae texto después de un separador.', example: '=TEXTAFTER("WAL-30E045 - Acido", " - ")', result: 'Acido.', tips: ['Útil para limpiar importaciones.'] },
  TEXTSPLIT: { category: 'Texto', use: 'Divide texto por separador.', example: '=TEXTSPLIT("A,B,C",",")', result: 'A, B y C separados.', tips: ['En este motor se muestra como texto tabulado.'] },
  CHOOSECOLS: { category: 'Búsqueda', use: 'Devuelve columnas específicas de una matriz.', example: '=CHOOSECOLS(A:E,2,4)', result: 'Columnas B y D.', tips: ['Los números de columna empiezan en 1.'] },
  CHOOSEROWS: { category: 'Búsqueda', use: 'Devuelve filas específicas de una matriz.', example: '=CHOOSEROWS(A2:E10,1,3)', result: 'Filas 1 y 3 del rango.', tips: ['Sirve para extraer filas puntuales.'] },
  TRANSPOSE: { category: 'Búsqueda', use: 'Convierte filas en columnas y columnas en filas.', example: '=TRANSPOSE(A1:C1)', result: 'Los valores pasan a una columna.', tips: ['Útil para acomodar datos importados.'] },
  XMATCH: { category: 'Búsqueda', use: 'Devuelve posición de un valor dentro de un rango.', example: '=XMATCH("WAL-30E045",B:B)', result: 'Número de posición encontrada.', tips: ['Se combina muy bien con INDEX.'] },
  ISLOGICAL: { category: 'Validación', use: 'Revisa si un dato es TRUE o FALSE.', example: '=ISLOGICAL(A2)', result: 'TRUE o FALSE.', tips: ['Útil para validar resultados de condiciones.'] },
  ISEVEN: { category: 'Validación', use: 'Revisa si un número es par.', example: '=ISEVEN(B2)', result: 'TRUE si B2 es par.', tips: ['Sirve para controles simples de secuencias.'] },
  ISODD: { category: 'Validación', use: 'Revisa si un número es impar.', example: '=ISODD(B2)', result: 'TRUE si B2 es impar.', tips: ['Útil para alternar reglas.'] },
  ISOWEEKNUM: { category: 'Fechas', use: 'Número de semana ISO.', example: '=ISOWEEKNUM(DATE(2026,5,16))', result: 'Semana ISO de esa fecha.', tips: ['Útil para reportes semanales.'] },
});


const ARGUMENT_DESCRIPTION_BY_NAME = {
  number: 'Número, celda o fórmula numérica. Ejemplo: D2, 1000 o D2*B2.',
  number1: 'Primer número, celda o rango a calcular. Ejemplo: D2:D100.',
  number2: 'Número adicional opcional. Puedes poner otra celda, otro rango o un valor fijo.',
  value: 'Valor que quieres evaluar o buscar. Puede ser texto, número, fecha, celda o fórmula.',
  value1: 'Primer valor de la comparación o cálculo.',
  value2: 'Segundo valor de la comparación o cálculo.',
  text: 'Texto o celda con texto. Ejemplo: C2 o "WAL-30E045".',
  text1: 'Primer texto a usar.',
  text2: 'Segundo texto a usar.',
  range: 'Rango de celdas. Ejemplo: A2:A100.',
  range1: 'Primer rango de celdas. Ejemplo: D2:D100.',
  range2: 'Rango adicional opcional.',
  array: 'Lista o rango de datos. Ejemplo: D2:D100.',
  array1: 'Primer rango/lista de datos.',
  array2: 'Segundo rango/lista de datos.',
  condition: 'Condición lógica que debe dar TRUE/FALSE. Ejemplo: D2>0.',
  condition1: 'Primera condición lógica. Ejemplo: F2="Activo".',
  criteria: 'Criterio que se debe cumplir. Ejemplos: "Activo", ">100", "Limpieza".',
  criteria1: 'Primer criterio que se debe cumplir.',
  criteria_range1: 'Rango donde se revisa el primer criterio.',
  sum_range: 'Rango de valores que se van a sumar cuando el criterio se cumpla.',
  avg_range: 'Rango de valores que se van a promediar.',
  average_range: 'Rango de valores que se van a promediar si el criterio se cumple.',
  max_range: 'Rango del cual se tomará el valor máximo.',
  min_range: 'Rango del cual se tomará el valor mínimo.',
  lookup_array: 'Rango donde se busca el valor. Ejemplo: B:B.',
  return_array: 'Rango desde donde se devuelve el resultado. Debe corresponder al rango de búsqueda.',
  table: 'Tabla o rango donde se realizará la búsqueda. Ejemplo: A:E.',
  col_index: 'Número de columna a devolver dentro de la tabla. La primera columna del rango cuenta como 1.',
  row_index: 'Número de fila a devolver dentro de la tabla.',
  approx: 'Modo de coincidencia. FALSE busca coincidencia exacta, TRUE permite aproximada.',
  not_found: 'Valor que se mostrará si no se encuentra resultado. Ejemplo: "No encontrado".',
  row: 'Número de fila dentro del rango.',
  column: 'Número de columna dentro del rango.',
  type: 'Tipo de cálculo. En funciones financieras suele indicar si el pago es al inicio o al final del periodo.',
  rate: 'Tasa por periodo. Si es mensual, usa tasa mensual. Ejemplo: 0.02 para 2%.',
  nper: 'Número total de periodos. Ejemplo: 12 meses.',
  pv: 'Valor presente o monto inicial del préstamo/inversión.',
  fv: 'Valor futuro esperado al final de los periodos.',
  pmt: 'Pago periódico. En préstamos suele ser el pago mensual.',
  per: 'Periodo específico a evaluar. Ejemplo: 1 para el primer mes.',
  start_period: 'Periodo inicial del rango que quieres acumular.',
  end_period: 'Periodo final del rango que quieres acumular.',
  start_date: 'Fecha inicial. Ejemplo: DATE(2026,1,1) o A2.',
  end_date: 'Fecha final. Ejemplo: DATE(2026,1,31) o B2.',
  date: 'Fecha o celda con fecha.',
  dates: 'Rango/lista de fechas que corresponde a los flujos.',
  due_date: 'Fecha de vencimiento.',
  as_of: 'Fecha de corte. Si se omite, normalmente se toma hoy.',
  months: 'Cantidad de meses a sumar o restar.',
  days: 'Número de días del cálculo.',
  year: 'Año de la fecha. Ejemplo: 2026.',
  month: 'Mes de la fecha. Ejemplo: 5.',
  day: 'Día de la fecha. Ejemplo: 16.',
  digits: 'Cantidad de decimales. Ejemplo: 2 para centavos.',
  multiple: 'Múltiplo al que quieres redondear. Ejemplo: 5, 10 o 0.5.',
  significance: 'Múltiplo usado para redondear hacia arriba/abajo.',
  delimiter: 'Separador usado para unir textos. Ejemplo: " - ".',
  ignore_empty: 'TRUE ignora celdas vacías; FALSE las conserva.',
  count: 'Cantidad de caracteres que quieres tomar.',
  start: 'Posición inicial dentro del texto. La primera posición es 1.',
  old: 'Texto que quieres reemplazar.',
  new: 'Texto nuevo que reemplazará al anterior.',
  new_text: 'Texto nuevo que se insertará en el reemplazo.',
  instance: 'Número de aparición específica que quieres reemplazar. Si se omite, reemplaza todas.',
  find_text: 'Texto que quieres encontrar.',
  within_text: 'Texto o celda donde se va a buscar.',
  subtotal: 'Base antes de impuestos o retenciones.',
  total: 'Importe total, normalmente con impuestos incluidos.',
  tax_rate: 'Tasa de impuesto en decimal. Ejemplo: 0.16 para 16%.',
  iva_rate: 'Tasa de IVA en decimal. Ejemplo: 0.16 para 16%.',
  ret_iva_rate: 'Tasa de retención de IVA. Ejemplo: 0.106667.',
  ret_isr_rate: 'Tasa de retención de ISR. Ejemplo: 0.0125.',
  base: 'Importe base sobre el que se calcula impuesto, comisión, descuento o retención.',
  amount: 'Importe monetario. Ejemplo: 1000.',
  cost: 'Costo del producto/servicio.',
  costs: 'Rango/lista de costos.',
  price: 'Precio de venta.',
  sales: 'Ventas o ingresos.',
  quantity: 'Cantidad de unidades.',
  quantities: 'Rango/lista de cantidades.',
  fixed_costs: 'Costos fijos del periodo. Ejemplo: renta, nómina fija, servicios.',
  variable_cost: 'Costo variable por unidad.',
  operating_income: 'Utilidad operativa antes de conceptos no operativos.',
  net_income: 'Utilidad neta.',
  depreciation: 'Depreciación del periodo.',
  amortization: 'Amortización del periodo.',
  assets: 'Activos.',
  total_assets: 'Activo total.',
  current_assets: 'Activo circulante.',
  current_liabilities: 'Pasivo circulante.',
  equity: 'Capital contable.',
  inventory: 'Inventario.',
  avg_inventory: 'Inventario promedio del periodo.',
  cogs: 'Costo de ventas.',
  accounts_payable: 'Cuentas por pagar.',
  ebit: 'Utilidad antes de intereses e impuestos.',
  interest_expense: 'Gasto por intereses.',
  budget: 'Presupuesto planeado.',
  real: 'Resultado real obtenido.',
  gross: 'Sueldo bruto.',
  isr: 'ISR retenido o calculado.',
  imss: 'Descuento de IMSS.',
  other: 'Otros descuentos o importes adicionales.',

  x: 'Valor a evaluar. Ejemplo: 120000 en una distribución o periodo 13 para pronóstico.',
  known_y: 'Rango de resultados conocidos. Ejemplo: B2:B12 con ventas mensuales.',
  known_x: 'Rango de periodos o variables conocidas. Ejemplo: A2:A12 con meses 1 a 11.',
  standard_dev: 'Desviación estándar. Ejemplo: STDEV.S(D2:D100) o 15000.',
  probability: 'Probabilidad entre 0 y 1. Ejemplo: 0.95.',
  cumulative: 'TRUE devuelve acumulado; FALSE devuelve densidad puntual.',
  begin_value: 'Valor inicial. Ejemplo: 100000.',
  end_value: 'Valor final. Ejemplo: 165000.',
  periods: 'Número de periodos. Ejemplo: 3 años o 12 meses.',
  new_value: 'Valor nuevo o actual.',
  old_value: 'Valor anterior o base de comparación.',
  accounts_receivable: 'Cuentas por cobrar promedio o al corte.',
  credit_sales: 'Ventas a crédito del periodo.',
  average_inventory: 'Inventario promedio del periodo.',
  average_assets: 'Activos promedio del periodo.',
  total_debt: 'Deuda total o pasivo con costo.',
  gross_profit: 'Utilidad bruta.',
  operating_expenses: 'Gastos operativos.',
  income: 'Ingresos del periodo.',
  expenses: 'Gastos del periodo.',
  taxes: 'Impuestos del periodo.',
  actual_sales: 'Ventas reales.',
  break_even_sales: 'Ventas de punto de equilibrio.',
  weight: 'Peso o proporción individual para prorratear.',
  total_weight: 'Suma total de pesos o base de reparto.',
  weights: 'Rango con pesos o porcentajes para distribuir un total.',
  days_overdue: 'Días vencidos. Ejemplo: 45.',
  lookup_value: 'Valor que quieres buscar. Ejemplo: "WAL-30E045".',
  match_mode: 'Modo de coincidencia. 0 exacto, 1 siguiente mayor, -1 siguiente menor.',
  search_mode: 'Dirección de búsqueda. 1 de arriba hacia abajo, -1 de abajo hacia arriba.',
  col_num1: 'Número de columna a extraer. Ejemplo: 2 para la segunda columna del rango.',
  row_num1: 'Número de fila a extraer. Ejemplo: 1 para la primera fila del rango.',
};


const ARGUMENT_EXAMPLE_BY_NAME = {
  number: 'D2 = 116.79', number1: 'D2:D10 = importes', number2: 'E2:E10 = costos',
  value: 'A2 = "Activo" o D2 = 1000', value1: 'D2 = 1000', value2: 'E2 = 999.99',
  text: 'C2 = " WAL-30E045 - Acido "', text1: '"WAL"', text2: '"WAL"',
  range: 'A2:A100', range1: 'C2:C100', range2: 'D2:D100', array: 'D2:D100', array1: 'A2:C10', array2: 'D2:F10',
  condition: 'D2>100', condition1: 'F2="Activo"', criteria: '">100" o "Activo"', criteria1: '"Limpieza"', criteria_range1: 'C2:C100',
  sum_range: 'D2:D100', avg_range: 'D2:D100', average_range: 'D2:D100', max_range: 'D2:D100', min_range: 'D2:D100',
  lookup_value: '"WAL-30E045"', lookup_array: 'B2:B100', return_array: 'C2:C100', table: 'A2:E100', col_index: '3', row_index: '2', approx: 'FALSE', not_found: '"No encontrado"',
  rate: '0.02 para 2% mensual', nper: '12 meses', pv: '10000 préstamo', fv: '0 si termina liquidado', pmt: '-945.60 pago mensual', per: '1 primer periodo',
  start_date: 'DATE(2026,1,1)', end_date: 'DATE(2026,1,31)', date: 'A2 = 2026-05-16', dates: 'A2:A12 = fechas de flujo', due_date: 'C2 = fecha de vencimiento', as_of: 'TODAY() o DATE(2026,5,16)',
  months: '2 meses', days: '30 días', year: '2026', month: '5', day: '16', digits: '2 decimales', multiple: '5 o 0.5', significance: '0.05 para redondear a 5 centavos',
  delimiter: '" - " o ","', ignore_empty: 'TRUE', count: '5 caracteres', start: '1', old: '"S.A."', new: '"SA"', new_text: '"nuevo"', find_text: '"WAL"', within_text: 'C2',
  subtotal: '1000', total: '1160', tax_rate: '0.16', iva_rate: '0.16', ret_iva_rate: '0.106667', ret_isr_rate: '0.0125', base: '1000', amount: '10000',
  cost: '70', costs: 'E2:E100', price: '100', sales: '150000', quantity: '5', quantities: 'B2:B100', fixed_costs: '50000', variable_cost: '80',
  operating_income: '35000', net_income: '38000', depreciation: '5000', amortization: '2000', total_assets: '600000', current_assets: '200000', current_liabilities: '100000', equity: '500000',
  avg_inventory: '90000', cogs: '720000', accounts_payable: '60000', ebit: '45000', interest_expense: '9000', budget: '120000', real: '135000',
  gross: '12000', isr: '1500', imss: '450', other: '200', x: '13 o 120000', known_y: 'B2:B12 = ventas', known_x: 'A2:A12 = meses', standard_dev: '15000', probability: '0.95', cumulative: 'TRUE',
  begin_value: '100000', end_value: '165000', periods: '3', new_value: '135000', old_value: '120000', accounts_receivable: '85000', credit_sales: '450000', average_inventory: '90000', average_assets: '600000', total_debt: '300000',
  gross_profit: '60000', operating_expenses: '25000', income: '150000', expenses: '100000', taxes: '12000', actual_sales: '180000', break_even_sales: '125000', weight: '25', total_weight: '100', weights: 'B2:B10', days_overdue: '45',
  match_mode: '0 coincidencia exacta', search_mode: '1 buscar de arriba a abajo', col_num1: '2', row_num1: '1',
};

const EXAMPLE_DATA_BY_CATEGORY = {
  'Básicas': ['D2:D6 = 100, 250, 180, 90, 320', 'C2:C6 = productos con datos y algunas celdas vacías'],
  'Condicionales': ['C:C = Categoría del producto', 'D:D = Importe o precio', 'F:F = Estado como Activo/Inactivo', 'Ejemplo de criterio: "Limpieza" o ">100"'],
  'Búsqueda': ['A:E = tabla de productos', 'B:B = códigos como WAL-30E045', 'C:C = nombres de producto', 'D:D = precio de venta'],
  'Texto': ['B2 = WAL-30E045', 'C2 = "  Acido Muriatico 3.78 Lts Galon  "', 'Útil cuando importas datos con espacios o códigos mezclados'],
  'Fechas': ['A2 = 2026-01-01', 'B2 = 2026-01-31', 'C2 = fecha de vencimiento de factura'],
  'Matemáticas': ['D2 = 116.789', 'E2 = 70', 'B2 = cantidad vendida'],
  'Estadística': ['D2:D10 = importes de ventas', 'E2:E10 = costos', 'Útil para analizar promedios, variación y distribución'],
  'Validación': ['A2 puede estar vacío', 'D2 puede ser texto o número', 'Útil para validar datos antes de aplicar cambios'],
  'Financiera': ['rate = 0.02 tasa mensual del 2%', 'nper = 12 meses', 'pv = 10000 monto del préstamo', 'values = flujos de efectivo por periodo'],
  'Contabilidad': ['Subtotal = 1000', 'IVA = 0.16', 'Retención IVA = 0.106667', 'Retención ISR = 0.0125', 'Debe/Haber = movimientos contables'],
  'Depreciación': ['Costo del activo = 100000', 'Valor residual = 10000', 'Vida útil = 5 años', 'Periodo = año o mes a calcular'],
  General: ['Puedes usar números directos, celdas como A1 o rangos como A1:A10.'],
};

const FUNCTION_EXPLANATION_BY_NAME = {
  PMT: 'Lee la función como: con esta tasa, durante estos periodos y por este monto, dime cuánto se pagaría cada periodo.',
  PV: 'Lee la función como: dime cuánto vale hoy una serie de pagos futuros.',
  FV: 'Lee la función como: dime cuánto tendré al final si hago pagos o inversiones durante cierto tiempo.',
  NPV: 'Lee la función como: trae flujos futuros a valor presente usando una tasa de descuento.',
  IRR: 'Lee la función como: calcula la tasa que hace que los flujos recuperen la inversión inicial.',
  XNPV: 'Igual que NPV, pero usando fechas reales para cada flujo.',
  XIRR: 'Igual que IRR, pero usando fechas reales para cada flujo.',
  VLOOKUP: 'Busca de arriba hacia abajo en la primera columna del rango y trae una columna relacionada.',
  XLOOKUP: 'Busca en un rango y devuelve el valor de otro rango en la misma posición.',
  SUMIF: 'Primero revisa qué filas cumplen el criterio y luego suma solo esas filas.',
  SUMIFS: 'Primero revisa varios criterios y luego suma solo las filas que cumplen todos.',
  TOTAL_FACTURA: 'Parte de un subtotal y calcula total con IVA menos retenciones.',
  SUBTOTAL_FACTURA: 'Hace el camino inverso: parte del total final para estimar la base antes de IVA y retenciones.',
  CONCILIADO: 'Compara dos importes y permite una tolerancia pequeña para diferencias por centavos.',
  SALDO: 'Suma saldo inicial más debe menos haber, como una cuenta contable simple.',
  CUADRA_DEBE_HABER: 'Sirve para validar si una póliza o movimiento tiene debe y haber iguales dentro de una tolerancia.',
};

function cleanArgumentName(arg = '') {
  return String(arg)
    .replace(/[\[\]]/g, '')
    .replace(/\.\.\./g, '')
    .replace(/^=/, '')
    .trim();
}

function parseFunctionArguments(syntax = '') {
  const inside = String(syntax).match(/\((.*)\)/)?.[1] || '';
  if (!inside.trim()) return [];
  return inside
    .split(',')
    .map((rawArg) => {
      const optional = /\[/.test(rawArg);
      const arg = cleanArgumentName(rawArg);
      return { arg, optional };
    })
    .filter(({ arg }) => Boolean(arg))
    .map(({ arg, optional }) => {
      const key = arg.toLowerCase().replace(/\s+/g, '_');
      return {
        name: arg,
        optional,
        description: ARGUMENT_DESCRIPTION_BY_NAME[key] || ARGUMENT_DESCRIPTION_BY_NAME[key.replace(/\d+$/, '1')] || 'Dato que necesita la función. Puede ser un valor fijo, una celda, un rango o el resultado de otra fórmula.',
        example: ARGUMENT_EXAMPLE_BY_NAME[key] || ARGUMENT_EXAMPLE_BY_NAME[key.replace(/\d+$/, '1')] || 'Ejemplo: A1, A1:A10, 1000 o texto entre comillas.',
      };
    });
}

function getExampleDataForFunction(info, fn = null) {
  const baseRows = EXAMPLE_DATA_BY_CATEGORY[info.category] || EXAMPLE_DATA_BY_CATEGORY.General;
  const argRows = fn ? parseFunctionArguments(fn.syntax).slice(0, 5).map((arg) => `${arg.name}: ${arg.example}`) : [];
  return [...baseRows, ...argRows];
}

function getHumanExplanation(fn, info) {
  return FUNCTION_EXPLANATION_BY_NAME[fn.name] || `Lee esta función como: usa ${parseFunctionArguments(fn.syntax).map((arg) => arg.name).join(', ') || 'sus datos'} para ${String(info.use || fn.description || 'calcular el resultado').toLowerCase()}.`;
}

const formulaExamples = [
  { title: 'Sumar total de una columna', formula: '=SUM(D2:D100)', note: 'Suma todos los valores del rango.' },
  { title: 'Promedio de precios', formula: '=AVERAGE(D2:D100)', note: 'Calcula promedio ignorando celdas vacías.' },
  { title: 'Utilidad porcentual', formula: '=ROUND((D2-E2)/D2*100,2)', note: 'Precio en D, costo en E, resultado con 2 decimales.' },
  { title: 'Estado según cantidad', formula: '=IF(B2>0,"Disponible","Sin cantidad")', note: 'Devuelve un texto según una condición.' },
  { title: 'Buscar nombre por código', formula: '=VLOOKUP("WAL-30E045",A:E,3,FALSE)', note: 'Busca el código en la primera columna y devuelve la columna 3.' },
  { title: 'Buscar flexible con XLOOKUP', formula: '=XLOOKUP("WAL-30E045",B:B,C:C,"No encontrado")', note: 'Busca en B:B y devuelve el nombre desde C:C.' },
  { title: 'Unir código y nombre', formula: '=TEXTJOIN(" - ",TRUE,B2:C2)', note: 'Une celdas usando un separador.' },
  { title: 'Limpiar espacios', formula: '=TRIM(C2)', note: 'Quita espacios dobles o sobrantes.' },
  { title: 'Sumar por criterio', formula: '=SUMIF(C:C,"Limpieza",D:D)', note: 'Suma D:D donde C:C sea Limpieza.' },
  { title: 'Contar por criterio', formula: '=COUNTIF(F:F,"Activo")', note: 'Cuenta cuántas filas tienen Activo.' },
  { title: 'Sumar por varios criterios', formula: '=SUMIFS(D:D,C:C,"Limpieza",F:F,"Activo")', note: 'Suma por categoría y estado al mismo tiempo.' },
  { title: 'Fecha actual', formula: '=TODAY()', note: 'Devuelve la fecha del día.' },
  { title: 'Mes de una fecha', formula: '=MONTH(A2)', note: 'Extrae el mes de una fecha.' },

  { title: 'Calcular IVA', formula: '=IVA(D2,0.16)', note: 'Calcula el impuesto sobre el subtotal en D2.' },
  { title: 'Precio con IVA', formula: '=PRECIOCONIVA(D2,0.16)', note: 'Convierte subtotal a total con IVA.' },
  { title: 'Quitar IVA a un total', formula: '=SINIVA(D2,0.16)', note: 'Obtiene subtotal desde un precio que ya incluye IVA.' },
  { title: 'Utilidad monetaria', formula: '=UTILIDAD(D2,E2,B2)', note: 'Precio en D, costo en E y cantidad en B.' },
  { title: 'Margen de utilidad', formula: '=UTILIDADPORC(D2,E2)', note: 'Devuelve porcentaje de utilidad sobre venta.' },
  { title: 'Días hábiles de vencimiento', formula: '=NETWORKDAYS(A2,B2)', note: 'Cuenta días laborales entre fecha inicial y vencimiento.' },
  { title: 'Pago mensual de préstamo', formula: '=PMT(0.02,12,10000)', note: 'Calcula pago con tasa mensual, periodos y monto.' },
  { title: 'Depreciación lineal', formula: '=SLN(100000,10000,5)', note: 'Depreciación anual simple de un activo.' },
  { title: 'Punto de equilibrio', formula: '=PUNTOEQUILIBRIO(50000,120,80)', note: 'Unidades necesarias para cubrir costos fijos.' },
];

const howToCards = [
  {
    title: 'Autocompletar una fórmula',
    steps: ['Haz doble click o F2 en una celda.', 'Escribe = y empieza el nombre: por ejemplo =su.', 'Elige SUM/SUMA con flechas, Enter, Tab o click.', 'Selecciona o arrastra las celdas que quieres usar.', 'Presiona Enter para confirmar.'],
  },
  {
    title: 'Seleccionar celdas dentro de una fórmula',
    steps: ['Empieza escribiendo una fórmula.', 'Haz click en una celda para insertar A1.', 'Arrastra varias celdas para insertar A1:B10.', 'Puedes seguir escribiendo después del rango.', 'Cierra paréntesis si la función lo necesita.'],
  },
  {
    title: 'Usar otra hoja',
    steps: ['Empieza con =.', 'Escribe el nombre de la hoja y el signo !.', 'Ejemplo: =Productos!C2.', 'También puedes usar rangos: =SUM(Productos!D2:D20).'],
  },
  {
    title: 'Pegar datos externos',
    steps: ['Copia celdas desde Excel, Google Sheets o una tabla web.', 'Selecciona la celda inicial.', 'Presiona Ctrl/Cmd + V.', 'El motor reparte filas y columnas automáticamente.'],
  },
  {
    title: 'Crear cambios masivos de productos',
    steps: ['Importa o edita datos en la hoja de productos.', 'Una fila sin Producto ID pero con nombre/código/precio se detecta como producto nuevo.', 'Usa preparar cambios para revisar creaciones y actualizaciones.', 'Aplica cambios solo después de revisar el resumen.'],
  },
];

const errorGuides = [
  ['La fórmula no calcula', 'Revisa que empiece con =, que tenga paréntesis completos y que los argumentos estén separados por coma. Los espacios no afectan.'],
  ['Una función no aparece', 'Escribe = y parte del nombre en inglés o español. Ejemplo: =prom para PROMEDIO o =aver para AVERAGE.'],
  ['BUSCARV devuelve #N/A', 'El valor buscado debe estar en la primera columna del rango de búsqueda. Si no, usa XLOOKUP.'],
  ['Una referencia sale mal', 'Haz click o arrastra las celdas mientras editas la fórmula. Es más seguro que escribir referencias a mano.'],
  ['Pegué datos y se desacomodaron', 'Asegúrate de copiar una tabla con columnas reales. Los saltos de línea dentro de celdas externas pueden dividir filas.'],
  ['El resumen de cambios no detecta algo', 'Verifica encabezados, Producto ID, código, nombre, precio y costo. Las filas nuevas necesitan datos suficientes para crearse.'],
  ['El autocomplete se cerró', 'Presiona Escape para cerrar sugerencias. Si quieres insertar una función, usa Enter, Tab o click sobre la sugerencia.'],
  ['La selección no entra a la fórmula', 'Asegúrate de estar editando una celda que empieza con =. Si solo estás seleccionando normal, no se insertan referencias.'],
];

function normalizeSearch(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getFunctionInfo(fn) {
  const details = functionDetails[fn.name] || {};
  const base = {
    category: details.category || 'General',
    use: details.use || fn.description || 'Función disponible en el motor de fórmulas.',
    example: details.example || `=${fn.syntax}`,
    result: details.result || fn.description || 'Devuelve el resultado de la operación indicada.',
    tips: details.tips || ['Respeta la sintaxis y separa argumentos con coma.', 'Puedes usar referencias como A1, A1:B10 o Hoja!A1.'],
  };

  return {
    ...base,
    args: parseFunctionArguments(fn.syntax),
    exampleData: getExampleDataForFunction(base, fn),
    explanation: getHumanExplanation(fn, base),
  };
}

function Code({ children }) {
  return <code className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-black text-red-700 shadow-sm">{children}</code>;
}

function Kbd({ children }) {
  return <kbd className="inline-flex min-h-8 items-center rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-black text-slate-700 shadow-sm">{children}</kbd>;
}

function SectionTitle({ id, icon: Icon, title, subtitle }) {
  return (
    <div id={id} className="scroll-mt-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-red-100 bg-red-50 text-red-600 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-950">{title}</h3>
          {subtitle ? <p className="mt-1 max-w-5xl text-sm font-semibold leading-6 text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <Search className="mx-auto h-7 w-7 text-slate-400" />
      <h4 className="mt-3 text-sm font-black text-slate-900">No encontré coincidencias</h4>
      <p className="mt-1 text-sm font-semibold text-slate-500">Busca por función, shortcut o palabra clave: SUM, Ctrl + V, BUSCARV, fecha, formato, rango.</p>
    </div>
  );
}

function filterBySearch(items, search, stringify) {
  const q = normalizeSearch(search);
  if (!q) return items;
  return items.filter((item) => normalizeSearch(stringify(item)).includes(q));
}

function getSearchTextForFunction(fn) {
  const info = getFunctionInfo(fn);
  return `${fn.name} ${fn.alias || ''} ${fn.syntax || ''} ${fn.description || ''} ${info.category} ${info.use} ${info.example} ${info.result} ${(info.tips || []).join(' ')}`;
}

export default function PlaygroundHelpModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState('inicio');
  const [activeFunctionCategory, setActiveFunctionCategory] = useState('todas');
  const [functionPage, setFunctionPage] = useState(1);

  const filteredShortcuts = useMemo(() => {
    return shortcutGroups
      .map((group) => ({
        ...group,
        rows: filterBySearch(group.rows, query, ([keys, description]) => `${group.title} ${keys} ${description}`),
      }))
      .filter((group) => group.rows.length > 0 || !query);
  }, [query]);

  const filteredFunctions = useMemo(() => {
    const category = functionCategories.find((item) => item.id === activeFunctionCategory);
    const byCategory = !category || category.id === 'todas'
      ? EXCEL_FORMULA_CATALOG
      : EXCEL_FORMULA_CATALOG.filter((fn) => category.keywords?.includes(fn.name));

    return filterBySearch(byCategory, query, getSearchTextForFunction);
  }, [activeFunctionCategory, query]);

  const totalFunctionPages = Math.max(1, Math.ceil(filteredFunctions.length / FUNCTION_PAGE_SIZE));
  const currentFunctionPage = Math.min(functionPage, totalFunctionPages);
  const paginatedFunctions = filteredFunctions.slice((currentFunctionPage - 1) * FUNCTION_PAGE_SIZE, currentFunctionPage * FUNCTION_PAGE_SIZE);

  const filteredExamples = useMemo(() => filterBySearch(formulaExamples, query, (item) => `${item.title} ${item.formula} ${item.note}`), [query]);
  const filteredErrorGuides = useMemo(() => filterBySearch(errorGuides, query, ([title, text]) => `${title} ${text}`), [query]);

  const hasResults = filteredFunctions.length || filteredExamples.length || filteredErrorGuides.length || filteredShortcuts.some((group) => group.rows.length);

  function goTo(sectionId) {
    setActiveSection(sectionId);
    const element = document.getElementById(`help-${sectionId}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function selectFunctionCategory(categoryId) {
    setActiveFunctionCategory(categoryId);
    setFunctionPage(1);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/65 p-2 sm:p-4">
      <div className="flex h-[96vh] w-full max-w-[1760px] flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-5 py-5 text-white sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-red-200">
                <Sparkles className="h-3.5 w-3.5" />
                Centro de ayuda del módulo Excel
              </div>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Guía completa de uso</h2>
              <p className="mt-2 max-w-6xl text-sm font-semibold leading-6 text-slate-300">
                Documentación completa para usar la hoja: funciones, shortcuts, fórmulas, referencias, selección, importación, errores comunes y ejemplos. La meta es que el módulo se pueda reutilizar sin que tengas que explicar lo mismo como disco rayado con teclado.
              </p>
            </div>

            <button type="button" onClick={onClose} className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20" aria-label="Cerrar ayuda">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative max-w-4xl flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setFunctionPage(1);
                }}
                placeholder="Buscar dentro de toda la ayuda: SUM, BUSCARV, Ctrl + V, pegar, fecha, formato, rango, producto..."
                className="h-12 w-full rounded-2xl border border-white/10 bg-white px-11 py-3 text-sm font-semibold text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-red-300 focus:ring-4 focus:ring-red-500/20"
              />
              {query ? (
                <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 text-xs font-black text-slate-500 hover:bg-slate-100">
                  Limpiar
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center sm:flex sm:text-left">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2">
                <p className="text-xl font-black">{EXCEL_FORMULA_CATALOG.length}</p>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-300">Funciones</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2">
                <p className="text-xl font-black">{shortcutGroups.reduce((sum, group) => sum + group.rows.length, 0)}</p>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-300">Shortcuts</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2">
                <p className="text-xl font-black">{formulaExamples.length}</p>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-300">Ejemplos</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 xl:grid-cols-[300px_1fr]">
          <aside className="hidden border-r border-slate-200 bg-slate-50/80 p-4 xl:block">
            <p className="mb-3 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Contenido</p>
            <nav className="space-y-1">
              {helpSections.map(({ id, label, icon: Icon }) => {
                const active = activeSection === id;
                return (
                  <button key={id} type="button" onClick={() => goTo(id)} className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-black transition ${active ? 'bg-red-600 text-white shadow-md shadow-red-600/20' : 'text-slate-600 hover:bg-white hover:text-slate-950'}`}>
                    <span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                );
              })}
            </nav>

            <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-black text-blue-950">Tip rápido</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-blue-900">En una celda, escribe <Code>=</Code> y parte del nombre. Por ejemplo <Code>=su</Code> para ver SUM/SUMA.</p>
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto bg-white p-4 sm:p-6 xl:p-8">
            {query && !hasResults ? <EmptyState /> : null}

            <section className="space-y-12">
              <div>
                <SectionTitle id="help-inicio" icon={Lightbulb} title="Inicio rápido" subtitle="Las acciones principales para trabajar sin abrir esta ayuda cada 30 segundos, que sería una derrota elegante pero derrota al fin." />
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                  {[
                    { icon: MousePointer2, title: 'Selecciona como Excel', text: 'Click para una celda, arrastra para un rango, Shift + flechas para ampliar, Ctrl/Cmd + Espacio para columna y Shift + Espacio para fila.' },
                    { icon: Sigma, title: 'Fórmulas con ayuda', text: 'Empieza con =, escribe parte de una función y acepta sugerencias con Enter, Tab o click.' },
                    { icon: Table2, title: 'Pega desde Excel/Sheets', text: 'Copia una tabla externa y pégala. El motor reparte columnas y filas usando tabs y saltos de línea.' },
                    { icon: CheckCircle2, title: 'Revisa antes de aplicar', text: 'En productos, prepara cambios, revisa creaciones/actualizaciones y luego aplica. Nada de modificar datos a ciegas.' },
                  ].map(({ icon: Icon, title, text }) => (
                    <div key={title} className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-red-600"><Icon className="h-5 w-5" /></div>
                      <h4 className="mt-4 text-sm font-black text-slate-950">{title}</h4>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle id="help-formulas" icon={Sigma} title="Cómo usar fórmulas" subtitle="Las fórmulas aceptan espacios, referencias, rangos y alias en español. Ejemplo: = SUM ( A1 : A10 ) funciona igual que =SUM(A1:A10)." />
                <div className="grid gap-5 2xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <h4 className="text-sm font-black text-slate-950">Guías paso a paso</h4>
                    <div className="mt-4 grid gap-3">
                      {howToCards.map((card) => (
                        <details key={card.title} className="group rounded-2xl border border-slate-200 bg-white p-4 open:shadow-sm">
                          <summary className="cursor-pointer list-none text-sm font-black text-slate-950"><span className="inline-flex items-center gap-2"><ChevronRight className="h-4 w-4 transition group-open:rotate-90" />{card.title}</span></summary>
                          <ol className="mt-3 grid gap-2 pl-6 text-sm font-semibold leading-6 text-slate-600">
                            {card.steps.map((step) => <li key={step} className="list-decimal">{step}</li>)}
                          </ol>
                        </details>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="text-sm font-black text-slate-950">Ejemplos prácticos</h4>
                    <div className="mt-4 grid gap-3">
                      {filteredExamples.map((item) => (
                        <div key={item.formula} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between"><p className="text-sm font-black text-slate-950">{item.title}</p><Code>{item.formula}</Code></div>
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{item.note}</p>
                        </div>
                      ))}
                      {filteredExamples.length === 0 ? <EmptyState /> : null}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <SectionTitle id="help-funciones" icon={BookOpen} title="Funciones explicadas una por una" subtitle="Esta sección usa paginación para que el modal no se vuelva una sábana infinita. Cada función incluye uso, sintaxis, ejemplo con datos, explicación de cada argumento, cómo leerla, resultado esperado y tips." />

                <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                  {functionCategories.map((category) => {
                    const active = activeFunctionCategory === category.id;
                    return (
                      <button key={category.id} type="button" onClick={() => selectFunctionCategory(category.id)} className={`rounded-2xl border p-4 text-left transition ${active ? 'border-red-300 bg-red-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                        <p className={`text-sm font-black ${active ? 'text-red-700' : 'text-slate-950'}`}>{category.label}</p>
                        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{category.description}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">{filteredFunctions.length} funciones encontradas</p>
                    <p className="text-xs font-bold text-slate-500">Página {currentFunctionPage} de {totalFunctionPages}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" disabled={currentFunctionPage <= 1} onClick={() => setFunctionPage((page) => Math.max(1, page - 1))} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Anterior</button>
                    <button type="button" disabled={currentFunctionPage >= totalFunctionPages} onClick={() => setFunctionPage((page) => Math.min(totalFunctionPages, page + 1))} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Siguiente<ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>

                <div className="grid gap-4 2xl:grid-cols-2">
                  {paginatedFunctions.map((fn) => {
                    const info = getFunctionInfo(fn);
                    return (
                      <article key={fn.name} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-mono text-lg font-black text-slate-950">{fn.name}</h4>
                              {fn.alias ? <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">{fn.alias}</span> : null}
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{info.category}</span>
                            </div>
                            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{info.use}</p>
                          </div>
                          <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">Función</div>
                        </div>

                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Sintaxis</p>
                            <code className="mt-2 block overflow-x-auto rounded-xl bg-white px-3 py-2 font-mono text-xs font-bold text-slate-800">={fn.syntax}</code>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Ejemplo</p>
                            <code className="mt-2 block overflow-x-auto rounded-xl bg-white px-3 py-2 font-mono text-xs font-bold text-red-700">{info.example}</code>
                          </div>
                        </div>

                        <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-blue-700">Datos del ejemplo</p>
                          <ul className="mt-2 grid gap-1 text-sm font-semibold leading-6 text-blue-950">
                            {info.exampleData.map((row) => <li key={row}>• {row}</li>)}
                          </ul>
                        </div>

                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Qué significa cada dato que pide</p>
                          <div className="mt-3 grid gap-2">
                            {info.args.length ? info.args.map((arg) => (
                              <div key={`${fn.name}-${arg.name}`} className="rounded-xl border border-slate-200 bg-white p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <code className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-black text-slate-900">{arg.name}</code>
                                  {arg.optional ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">Opcional</span> : <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-red-700">Necesario</span>}
                                </div>
                                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{arg.description}</p>
                                <p className="mt-2 rounded-lg bg-slate-50 px-2 py-1 font-mono text-xs font-black text-slate-700">Ejemplo de dato: {arg.example}</p>
                              </div>
                            )) : <p className="text-sm font-semibold text-slate-600">Esta función no necesita argumentos.</p>}
                          </div>
                        </div>

                        <div className="mt-3 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-violet-700">Cómo leer el ejemplo</p>
                          <p className="mt-1 text-sm font-semibold leading-6 text-violet-950">{info.explanation}</p>
                        </div>

                        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Qué devuelve</p>
                          <p className="mt-1 text-sm font-semibold leading-6 text-emerald-900">{info.result}</p>
                        </div>

                        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-amber-700">Tips de uso</p>
                          <ul className="mt-2 grid gap-1 text-sm font-semibold leading-6 text-amber-900">
                            {info.tips.map((tip) => <li key={tip}>• {tip}</li>)}
                          </ul>
                        </div>
                      </article>
                    );
                  })}
                  {paginatedFunctions.length === 0 ? <div className="2xl:col-span-2"><EmptyState /></div> : null}
                </div>
              </div>

              <div>
                <SectionTitle id="help-shortcuts" icon={Keyboard} title="Todos los shortcuts disponibles" subtitle="Atajos agrupados por categoría. En Windows normalmente es Ctrl; en Mac normalmente es Cmd." />
                <div className="grid gap-5 2xl:grid-cols-2">
                  {filteredShortcuts.map((group) => (
                    <div key={group.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4"><h4 className="text-base font-black text-slate-950">{group.title}</h4><p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{group.description}</p></div>
                      <div className="grid gap-2">
                        {group.rows.map(([keys, description]) => (
                          <div key={`${group.title}-${keys}`} className="grid gap-3 rounded-2xl bg-slate-50 p-3 lg:grid-cols-[240px_1fr] lg:items-center"><Kbd>{keys}</Kbd><p className="text-sm font-semibold leading-6 text-slate-600">{description}</p></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle id="help-seleccion" icon={MousePointer2} title="Selección, rangos y referencias" subtitle="La parte más importante para que las fórmulas sean rápidas. Escribir A1:B10 a mano funciona, pero seleccionar con mouse reduce errores tontos." />
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5"><Layers className="h-5 w-5 text-blue-700" /><h4 className="mt-3 font-black text-blue-950">Celda individual</h4><p className="mt-2 text-sm font-semibold leading-6 text-blue-900">Haz click en una celda mientras editas una fórmula para insertar su referencia.</p><div className="mt-3"><Code>=A1</Code></div></div>
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5"><ListChecks className="h-5 w-5 text-emerald-700" /><h4 className="mt-3 font-black text-emerald-950">Rango</h4><p className="mt-2 text-sm font-semibold leading-6 text-emerald-900">Arrastra desde una celda hasta otra mientras editas una fórmula para insertar un rango.</p><div className="mt-3"><Code>=SUM(A1:A10)</Code></div></div>
                  <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5"><FileSpreadsheet className="h-5 w-5 text-violet-700" /><h4 className="mt-3 font-black text-violet-950">Otra hoja</h4><p className="mt-2 text-sm font-semibold leading-6 text-violet-900">Usa el nombre de la hoja antes del signo ! para leer valores desde otra pestaña.</p><div className="mt-3"><Code>=Productos!C2</Code></div></div>
                </div>
              </div>

              <div>
                <SectionTitle id="help-datos" icon={FileSpreadsheet} title="Datos, importación y cambios masivos" subtitle="Esto aplica cuando el módulo se usa dentro del playground de productos. El motor de Excel sigue separado; el adaptador de productos agrega estas reglas." />
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-center gap-2"><Filter className="h-5 w-5 text-red-600" /><h4 className="font-black text-slate-950">Importar datos</h4></div><ul className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-slate-600"><li>• Usa el menú Datos para importar productos o preparar cambios.</li><li>• Las filas existentes se detectan por Producto ID.</li><li>• Las filas nuevas sin Producto ID pueden crearse si tienen datos suficientes.</li><li>• La utilidad se calcula aunque no esté guardada en DB.</li><li>• Las imágenes/fotos no se crean desde carga masiva.</li></ul></div>
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5"><h4 className="font-black text-amber-950">Antes de aplicar cambios</h4><ul className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-amber-900"><li>• Revisa productos a crear.</li><li>• Revisa productos a actualizar.</li><li>• Confirma precios, costos, código y nombre.</li><li>• Evita aplicar si hay filas incompletas o columnas mal pegadas.</li><li>• Guardar la hoja no es lo mismo que aplicar cambios a productos. Sí, otro concepto para no confundirnos, qué generoso el universo.</li></ul></div>
                </div>
              </div>

              <div>
                <SectionTitle id="help-errores" icon={AlertTriangle} title="Errores comunes y cómo resolverlos" subtitle="Problemas típicos y su solución directa para no convertir cada detalle en investigación arqueológica." />
                <div className="grid gap-3 lg:grid-cols-2">
                  {filteredErrorGuides.map(([title, text]) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h4 className="text-sm font-black text-slate-950">{title}</h4><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p></div>)}
                  {filteredErrorGuides.length === 0 ? <div className="lg:col-span-2"><EmptyState /></div> : null}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
