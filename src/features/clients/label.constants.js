export const COMPANY_STORAGE_KEY = "logosClientes";

export const COMPANY_DEFAULTS = {
  showCompanyLogo: false,
  showClientName: true,
  showClientPhone: true,
  showClientEmail: false,
  showClientLogo: true,
  companyLogo: "/Logo.png",
};

export const INITIAL_LABEL_FORM = {
  cliente_id: "",
  producto_id: "",
  codigo_barras: "",
  codigo: "",
  texto_extra: "",
  ancho_mm: 100,
  alto_mm: 75,
};

export function normalizeCompanyOptions(options = {}) {
  const merged = {
    ...COMPANY_DEFAULTS,
    ...options,
  };

  return {
    ...merged,
    showCompanyLogo: Boolean(merged.showCompanyLogo),
    companyLogo: merged.companyLogo === "/camion.png" ? "/Logo.png" : merged.companyLogo || "/Logo.png",
  };
}
