import { SlidersHorizontal } from "lucide-react";
import SearchInput from "../../../components/ui/SearchInput";
import FilterPill from "../../../components/ui/FilterPill";
import { QUOTATION_FILTERS } from "../quotation.constants";

export default function QuotationsToolbar({
  searchInput,
  setSearchInput,
  month,
  setMonth,
  monthOptions,
  status,
  setStatus,
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6">
      {/* Primera fila: Buscador y Selector de Mes */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Buscar por folio o cliente..."
          className="w-full xl:max-w-md"
        />

        <div className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary">
          <SlidersHorizontal className="h-4 w-4 text-text-muted" />
          
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-transparent outline-none cursor-pointer"
          >
            {monthOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Segunda fila: Filtros de Estado (Pills) */}
      <div className="flex flex-wrap gap-2">
        {QUOTATION_FILTERS.map(([value, label]) => (
          <FilterPill
            key={value}
            active={status === value}
            onClick={() => setStatus(value)}
            label={label}
          />
        ))}
      </div>
    </div>
  );
}