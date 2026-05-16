import { Plus } from "lucide-react";
import SearchInput from "../../../components/ui/SearchInput";
import FilterPill from "../../../components/ui/FilterPill";
import { ORDER_STATUS_OPTIONS } from "../order.constants";

export default function OrdersToolbar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onCreateManualOrder,
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar pedido o cliente..."
          className="w-full xl:max-w-md"
        />

        <button
          type="button"
          onClick={onCreateManualOrder}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600"
        >
          <Plus className="h-4 w-4" />
          Nuevo pedido
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ORDER_STATUS_OPTIONS.map(([value, label]) => (
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
