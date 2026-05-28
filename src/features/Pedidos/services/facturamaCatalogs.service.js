import supabase from "../../../utils/supabase";

/**
 * Catálogos SAT/Facturama usados en pedidos/facturación.
 *
 * Requiere una Supabase Edge Function llamada "facturama-catalogs".
 * No pongas credenciales de Facturama en React, porque eso sería publicar las llaves del negocio con moñito.
 */
const CATALOG_FUNCTION_NAME = "facturama-catalogs";

export async function searchFiscalRegimes(keyword) {
  return searchFacturamaCatalog({
    catalog: "fiscalRegimes",
    keyword,
  });
}

export async function searchCfdiUses(keyword) {
  return searchFacturamaCatalog({
    catalog: "cfdiUses",
    keyword,
  });
}

export async function searchPaymentForms(keyword) {
  return searchFacturamaCatalog({
    catalog: "paymentForms",
    keyword,
  });
}

export async function searchPaymentMethods(keyword) {
  return searchFacturamaCatalog({
    catalog: "paymentMethods",
    keyword,
  });
}

export async function searchCurrencies(keyword) {
  return searchFacturamaCatalog({
    catalog: "currencies",
    keyword,
  });
}

export async function searchPostalCodes(keyword) {
  return searchFacturamaCatalog({
    catalog: "postalCodes",
    keyword,
  });
}

async function searchFacturamaCatalog({ catalog, keyword }) {
  const cleanKeyword = String(keyword || "").trim();

  if (cleanKeyword.length < 2) return [];

  const { data, error } = await supabase.functions.invoke(
    CATALOG_FUNCTION_NAME,
    {
      body: {
        catalog,
        keyword: cleanKeyword,
      },
    },
  );

  if (error) {
    throw new Error(
      error.message ||
        "No se pudo consultar el catálogo fiscal. Revisa la función facturama-catalogs.",
    );
  }

  return normalizeCatalogResponse(data);
}

function normalizeCatalogResponse(response) {
  const rows = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response?.Data)
          ? response.Data
          : [];

  return rows
    .map(normalizeCatalogItem)
    .filter((item) => item.clave || item.descripcion || item.codigoPostal);
}

function normalizeCatalogItem(item = {}) {
  const clave =
    item.clave ||
    item.Clave ||
    item.code ||
    item.Code ||
    item.id ||
    item.Id ||
    item.value ||
    item.Value ||
    item.PostalCode ||
    item.postalCode ||
    "";

  const descripcion =
    item.descripcion ||
    item.Descripcion ||
    item.description ||
    item.Description ||
    item.name ||
    item.Name ||
    item.label ||
    "";

  return {
    clave: String(clave || "").trim(),
    descripcion: String(descripcion || "").trim(),
    codigoPostal: String(item.PostalCode || item.postalCode || "").trim(),
    estado: String(item.State || item.state || item.estado || item.Estado || "").trim(),
    municipio: String(item.Municipality || item.municipality || item.municipio || item.Municipio || "").trim(),
    localidad: String(item.Locality || item.locality || item.localidad || item.Localidad || "").trim(),
    colonia: String(item.Suburb || item.suburb || item.colonia || item.Colonia || "").trim(),
    raw: item,
  };
}
