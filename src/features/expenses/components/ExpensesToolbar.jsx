import { CalendarDays, Download } from "lucide-react";

import SearchInput from "../../../components/ui/SearchInput";
import FilterPill from "../../../components/ui/FilterPill";

export default function ExpensesToolbar({ expenses }) {
  return (
    <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <SearchInput
          value={expenses.search}
          onChange={expenses.setSearch}
          placeholder="Buscar por folio, cliente, correo, teléfono..."
          className="w-full xl:max-w-md"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DateInput value={expenses.dateFrom} onChange={expenses.setDateFrom} />
          <DateInput value={expenses.dateTo} onChange={expenses.setDateTo} />

          <button
            type="button"
            onClick={expenses.exportToExcel}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition hover:border-border-strong hover:bg-surface-soft"
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterPill
          label="Todos"
          active={expenses.quickFilter === "todos"}
          onClick={() => expenses.setQuickFilter("todos")}
        />

        <FilterPill
          label="Ganancias"
          active={expenses.quickFilter === "ganancias"}
          onClick={() => expenses.setQuickFilter("ganancias")}
        />

        <FilterPill
          label="Gastos"
          active={expenses.quickFilter === "gastos"}
          onClick={() => expenses.setQuickFilter("gastos")}
        />

        <FilterPill label="Mes actual" onClick={expenses.setCurrentMonthRange} />

        <FilterPill
          label="Últimos 30 días"
          onClick={expenses.setLast30DaysRange}
        />

        <FilterPill label="Año actual" onClick={expenses.setThisYearRange} />
      </div>
    </div>
  );
}

function DateInput({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2">
      <CalendarDays className="h-4 w-4 text-text-muted" />

      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm text-text-primary outline-none"
      />
    </div>
  );
}