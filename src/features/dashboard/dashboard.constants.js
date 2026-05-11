export const DASHBOARD_QUERIES = {
  cotizaciones: `
    id,
    folio,
    cliente_nombre,
    subtotal,
    descuento,
    iva_porcentaje,
    total,
    estado,
    notas,
    fecha_vencimiento,
    created_at,
    updated_at
  `,

  pedidos: `
    id,
    folio,
    cotizacion_id,
    cliente_id,
    cliente_nombre,
    cliente_telefono,
    cliente_email,
    subtotal,
    descuento,
    iva_porcentaje,
    total,
    estado,
    estado_pago,
    metodo_pago,
    entrega_inicio,
    entrega_fin,
    notas,
    created_at,
    updated_at
  `,

  pedido_detalles: `
    id,
    pedido_id,
    producto_id,
    codigo,
    nombre_producto,
    cantidad_pedida,
    cantidad_entregada,
    cantidad_pendiente,
    precio_unitario,
    costo_unitario,
    importe,
    estado,
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
    cantidad_caja,
    habilitado,
    categoria,
    unidad,
    codigo,
    clave_sat,
    clave_unidad_sat,
    iva_porcentaje,
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