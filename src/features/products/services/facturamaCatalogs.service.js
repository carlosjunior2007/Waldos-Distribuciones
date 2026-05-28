import supabase from "../../../utils/supabase";

/**
 * Frontend wrapper para catálogos de Facturama.
 *
 * IMPORTANTE:
 * No pongas credenciales de Facturama en React.
 * Crea una Supabase Edge Function llamada "facturama-catalogs" que reciba:
 *
 * {
 *   catalog: "products" | "units",
 *   keyword: "limpieza"
 * }
 *
 * y que responda con un arreglo de resultados o con { data: [...] }.
 */
const CATALOG_FUNCTION_NAME = "facturama-catalogs";

export async function searchSatProductCodes(keyword) {
  return searchFacturamaCatalog({
    catalog: "products",
    keyword,
  });
}

export async function searchSatUnitCodes(keyword) {
  return searchFacturamaCatalog({
    catalog: "units",
    keyword,
  });
}

async function searchFacturamaCatalog({ catalog, keyword }) {
  const cleanKeyword = String(keyword || "").trim();

  if (cleanKeyword.length < 2) {
    return [];
  }

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
    .filter((item) => item.clave && item.descripcion);
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
    raw: item,
  };
}
