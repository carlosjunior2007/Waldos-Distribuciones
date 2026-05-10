import { Download, Loader2 } from "lucide-react";
import SearchInput from "../../../components/ui/SearchInput";
import FilterPill from "../../../components/ui/FilterPill";

export default function ProductsToolbar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  filteredProducts,
  isExportingPDF,
  onExportExcel,
  onExportPDF,
  onImportExcel,
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, código o categoría. Usa comas para varios..."
          className="w-full xl:max-w-md"
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft">
            Subir Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => onImportExcel(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={onExportExcel}
            disabled={filteredProducts.length === 0}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Descargar Excel
          </button>

          <button
            type="button"
            onClick={onExportPDF}
            disabled={filteredProducts.length === 0 || isExportingPDF}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExportingPDF ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Descargar PDF
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["todos", "Todos"],
          ["activo", "Activos"],
          ["stock_bajo", "Stock bajo"],
          ["agotado", "Agotados"],
          ["oculto", "Ocultos"],
        ].map(([value, label]) => (
          <FilterPill
            key={value}
            label={label}
            active={statusFilter === value}
            onClick={() => setStatusFilter(value)}
          />
        ))}
      </div>
    </div>
  );
}
