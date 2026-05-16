import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, ClipboardCheck, CopyCheck, Save } from "lucide-react";
import Modal from "../../../components/ui/Modal";

const WEEK_DAYS = [
  { value: "mon", label: "Lun" },
  { value: "tue", label: "Mar" },
  { value: "wed", label: "Mié" },
  { value: "thu", label: "Jue" },
  { value: "fri", label: "Vie" },
  { value: "sat", label: "Sáb" },
  { value: "sun", label: "Dom" },
];

export default function RecurringOrderModal({ open, order, saving = false, onClose, onSave }) {
  const [frequency, setFrequency] = useState(order?.recurrence?.type || "monthly");
  const [monthDay, setMonthDay] = useState(15);
  const [selectedWeekDays, setSelectedWeekDays] = useState(["mon"]);
  const [customEvery, setCustomEvery] = useState(2);
  const [customUnit, setCustomUnit] = useState("months");
  const [systemAction, setSystemAction] = useState("draft_order");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deliveryDays, setDeliveryDays] = useState(String(order?.dias_entrega || 1));
  const [quantities, setQuantities] = useState(() => {
    const initial = {};
    (order?.details || []).forEach((item) => {
      initial[item.id] = Number(item.cantidad_pedida || 0);
    });
    return initial;
  });


  useEffect(() => {
    if (!open || !order) return;

    const recurrence = order.active_recurrence;
    if (recurrence) {
      setFrequency(recurrence.frecuencia || "monthly");
      setMonthDay(Number(recurrence.dia_mes || 15));
      setSelectedWeekDays(Array.isArray(recurrence.dias_semana) && recurrence.dias_semana.length ? recurrence.dias_semana : ["mon"]);
      setCustomEvery(Number(recurrence.cada || 1));
      setCustomUnit(recurrence.unidad || "months");
      setSystemAction(recurrence.accion || "draft_order");
      setDeliveryDays(String(recurrence.dias_entrega || 1));
    } else {
      setFrequency("monthly");
      setMonthDay(15);
      setSelectedWeekDays(["mon"]);
      setCustomEvery(2);
      setCustomUnit("months");
      setSystemAction("draft_order");
      setDeliveryDays("1");
    }

    const initial = {};
    (order.details || []).forEach((item) => {
      initial[item.id] = Number(item.cantidad_pedida || 0);
    });
    setQuantities(initial);
  }, [open, order]);

  useEffect(() => {
    const nextStartDate = getNextStartDate({ frequency, monthDay, selectedWeekDays, customEvery, customUnit });
    const safeDeliveryDays = parsePositiveInteger(deliveryDays);
    const nextEndDate = safeDeliveryDays ? addBusinessDaysInclusive(nextStartDate, safeDeliveryDays) : null;

    setStartDate(formatDateInput(nextStartDate));
    setEndDate(formatDateInput(nextEndDate));
  }, [frequency, monthDay, selectedWeekDays, customEvery, customUnit, deliveryDays]);

  const products = order?.details || [];
  const selectedProductCount = products.filter((item) => Number(quantities[item.id] || 0) > 0).length;
  const totalQuantity = products.reduce((acc, item) => acc + Number(quantities[item.id] || 0), 0);
  const safeDeliveryDays = parsePositiveInteger(deliveryDays);

  const frequencySummary = useMemo(() => {
    if (frequency === "monthly") return `Mensual · día ${monthDay}`;

    if (frequency === "weekly") {
      const days = getSelectedDaysLabel(selectedWeekDays);
      return `Semanal · ${days || "sin días"}`;
    }

    if (customUnit === "weeks") {
      const days = getSelectedDaysLabel(selectedWeekDays);
      return `Cada ${customEvery || 1} semana${Number(customEvery) === 1 ? "" : "s"} · ${days || "sin días"}`;
    }

    if (customUnit === "months") return `Cada ${customEvery || 1} mes${Number(customEvery) === 1 ? "" : "es"} · día ${monthDay}`;

    return `Cada ${customEvery || 1} día${Number(customEvery) === 1 ? "" : "s"}`;
  }, [frequency, monthDay, selectedWeekDays, customEvery, customUnit]);

  function toggleWeekDay(day) {
    setSelectedWeekDays((current) => {
      if (current.includes(day)) return current.filter((item) => item !== day);
      return [...current, day];
    });
  }

  function updateQuantity(itemId, value) {
    if (value === "") {
      setQuantities((current) => ({ ...current, [itemId]: "" }));
      return;
    }

    const safeValue = Math.max(0, Number(value));
    setQuantities((current) => ({ ...current, [itemId]: safeValue }));
  }

  function copyOriginalQuantities() {
    const next = {};
    products.forEach((item) => {
      next[item.id] = Number(item.cantidad_pedida || 0);
    });
    setQuantities(next);
  }

  function clearQuantities() {
    const next = {};
    products.forEach((item) => {
      next[item.id] = 0;
    });
    setQuantities(next);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const productsPayload = products.map((item) => ({
      id: item.id,
      pedido_detalle_id: item.id,
      producto_id: item.producto_id,
      codigo: item.codigo,
      nombre_producto: item.nombre_producto,
      cantidad: Number(quantities[item.id] || 0),
      precio_unitario: Number(item.precio_unitario || 0),
    }));

    onSave?.({
      order,
      rule: {
        frequency,
        monthDay,
        selectedWeekDays,
        customEvery,
        customUnit,
        systemAction,
        startDate,
        endDate,
        deliveryDays: safeDeliveryDays || 1,
      },
      products: productsPayload,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={order?.is_recurrent ? `Editar recurrencia · ${order.folio}` : order ? `Pedido recurrente · ${order.folio}` : "Pedido recurrente"}
      subtitle={order?.is_recurrent ? "Edita la regla activa de este pedido." : "Crea una regla para repetir este pedido."}
      width="max-w-6xl"
    >
      <form onSubmit={handleSubmit} className="bg-surface-soft p-4 md:p-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <section className="rounded-[22px] border border-border bg-background p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <SummaryItem label="Cliente" value={order?.cliente_nombre || "Cliente seleccionado"} />
                <SummaryItem label="Pedido base" value={order?.folio || "Pedido actual"} />
                <SummaryItem label="Productos" value={`${products.length} producto${products.length === 1 ? "" : "s"}`} />
              </div>
            </section>

            <section className="rounded-[22px] border border-border bg-background p-4 shadow-sm">
              <SectionTitle icon={<CalendarDays className="h-5 w-5" />} title="Repetición" />

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[260px_1fr]">
                <div className="space-y-2">
                  <RepeatOption
                    active={frequency === "monthly"}
                    title="Cada mes"
                    detail="Mismo día del mes"
                    onClick={() => setFrequency("monthly")}
                  />
                  <RepeatOption
                    active={frequency === "weekly"}
                    title="Cada semana"
                    detail="Uno o varios días"
                    onClick={() => setFrequency("weekly")}
                  />
                  <RepeatOption
                    active={frequency === "custom"}
                    title="Otro ritmo"
                    detail="Días, semanas o meses"
                    onClick={() => setFrequency("custom")}
                  />
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  {frequency === "monthly" && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[170px_1fr] md:items-end">
                      <Field label="Día del mes">
                        <NumberInput value={monthDay} min={1} max={31} onChange={setMonthDay} />
                      </Field>
                      <InlineNote text={`Se repetirá el día ${monthDay || "—"} de cada mes.`} />
                    </div>
                  )}

                  {frequency === "weekly" && (
                    <WeekDaysPicker selectedWeekDays={selectedWeekDays} onToggle={toggleWeekDay} />
                  )}

                  {frequency === "custom" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[150px_200px]">
                        <Field label="Cada">
                          <NumberInput value={customEvery} min={1} onChange={setCustomEvery} />
                        </Field>
                        <Field label="Periodo">
                          <select className={inputClass} value={customUnit} onChange={(event) => setCustomUnit(event.target.value)}>
                            <option value="days">Días</option>
                            <option value="weeks">Semanas</option>
                            <option value="months">Meses</option>
                          </select>
                        </Field>
                      </div>

                      {customUnit === "days" && <InlineNote text={`Se repetirá cada ${customEvery || "—"} día${Number(customEvery) === 1 ? "" : "s"}.`} />}

                      {customUnit === "weeks" && (
                        <div className="rounded-2xl border border-border bg-background p-3">
                          <WeekDaysPicker selectedWeekDays={selectedWeekDays} onToggle={toggleWeekDay} />
                        </div>
                      )}

                      {customUnit === "months" && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-[170px_1fr] md:items-end">
                          <Field label="Día del mes">
                            <NumberInput value={monthDay} min={1} max={31} onChange={setMonthDay} />
                          </Field>
                          <InlineNote text={`Cada ${customEvery || "—"} mes${Number(customEvery) === 1 ? "" : "es"}, el día ${monthDay || "—"}.`} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[22px] border border-border bg-background p-4 shadow-sm">
              <SectionTitle icon={<CalendarDays className="h-5 w-5" />} title="Periodo" />

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_180px]">
                <Field label="Inicio calculado">
                  <input type="date" className={`${inputClass} bg-surface-soft font-semibold`} value={startDate} readOnly />
                </Field>

                <Field label="Fin calculado">
                  <input type="date" className={`${inputClass} bg-surface-soft font-semibold`} value={endDate} readOnly />
                </Field>

                <Field label="Días de entrega">
                  <input
                    type="number"
                    min="1"
                    className={inputClass}
                    value={deliveryDays}
                    onChange={(event) => setDeliveryDays(onlyDigits(event.target.value))}
                    onBlur={() => setDeliveryDays((value) => value || "1")}
                  />
                </Field>
              </div>

              <p className="mt-3 text-xs font-medium text-text-muted">
                Se calcula con la repetición elegida y solo cuenta días hábiles.
              </p>
            </section>

            <section className="rounded-[22px] border border-border bg-background p-4 shadow-sm">
              <SectionTitle icon={<ClipboardCheck className="h-5 w-5" />} title="Acción" />

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <ActionCard
                  active={systemAction === "draft_order"}
                  icon={<ClipboardCheck className="h-5 w-5" />}
                  title="Borrador"
                  description="Se revisa antes de confirmar."
                  onClick={() => setSystemAction("draft_order")}
                />
                <ActionCard
                  active={systemAction === "confirmed_order"}
                  icon={<CopyCheck className="h-5 w-5" />}
                  title="Pedido confirmado"
                  description="Se crea directo."
                  onClick={() => setSystemAction("confirmed_order")}
                />
                <ActionCard
                  active={systemAction === "reminder_only"}
                  icon={<Bell className="h-5 w-5" />}
                  title="Recordatorio"
                  description="No crea pedido."
                  onClick={() => setSystemAction("reminder_only")}
                />
              </div>
            </section>

            {systemAction !== "reminder_only" && (
              <section className="rounded-[22px] border border-border bg-background p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SectionTitle icon={<CopyCheck className="h-5 w-5" />} title="Productos" />
                  <div className="flex gap-2">
                    <button type="button" onClick={copyOriginalQuantities} className={ghostButtonClass}>Copiar actual</button>
                    <button type="button" onClick={clearQuantities} className={ghostButtonClass}>Poner en 0</button>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                  <div className="overflow-x-auto">
                    <table className="min-w-[720px] w-full text-sm">
                      <thead className="bg-surface-soft">
                        <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                          <th className="px-4 py-3">Producto</th>
                          <th className="px-4 py-3 text-right">Cantidad</th>
                          <th className="px-4 py-3 text-right">Precio</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-border bg-surface">
                        {products.map((item) => (
                          <tr key={item.id} className={Number(quantities[item.id] || 0) > 0 ? "bg-primary-50/30" : ""}>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-text-primary">{item.nombre_producto}</div>
                              <div className="mt-1 text-xs text-text-muted">{item.codigo || "Sin código"}</div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                min="0"
                                className="ml-auto h-10 w-28 rounded-xl border border-border bg-background px-3 text-right text-sm font-semibold text-text-primary outline-none focus:border-primary-400"
                                value={quantities[item.id] ?? 0}
                                onChange={(event) => updateQuantity(item.id, event.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3 text-right text-text-secondary">${Number(item.precio_unitario || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </div>

          <aside className="h-fit rounded-[22px] border border-border bg-background p-4 shadow-sm xl:sticky xl:top-4">
            <h4 className="text-sm font-bold text-text-primary">Resumen</h4>
            <div className="mt-4 space-y-3">
              <ReviewRow label="Cliente" value={order?.cliente_nombre || "Cliente seleccionado"} />
              <ReviewRow label="Frecuencia" value={frequencySummary} />
              <ReviewRow label="Periodo" value={formatPeriod(startDate, endDate)} />
              <ReviewRow label="Entrega" value={`${safeDeliveryDays || "—"} día${safeDeliveryDays === 1 ? "" : "s"}`} />
              <ReviewRow label="Acción" value={getSystemActionLabel(systemAction)} />
              {systemAction !== "reminder_only" && <ReviewRow label="Productos" value={`${selectedProductCount} · ${totalQuantity} unidades`} />}
            </div>

            <div className="mt-5 rounded-2xl border border-primary-100 bg-primary-50 p-3 text-sm text-primary-900">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Las entregas no se crean aquí. Solo se repite el pedido.</p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-border bg-background px-4 text-sm font-semibold text-text-secondary hover:bg-surface">
            Cancelar
          </button>

          <button type="submit" disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent-500 px-4 text-sm font-semibold text-white shadow-sm hover:bg-accent-600 disabled:opacity-60">
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : order?.is_recurrent ? "Actualizar recurrencia" : "Guardar recurrencia"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const inputClass =
  "h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-text-primary outline-none focus:border-primary-400 disabled:cursor-not-allowed disabled:opacity-70";

const ghostButtonClass =
  "h-10 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-text-secondary shadow-sm hover:border-primary-300 hover:text-primary-700";

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface-soft text-text-primary">{icon}</div>
      <h4 className="text-sm font-bold text-text-primary">{title}</h4>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-surface px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-text-primary">{value}</p>
    </div>
  );
}

function RepeatOption({ active, title, detail, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
        active ? "border-primary-400 bg-primary-50 shadow-sm" : "border-border bg-surface hover:border-primary-200 hover:bg-surface-soft"
      }`}
    >
      <span className={`h-3 w-3 shrink-0 rounded-full ${active ? "bg-primary-500 ring-4 ring-primary-100" : "bg-border"}`} />
      <span className="min-w-0">
        <span className="block text-sm font-bold text-text-primary">{title}</span>
        <span className="mt-0.5 block text-xs font-medium text-text-muted">{detail}</span>
      </span>
    </button>
  );
}

function NumberInput({ value, min = 0, max, onChange }) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      className={inputClass}
      value={value}
      onChange={(event) => onChange(clampNumberInput(event.target.value, min, max))}
      onBlur={() => onChange((current) => current || String(min))}
    />
  );
}

function InlineNote({ text }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text-secondary">
      {text}
    </div>
  );
}

function WeekDaysPicker({ selectedWeekDays, onToggle }) {
  return (
    <div>
      <p className="text-sm font-semibold text-text-primary">Días</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {WEEK_DAYS.map((day) => (
          <DayChip key={day.value} active={selectedWeekDays.includes(day.value)} onClick={() => onToggle(day.value)}>
            {day.label}
          </DayChip>
        ))}
      </div>
    </div>
  );
}

function DayChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 min-w-14 rounded-xl border px-4 text-sm font-bold transition ${
        active ? "border-primary-500 bg-primary-500 text-white" : "border-border bg-background text-text-secondary hover:border-primary-300 hover:text-primary-700"
      }`}
    >
      {children}
    </button>
  );
}

function ActionCard({ active, icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
        active ? "border-primary-400 bg-primary-50 shadow-sm" : "border-border bg-surface hover:border-primary-200 hover:bg-surface-soft"
      }`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${active ? "bg-primary-500 text-white" : "bg-background text-text-secondary"}`}>
        {icon}
      </span>
      <span>
        <span className="block text-sm font-bold text-text-primary">{title}</span>
        <span className="mt-0.5 block text-sm text-text-secondary">{description}</span>
      </span>
    </button>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-bold text-text-primary">{value}</p>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-text-primary">{label}</span>
      {children}
    </label>
  );
}

function onlyDigits(value) {
  return String(value).replace(/[^0-9]/g, "");
}

function clampNumberInput(value, min = 0, max) {
  const digits = onlyDigits(value);
  if (digits === "") return "";

  let number = Number(digits);
  if (Number.isFinite(min)) number = Math.max(min, number);
  if (Number.isFinite(max)) number = Math.min(max, number);

  return String(number);
}

function parsePositiveInteger(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 1) return null;
  return Math.floor(number);
}

function getSelectedDaysLabel(selectedWeekDays) {
  return WEEK_DAYS.filter((day) => selectedWeekDays.includes(day.value)).map((day) => day.label).join(", ");
}

function getSystemActionLabel(value) {
  const labels = {
    draft_order: "Crear borrador",
    confirmed_order: "Crear pedido",
    reminder_only: "Solo recordar",
  };
  return labels[value] || "Crear borrador";
}

function formatPeriod(startDate, endDate) {
  if (!startDate && !endDate) return "Sin fechas";
  if (startDate && !endDate) return `Desde ${startDate}`;
  if (!startDate && endDate) return `Hasta ${endDate}`;
  return `${startDate} a ${endDate}`;
}

function getNextStartDate({ frequency, monthDay, selectedWeekDays, customEvery, customUnit }) {
  const today = stripTime(new Date());

  if (frequency === "monthly" || (frequency === "custom" && customUnit === "months")) {
    return adjustToBusinessDay(getNextMonthlyDate(today, monthDay, frequency === "custom" ? Number(customEvery || 1) : 1));
  }

  if (frequency === "weekly" || (frequency === "custom" && customUnit === "weeks")) {
    return adjustToBusinessDay(getNextWeekdayDate(today, selectedWeekDays));
  }

  if (frequency === "custom" && customUnit === "days") {
    const date = new Date(today);
    date.setDate(date.getDate() + Number(customEvery || 1));
    return adjustToBusinessDay(date);
  }

  return adjustToBusinessDay(today);
}

function getNextMonthlyDate(today, dayOfMonth, everyMonths = 1) {
  const safeDay = Math.min(Math.max(Number(dayOfMonth || 1), 1), 31);
  let year = today.getFullYear();
  let month = today.getMonth();
  let candidate = buildMonthDate(year, month, safeDay);

  if (candidate <= today) {
    month += Number(everyMonths || 1);
    year += Math.floor(month / 12);
    month = month % 12;
    candidate = buildMonthDate(year, month, safeDay);
  }

  return candidate;
}

function buildMonthDate(year, monthIndex, dayOfMonth) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(dayOfMonth, lastDay));
}

function getNextWeekdayDate(today, selectedWeekDays = []) {
  const selectedIndexes = selectedWeekDays
    .map((value) => WEEK_DAYS.findIndex((day) => day.value === value))
    .filter((index) => index >= 0)
    .map((index) => (index + 1) % 7);

  if (!selectedIndexes.length) return today;

  for (let offset = 1; offset <= 7; offset += 1) {
    const candidate = new Date(today);
    candidate.setDate(candidate.getDate() + offset);
    if (selectedIndexes.includes(candidate.getDay())) return candidate;
  }

  return today;
}

function addBusinessDaysInclusive(startDate, days) {
  let remaining = Math.max(1, Number(days || 1));
  let current = adjustToBusinessDay(startDate);

  while (remaining > 1) {
    current.setDate(current.getDate() + 1);
    if (!isWeekend(current)) remaining -= 1;
  }

  return current;
}

function adjustToBusinessDay(date) {
  const next = stripTime(new Date(date));
  while (isWeekend(next)) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateInput(date) {
  if (!date || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

