import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, Plus, RotateCcw, SlidersHorizontal } from "lucide-react";
import SearchInput from "../../../components/ui/SearchInput";
import FilterPill from "../../../components/ui/FilterPill";
import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "../order.constants";

export default function OrdersToolbar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  monthFilter,
  setMonthFilter,
  monthOptions = [],
  paymentFilter,
  setPaymentFilter,
  quotationFilter,
  setQuotationFilter,
  onCreateManualOrder,
}) {
  const hasFilters =
    monthFilter !== "todos" ||
    paymentFilter !== "todos" ||
    quotationFilter !== "todos" ||
    statusFilter !== "todos";

  function clearFilters() {
    setStatusFilter("todos");
    setMonthFilter("todos");
    setPaymentFilter("todos");
    setQuotationFilter("todos");
  }

  return (
    <div className="border-b border-border bg-surface p-4 md:p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar pedido, cliente, tracking o cotización..."
          className="w-full xl:max-w-lg"
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

      <section className="mt-4 rounded-[22px] border border-border bg-background px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex shrink-0 items-center gap-2 pr-1">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-surface-soft text-text-muted">
              <SlidersHorizontal className="h-4 w-4" />
            </span>

            <div>
              <p className="text-sm font-black text-text-primary">Filtros</p>
              <p className="text-xs text-text-muted">Refina la lista sin salir de pedidos.</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {ORDER_STATUS_OPTIONS.map(([value, label]) => (
              <FilterPill
                key={value}
                label={label}
                active={statusFilter === value}
                onClick={() => setStatusFilter(value)}
              />
            ))}
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-2 md:grid-cols-3 xl:w-[620px] xl:shrink-0">
            <MonthPopover
              value={monthFilter}
              onChange={setMonthFilter}
              options={monthOptions}
            />

            <CompactSelect
              label="Pago"
              value={paymentFilter}
              onChange={setPaymentFilter}
              options={[
                { value: "todos", label: "Todos los pagos" },
                ...PAYMENT_STATUS_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                })),
              ]}
            />

            <CompactSelect
              label="Origen"
              value={quotationFilter}
              onChange={setQuotationFilter}
              options={[
                { value: "todos", label: "Todos los pedidos" },
                { value: "con_cotizacion", label: "Con cotización" },
                { value: "sin_cotizacion", label: "Sin cotización" },
              ]}
            />
          </div>

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-3 text-xs font-bold text-text-secondary transition hover:bg-surface-soft hover:text-text-primary"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Limpiar
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function MonthPopover({ value, onChange, options = [] }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const safeOptions = useMemo(() => {
    return options.length ? options : [{ value: "todos", label: "Todos los meses" }];
  }, [options]);

  const selected = safeOptions.find((option) => option.value === value) || safeOptions[0];

  useEffect(() => {
    if (!open) return undefined;

    function handleClickOutside(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleSelect(nextValue) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <span className="pointer-events-none absolute left-3 top-1.5 z-10 text-[10px] font-black uppercase tracking-[0.14em] text-text-muted">
        Mes
      </span>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-2xl border px-3 pb-1.5 pt-5 text-left text-sm font-bold outline-none transition ${
          open || value !== "todos"
            ? "border-primary-300 bg-primary-50 text-primary-800"
            : "border-border bg-surface text-text-primary hover:border-border-strong"
        }`}
      >
        <span className="truncate">{selected?.label || "Todos los meses"}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-text-muted" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[80] rounded-[22px] border border-border bg-surface p-2 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
          <div className="max-h-72 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-1">
              {safeOptions.map((option) => {
                const active = value === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`rounded-2xl px-3 py-2.5 text-left text-sm font-bold transition ${
                      active
                        ? "bg-primary-600 text-white"
                        : "text-text-primary hover:bg-surface-soft"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CompactSelect({ label, value, onChange, options = [] }) {
  return (
    <label className="group relative block">
      <span className="pointer-events-none absolute left-3 top-1.5 z-10 text-[10px] font-black uppercase tracking-[0.14em] text-text-muted">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-2xl border border-border bg-surface px-3 pb-1.5 pt-5 text-sm font-bold text-text-primary outline-none transition hover:border-border-strong focus:border-primary-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition group-focus-within:text-primary-500" />
    </label>
  );
}
