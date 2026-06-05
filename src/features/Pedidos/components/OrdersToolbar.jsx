import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Plus, RotateCcw, SlidersHorizontal } from "lucide-react";
import SearchInput from "../../../components/ui/SearchInput";
import FilterPill from "../../../components/ui/FilterPill";
import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "../order.constants";

const MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

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
    <div className="border-b border-border bg-surface p-4 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar pedido, cliente, tracking o cotización..."
          className="w-full xl:max-w-xl"
        />

        <button
          type="button"
          onClick={onCreateManualOrder}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-5 text-sm font-black text-white transition hover:bg-accent-600"
        >
          <Plus className="h-4 w-4" />
          Nuevo pedido
        </button>
      </div>

      <section className="mt-5 rounded-[28px] border border-border bg-background p-4 md:p-5">
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(620px,0.9fr)_auto] 2xl:items-start">
          <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-start">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-soft text-text-muted">
                <SlidersHorizontal className="h-4 w-4" />
              </span>

              <div>
                <p className="text-sm font-black text-text-primary">Filtros</p>
                <p className="text-xs leading-5 text-text-muted">Lista limpia, sin tabla gigante.</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-3">
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

          <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
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
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-xs font-black text-text-secondary transition hover:bg-surface-soft hover:text-text-primary 2xl:justify-self-end"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Limpiar filtros
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

  const monthsWithOrders = useMemo(() => {
    return new Set(options.map((option) => option.value).filter((item) => item && item !== "todos"));
  }, [options]);

  const today = useMemo(() => new Date(), []);

  const selectedDate = useMemo(() => {
    if (!value || value === "todos") return null;
    const [year, month] = value.split("-").map(Number);
    if (!year || !month) return null;
    return { year, monthIndex: month - 1 };
  }, [value]);

  const [visibleYear, setVisibleYear] = useState(
    selectedDate?.year || today.getFullYear(),
  );

  useEffect(() => {
    if (selectedDate?.year) setVisibleYear(selectedDate.year);
  }, [selectedDate?.year]);

  const selectedLabel = useMemo(() => {
    if (!selectedDate) return "Todos los meses";
    return `${MONTHS[selectedDate.monthIndex]} ${selectedDate.year}`;
  }, [selectedDate]);

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

  function setMonth(year, monthIndex) {
    onChange(`${year}-${String(monthIndex + 1).padStart(2, "0")}`);
    setOpen(false);
  }

  function setCurrentMonth() {
    setMonth(today.getFullYear(), today.getMonth());
  }

  function setPreviousMonth() {
    const previous = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    setMonth(previous.getFullYear(), previous.getMonth());
  }

  function clearMonth() {
    onChange("todos");
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <span className="pointer-events-none absolute left-4 top-2 z-10 text-[10px] font-black uppercase tracking-[0.14em] text-text-muted">
        Mes
      </span>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-14 w-full items-center justify-between gap-3 rounded-2xl border px-4 pb-2 pt-6 text-left text-sm font-black outline-none transition ${
          open || value !== "todos"
            ? "border-primary-300 bg-primary-50 text-primary-800"
            : "border-border bg-surface text-text-primary hover:border-border-strong"
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-text-muted" />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+12px)] z-[80] w-[320px] max-w-[calc(100vw-2rem)] rounded-[24px] border border-border bg-surface p-3 shadow-[0_24px_70px_rgba(15,23,42,0.20)]">
          <div className="mb-3 grid grid-cols-3 gap-2">
            <ShortcutButton label="Este mes" onClick={setCurrentMonth} />
            <ShortcutButton label="Mes pasado" onClick={setPreviousMonth} />
            <ShortcutButton label="Todos" active={value === "todos"} onClick={clearMonth} />
          </div>

          <div className="flex items-center justify-between border-y border-border px-1 py-2">
            <button
              type="button"
              onClick={() => setVisibleYear((year) => year - 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition hover:bg-surface-soft hover:text-text-primary"
              aria-label="Año anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <p className="text-sm font-black text-text-primary">{visibleYear}</p>

            <button
              type="button"
              onClick={() => setVisibleYear((year) => year + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition hover:bg-surface-soft hover:text-text-primary"
              aria-label="Año siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {MONTHS.map((month, index) => {
              const monthValue = `${visibleYear}-${String(index + 1).padStart(2, "0")}`;
              const active = value === monthValue;
              const hasOrders = monthsWithOrders.has(monthValue);

              return (
                <button
                  key={monthValue}
                  type="button"
                  onClick={() => setMonth(visibleYear, index)}
                  className={`relative h-11 rounded-xl text-sm font-black transition ${
                    active
                      ? "bg-primary-600 text-white shadow-sm"
                      : "text-text-primary hover:bg-surface-soft"
                  }`}
                >
                  {month}
                  {hasOrders && !active ? (
                    <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary-500" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ShortcutButton({ label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-xl px-2 text-xs font-black transition ${
        active
          ? "bg-primary-600 text-white"
          : "bg-surface-soft text-text-primary hover:bg-primary-50 hover:text-primary-700"
      }`}
    >
      {label}
    </button>
  );
}

function CompactSelect({ label, value, onChange, options = [] }) {
  return (
    <label className="group relative block">
      <span className="pointer-events-none absolute left-4 top-2 z-10 text-[10px] font-black uppercase tracking-[0.14em] text-text-muted">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 w-full appearance-none rounded-2xl border border-border bg-surface px-4 pb-2 pt-6 text-sm font-black text-text-primary outline-none transition hover:border-border-strong focus:border-primary-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition group-focus-within:text-primary-500" />
    </label>
  );
}
