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