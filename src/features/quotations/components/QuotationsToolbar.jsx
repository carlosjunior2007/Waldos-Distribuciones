import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import SearchInput from "../../../components/ui/SearchInput";
import FilterPill from "../../../components/ui/FilterPill";
import { QUOTATION_FILTERS } from "../quotation.constants";

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
  const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthValue(value) {
  if (!value || value === "todas") {
    const today = new Date();

    return {
      year: today.getFullYear(),
      monthIndex: today.getMonth(),
    };
  }

  const [year, month] = String(value).split("-").map(Number);

  if (!year || !month) {
    const today = new Date();

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

function getSelectedMonthLabel(month) {
  if (month === "todas") return "Todos los meses";

  const { year, monthIndex } = parseMonthValue(month);
  return `${MONTHS[monthIndex]} ${year}`;
}

export default function QuotationsToolbar({
  searchInput,
  setSearchInput,
  month,
  setMonth,
  status,
  setStatus,
}) {
  const currentMonth = getMonthValue(0);
  const previousMonth = getMonthValue(-1);
  const hasFilters = Boolean(searchInput) || status !== "todas" || month !== currentMonth;

  const pickerRef = useRef(null);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => parseMonthValue(month).year);

  const selected = useMemo(() => parseMonthValue(month), [month]);

  useEffect(() => {
    if (!isMonthPickerOpen) return;

    function handlePointerDown(event) {
      if (!pickerRef.current?.contains(event.target)) {
        setIsMonthPickerOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isMonthPickerOpen]);

  useEffect(() => {
    if (month !== "todas") {
      setPickerYear(parseMonthValue(month).year);
    }
  }, [month]);

  function clearFilters() {
    setSearchInput("");
    setStatus("todas");
    setMonth(currentMonth);
  }

  function selectMonth(monthIndex) {
    setMonth(buildMonthValue(pickerYear, monthIndex));
    setIsMonthPickerOpen(false);
  }

  return (
    <div className="space-y-5 border-b border-border p-5 md:p-6">
      <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Buscar por folio, cliente, correo o teléfono..."
          className="w-full 2xl:max-w-lg"
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <QuickMonthButton
            active={month === currentMonth}
            onClick={() => setMonth(currentMonth)}
          >
            Este mes
          </QuickMonthButton>

          <QuickMonthButton
            active={month === previousMonth}
            onClick={() => setMonth(previousMonth)}
          >
            Mes pasado
          </QuickMonthButton>

          <QuickMonthButton
            active={month === "todas"}
            onClick={() => setMonth("todas")}
          >
            Todos
          </QuickMonthButton>

          <div ref={pickerRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMonthPickerOpen((value) => !value)}
              className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition sm:w-auto ${
                month !== "todas"
                  ? "border-accent-200 bg-accent-50 text-accent-700"
                  : "border-border bg-surface text-text-secondary hover:border-info-200 hover:bg-info-50 hover:text-info-700"
              }`}
              title="Elegir mes"
            >
              <CalendarDays className="h-4 w-4" />
              {getSelectedMonthLabel(month)}
            </button>

            {isMonthPickerOpen ? (
              <div className="absolute right-0 z-30 mt-2 w-[250px] overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-slate-950/10">
                <div className="flex h-10 items-center justify-between border-b border-border bg-surface-soft px-2">
                  <button
                    type="button"
                    onClick={() => setPickerYear((year) => year - 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition hover:bg-surface hover:text-text-primary"
                    aria-label="Año anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="text-sm font-bold text-text-primary">{pickerYear}</span>

                  <button
                    type="button"
                    onClick={() => setPickerYear((year) => year + 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition hover:bg-surface hover:text-text-primary"
                    aria-label="Año siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1 p-3">
                  {MONTHS.map((label, index) => {
                    const isActive =
                      month !== "todas" &&
                      selected.year === pickerYear &&
                      selected.monthIndex === index;

                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => selectMonth(index)}
                        className={`h-9 rounded-lg text-sm font-semibold transition ${
                          isActive
                            ? "bg-info-600 text-white shadow-sm"
                            : "text-text-secondary hover:bg-surface-soft hover:text-text-primary"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text-secondary transition hover:border-error-200 hover:bg-error-50 hover:text-error-700"
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface-soft p-3">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
          <SlidersHorizontal className="h-4 w-4" />
          Estado de cotización
        </div>

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
    </div>
  );
}

function QuickMonthButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition ${
        active
          ? "border-accent-200 bg-accent-50 text-accent-700"
          : "border-border bg-surface text-text-secondary hover:border-info-200 hover:bg-info-50 hover:text-info-700"
      }`}
    >
      {children}
    </button>
  );
}
