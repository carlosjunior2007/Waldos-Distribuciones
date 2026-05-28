import SearchInput from "../../../components/ui/SearchInput";
import FilterPill from "../../../components/ui/FilterPill";
import { STATUS_FILTERS } from "../proveedores.constants";

export default function ProveedoresToolbar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border p-5 md:p-6">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar proveedor, RFC, correo, contacto o ciudad..."
        className="w-full xl:max-w-lg"
      />

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(([value, label]) => (
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
