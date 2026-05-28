import { LOGOS_BUCKET } from "./client.constants";

export function capitalizeFirstLetter(value) {
  if (typeof value !== "string" || !value) return value;

  return value.replace(/([a-záéíóúüñ])/iu, (letter) => letter.toLocaleUpperCase("es-MX"));
}

export function capitalizeFormFields(form = {}, fields = []) {
  return fields.reduce((next, field) => {
    if (typeof next[field] === "string") {
      next[field] = capitalizeFirstLetter(next[field]);
    }

    return next;
  }, { ...form });
}

export function getStoragePathFromUrl(url, bucket = LOGOS_BUCKET) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = parsed.pathname.indexOf(marker);

    if (index === -1) return null;

    return decodeURIComponent(parsed.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

const CLIENT_CAPITALIZED_FIELDS = [
  "nombre",
  "razon_social",
  "regimen_fiscal",
  "uso_cfdi",
  "direccion",
  "ciudad",
  "estado",
  "pais",
  "notas",
];

const CLIENT_ADDRESS_CAPITALIZED_FIELDS = [
  "nombre",
  "direccion",
  "ciudad",
  "estado",
  "pais",
  "contacto_nombre",
  "notas",
];

export function buildClientPayload(form = {}) {
  const normalizedForm = capitalizeFormFields(form, CLIENT_CAPITALIZED_FIELDS);

  // IMPORTANTE:
  // No usamos "...form" porque cuando editas un cliente Supabase trae relaciones
  // como cliente_direcciones. Si mandamos esa relación dentro del update/insert
  // de clientes, Supabase intenta guardarla como si fuera una columna real y truena.
  // Las direcciones se guardan aparte en la tabla cliente_direcciones.
  const payload = {
    nombre: (normalizedForm.nombre || "").trim(),
    razon_social: (normalizedForm.razon_social || "").trim() || null,
    rfc: (form.rfc || "").trim().toUpperCase() || null,
    regimen_fiscal: (normalizedForm.regimen_fiscal || "").trim() || null,
    uso_cfdi: (normalizedForm.uso_cfdi || "").trim() || null,
    numero: (form.numero || "").trim() || null,
    correo: (form.correo || "").trim() || null,
    direccion: (normalizedForm.direccion || "").trim() || null,
    ciudad: (normalizedForm.ciudad || "").trim() || null,
    estado: (normalizedForm.estado || "").trim() || null,
    codigo_postal: (form.codigo_postal || "").trim() || null,
    pais: (normalizedForm.pais || "").trim() || null,
    logo: form.logo || null,
    notas: (normalizedForm.notas || "").trim() || null,
  };

  if (form.id) {
    payload.id = form.id;
  }

  return payload;
}

export function buildClientAddress(client = {}) {
  return [
    client.direccion,
    client.ciudad,
    client.estado,
    client.codigo_postal,
    client.pais,
  ]
    .filter(Boolean)
    .join(", ");
}

export function buildDeliveryAddress(address = {}) {
  return [
    address.direccion,
    address.ciudad,
    address.estado,
    address.codigo_postal,
    address.pais,
  ]
    .filter(Boolean)
    .join(", ");
}

export function buildClientAddressPayload(address = {}) {
  const normalizedAddress = capitalizeFormFields(address, CLIENT_ADDRESS_CAPITALIZED_FIELDS);

  return {
    id: address.id,
    nombre: (normalizedAddress.nombre || "").trim(),
    direccion: (normalizedAddress.direccion || "").trim(),
    ciudad: (normalizedAddress.ciudad || "").trim() || null,
    estado: (normalizedAddress.estado || "").trim() || null,
    codigo_postal: (address.codigo_postal || "").trim() || null,
    pais: (normalizedAddress.pais || "").trim() || "México",
    contacto_nombre: (normalizedAddress.contacto_nombre || "").trim() || null,
    contacto_telefono: (address.contacto_telefono || "").trim() || null,
    notas: (normalizedAddress.notas || "").trim() || null,
    es_principal: Boolean(address.es_principal),
    activo: address.activo !== false,
  };
}

export function sanitizeClientAddresses(addresses = []) {
  const clean = addresses
    .map(buildClientAddressPayload)
    .filter((address) => address.nombre || address.direccion);

  const principalIndex = clean.findIndex((address) => address.es_principal);

  if (clean.length && principalIndex === -1) {
    clean[0].es_principal = true;
  }

  return clean.map((address, index) => ({
    ...address,
    es_principal: index === clean.findIndex((item) => item.es_principal),
  }));
}

export function calculateOrderProfit(order = {}) {
  const details = order.details || order.pedido_detalles || [];

  const subtotal = details.reduce((sum, item) => {
    return sum + Number(item.cantidad_pedida || 0) * Number(item.precio_unitario || 0);
  }, 0);

  const cost = details.reduce((sum, item) => {
    return sum + Number(item.cantidad_pedida || 0) * Number(item.costo_unitario || 0);
  }, 0);

  const profit = subtotal - cost;
  const margin = subtotal > 0 ? (profit / subtotal) * 100 : 0;

  return {
    subtotal,
    cost,
    profit,
    margin,
  };
}

export function calculateOrderProgress(order = {}) {
  const details = order.details || order.pedido_detalles || [];

  const total = details.reduce((sum, item) => {
    return sum + Number(item.cantidad_pedida || 0);
  }, 0);

  const delivered = details.reduce((sum, item) => {
    return sum + Number(item.cantidad_entregada || 0);
  }, 0);

  const pending = Math.max(total - delivered, 0);

  return { total, delivered, pending };
}

export function getOrderDisplayStatus(order = {}) {
  const rawStatus = String(order.estado || '').toLowerCase();

  if (rawStatus === 'cancelado') return 'cancelado';
  if (rawStatus === 'borrador') return 'borrador';

  const progress = calculateOrderProgress(order);

  if (progress.total <= 0) return 'creado';
  if (progress.delivered <= 0) return 'creado';
  if (progress.pending <= 0) return 'entregado';

  return 'parcial';
}

export function isOrderProfitRealized(order = {}) {
  return (
    getOrderDisplayStatus(order) === 'entregado' &&
    String(order.estado_pago || '').toLowerCase() === 'pagado'
  );
}

export function getClientOrderTotals(orders = []) {
  return orders.reduce(
    (acc, order) => {
      const profit = calculateOrderProfit(order);

      acc.count += 1;
      acc.total += Number(order.total || 0);
      acc.estimatedProfit += profit.profit;
      acc.estimatedCost += profit.cost;

      if (isOrderProfitRealized(order)) {
        acc.realizedTotal += Number(order.total || 0);
        acc.realizedProfit += profit.profit;
        acc.realizedCost += profit.cost;
      }

      return acc;
    },
    {
      count: 0,
      total: 0,
      estimatedProfit: 0,
      estimatedCost: 0,
      realizedTotal: 0,
      realizedProfit: 0,
      realizedCost: 0,
    },
  );
}
