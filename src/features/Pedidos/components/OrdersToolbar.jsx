import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
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

function getMonthValue(offset = 0) {
  const today = new Date();
  const date = new Date(today.getFullYear(), today.getMonth() + offset, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthValue(value) {
  const today = new Date();

  if (!value || value === "todos") {
    return {
      year: today.getFullYear(),
      monthIndex: today.getMonth(),
    };
  }

  const [year, month] = String(value).split("-").map(Number);

  if (!year || !month) {
    return {
      year: today.getFullYear(),
      monthIndex: today.getMonth(),
    };
  }

  return {
    year,
    monthIndex: month - 1,
  };
}

function buildMonthValue(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function getSelectedMonthLabel(value) {
  if (!value || value === "todos") return "Todos los meses";

  const { year, monthIndex } = parseMonthValue(value);
  return `${MONTHS[monthIndex] || "Mes"} ${year}`;
}

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

      <section className="mt-5 rounded-[26px] border border-border bg-background p-5 md:p-6">
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(620px,760px)] 2xl:items-start">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start">
            <div className="flex shrink-0 items-center gap-3 lg:w-[210px]">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-soft text-text-muted">
                <SlidersHorizontal className="h-4 w-4" />
              </span>

              <div>
                <p className="text-sm font-black text-text-primary">Filtros</p>
                <p className="mt-0.5 text-xs leading-5 text-text-muted">
                  Refina la lista sin salir de pedidos.
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 pt-0.5">
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

          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-end">
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 md:grid-cols-3 lg:max-w-[760px]">
              <MonthPicker
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
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-xs font-bold text-text-secondary transition hover:bg-surface-soft hover:text-text-primary"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpiar
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function MonthPicker({ value, onChange, options = [] }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const currentMonth = getMonthValue(0);
  const previousMonth = getMonthValue(-1);
  const [pickerYear, setPickerYear] = useState(() => parseMonthValue(value).year);

  const selected = useMemo(() => parseMonthValue(value), [value]);
  const availableMonths = useMemo(() => {
    return new Set(
      options
        .map((option) => option.value)
        .filter((optionValue) => optionValue && optionValue !== "todos"),
    );
  }, [options]);

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

  useEffect(() => {
    if (value !== "todos") {
      setPickerYear(parseMonthValue(value).year);
    }
  }, [value]);

  function selectMonth(monthIndex) {
    onChange(buildMonthValue(pickerYear, monthIndex));
    setOpen(false);
  }

  function selectQuickMonth(nextValue) {
    onChange(nextValue);
    if (nextValue !== "todos") {
      setPickerYear(parseMonthValue(nextValue).year);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <span className="pointer-events-none absolute left-3 top-1.5 z-10 text-[10px] font-black uppercase tracking-[0.14em] text-text-muted">
        Mes
      </span>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 pb-1.5 pt-5 text-left text-sm font-bold outline-none transition ${
          open || value !== "todos"
            ? "border-primary-300 bg-primary-50 text-primary-800"
            : "border-border bg-surface text-text-primary hover:border-border-strong"
        }`}
        title="Elegir mes"
      >
        <span className="truncate">{getSelectedMonthLabel(value)}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-text-muted" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-[80] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_18px_50px_rgba(15,23,42,0.18)] md:right-auto md:w-[280px]">
          <div className="grid grid-cols-3 gap-2 border-b border-border bg-surface p-3">
            <QuickMonthButton
              active={value === currentMonth}
              onClick={() => selectQuickMonth(currentMonth)}
            >
              Este mes
            </QuickMonthButton>

            <QuickMonthButton
              active={value === previousMonth}
              onClick={() => selectQuickMonth(previousMonth)}
            >
              Mes pasado
            </QuickMonthButton>

            <QuickMonthButton
              active={value === "todos"}
              onClick={() => selectQuickMonth("todos")}
            >
              Todos
            </QuickMonthButton>
          </div>

          <div className="flex h-10 items-center justify-between border-b border-border bg-surface-soft px-2">
            <button
              type="button"
              onClick={() => setPickerYear((year) => year - 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition hover:bg-surface hover:text-text-primary"
              aria-label="Año anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-sm font-black text-text-primary">{pickerYear}</span>

            <button
              type="button"
              onClick={() => setPickerYear((year) => year + 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition hover:bg-surface hover:text-text-primary"
              aria-label="Año siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 p-4">
            {MONTHS.map((label, index) => {
              const monthValue = buildMonthValue(pickerYear, index);
              const active =
                value !== "todos" &&
                selected.year === pickerYear &&
                selected.monthIndex === index;
              const hasOrders = availableMonths.has(monthValue);

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => selectMonth(index)}
                  className={`relative h-10 rounded-xl text-sm font-bold transition ${
                    active
                      ? "bg-primary-600 text-white shadow-sm"
                      : "text-text-secondary hover:bg-surface-soft hover:text-text-primary"
                  }`}
                >
                  {label}
                  {hasOrders && !active ? (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary-400" />
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

function QuickMonthButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center justify-center rounded-xl px-2 text-[11px] font-black transition ${
        active
          ? "bg-primary-600 text-white"
          : "text-text-secondary hover:bg-surface-soft hover:text-text-primary"
      }`}
    >
      {children}
    </button>
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
        className="h-12 w-full appearance-none rounded-2xl border border-border bg-surface px-4 pb-1.5 pt-5 text-sm font-bold text-text-primary outline-none transition hover:border-border-strong focus:border-primary-400"
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
