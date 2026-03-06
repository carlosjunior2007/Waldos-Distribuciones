export function generarCodigoProducto(id) {
  const corto = id.replace(/-/g, "").slice(0,6).toUpperCase();
  return `WAL-${corto}`;
}