export const DASHBOARD_QUERIES = {
  cotizaciones: `
    id,
    folio,
    cliente_nombre,
    subtotal,
    descuento,
    total,
    gastos,
    ganancia,
    estado,
    notas,
    fecha_vencimiento,
    fecha_completado,
    created_at,
    updated_at
  `,
  gastos: `
    id,
    concepto,
    descripcion,
    monto,
    tipo,
    fecha,
    created_at,
    cotizacion_id
  `,
  productos: `
    id,
    nombre,
    descripcion,
    precio,
    precio_compra,
    precio_utilidad,
    disponibilidad,
    habilitado,
    cantidad,
    cantidad_caja,
    categoria,
    unidad,
    codigo,
    created_at,
    updated_at
  `,
};

export const RANGE_OPTIONS = [
  { value: "month", label: "Mes actual" },
  { value: "week", label: "Semana actual" },
  { value: "year", label: "Año actual" },
  { value: "all", label: "Todo" },
];