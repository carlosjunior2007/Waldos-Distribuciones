
export function capitalizeFirstLetter(value = "") {
  const text = String(value ?? "");
  const firstLetterIndex = text.search(/\p{L}/u);

  if (firstLetterIndex === -1) return text;

  return (
    text.slice(0, firstLetterIndex) +
    text.charAt(firstLetterIndex).toLocaleUpperCase("es-MX") +
    text.slice(firstLetterIndex + 1)
  );
}

export function capitalizeReceiptHeader(header = {}) {
  return {
    ...header,
    cliente_nombre: capitalizeFirstLetter(header.cliente_nombre),
    cliente_direccion: capitalizeFirstLetter(header.cliente_direccion),
    ciudad: capitalizeFirstLetter(header.ciudad),
    notas: capitalizeFirstLetter(header.notas),
  };
}

export function capitalizeReceiptItem(item = {}) {
  return {
    ...item,
    descripcion: capitalizeFirstLetter(item.descripcion),
    unidad: capitalizeFirstLetter(item.unidad),
  };
}

export function createEmptyReceiptItem() {
  return {
    producto_id: null,
    orden: 1,
    descripcion: "",
    cantidad: "1",
    unidad: "pieza",
  };
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

export function normalizeReceiptItems(items = []) {
  return items.map((item, index) => ({
    producto_id: item.producto_id || null,
    orden: Number(item.orden || index + 1),
    descripcion: item.descripcion || item.nombre_producto || "",
    cantidad: String(item.cantidad ?? "1"),
    unidad: item.unidad || "pieza",
  }));
}