import { useEffect, useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCheck2,
  Mail,
  Pencil,
  ReceiptText,
  Save,
  Send,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

import Modal from "../../../components/ui/Modal";
import { formatMoney, getOrderInvoiceReadiness } from "../order.helpers";

const DEFAULT_SERIE = "F";
const DEFAULT_CURRENCY = "MXN";
const DEFAULT_PAYMENT_FORM = "99";
const DEFAULT_PAYMENT_METHOD = "PUE";
const DEFAULT_EXPEDITION_PLACE = "22000";


const REGIMEN_FISCAL_OPTIONS = [
  { value: "", label: "Seleccionar régimen fiscal", description: "Elige el régimen fiscal del receptor como aparece en su constancia fiscal." },
  { value: "601", label: "601 - General de Ley Personas Morales", description: "Empresas/S.A./S. de R.L. que tributan como persona moral." },
  { value: "603", label: "603 - Personas Morales con Fines no Lucrativos", description: "Asociaciones o entidades sin fines de lucro." },
  { value: "605", label: "605 - Sueldos y Salarios e Ingresos Asimilados a Salarios", description: "Personas físicas asalariadas." },
  { value: "606", label: "606 - Arrendamiento", description: "Personas físicas que rentan inmuebles." },
  { value: "607", label: "607 - Régimen de Enajenación o Adquisición de Bienes", description: "Operaciones específicas de venta/adquisición de bienes." },
  { value: "608", label: "608 - Demás ingresos", description: "Personas físicas con otros ingresos." },
  { value: "610", label: "610 - Residentes en el Extranjero sin Establecimiento Permanente", description: "Receptor extranjero con tratamiento fiscal específico." },
  { value: "611", label: "611 - Ingresos por Dividendos", description: "Personas físicas con ingresos por dividendos." },
  { value: "612", label: "612 - Personas Físicas con Actividades Empresariales y Profesionales", description: "Freelancers, profesionistas o negocios de persona física." },
  { value: "614", label: "614 - Ingresos por intereses", description: "Personas físicas con intereses." },
  { value: "615", label: "615 - Régimen de los ingresos por obtención de premios", description: "Personas físicas con premios." },
  { value: "616", label: "616 - Sin obligaciones fiscales", description: "Receptores sin obligaciones fiscales; úsalo solo si su constancia lo indica." },
  { value: "620", label: "620 - Sociedades Cooperativas de Producción", description: "Cooperativas de producción." },
  { value: "621", label: "621 - Incorporación Fiscal", description: "Régimen anterior/RIF, cuando aplique en datos fiscales del receptor." },
  { value: "622", label: "622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras", description: "Personas morales del sector primario." },
  { value: "623", label: "623 - Opcional para Grupos de Sociedades", description: "Grupos de sociedades." },
  { value: "624", label: "624 - Coordinados", description: "Régimen de coordinados." },
  { value: "625", label: "625 - Actividades Empresariales con ingresos a través de Plataformas", description: "Ingresos por plataformas tecnológicas." },
  { value: "626", label: "626 - Régimen Simplificado de Confianza", description: "RESICO. Muy común en personas físicas y algunas morales." },
];

const USO_CFDI_OPTIONS = [
  { value: "", label: "Seleccionar uso CFDI", description: "Uso que el receptor dará a la factura." },
  { value: "G01", label: "G01 - Adquisición de mercancías", description: "Compra de mercancía/inventario para el negocio." },
  { value: "G02", label: "G02 - Devoluciones, descuentos o bonificaciones", description: "Ajustes comerciales relacionados con compras." },
  { value: "G03", label: "G03 - Gastos en general", description: "El más común cuando el cliente deduce el gasto general." },
  { value: "I01", label: "I01 - Construcciones", description: "Inversiones en construcción." },
  { value: "I02", label: "I02 - Mobiliario y equipo de oficina", description: "Compra de mobiliario/equipo de oficina como inversión." },
  { value: "I03", label: "I03 - Equipo de transporte", description: "Compra de equipo de transporte." },
  { value: "I04", label: "I04 - Equipo de cómputo y accesorios", description: "Computadoras, accesorios y equipo tecnológico como inversión." },
  { value: "I05", label: "I05 - Dados, troqueles, moldes, matrices y herramental", description: "Herramental o moldes usados en producción." },
  { value: "I06", label: "I06 - Comunicaciones telefónicas", description: "Inversión relacionada con comunicaciones telefónicas." },
  { value: "I07", label: "I07 - Comunicaciones satelitales", description: "Inversión relacionada con comunicaciones satelitales." },
  { value: "I08", label: "I08 - Otra maquinaria y equipo", description: "Maquinaria o equipo diferente a los anteriores." },
  { value: "D01", label: "D01 - Honorarios médicos, dentales y hospitalarios", description: "Deducción personal médica." },
  { value: "D02", label: "D02 - Gastos médicos por incapacidad o discapacidad", description: "Deducción personal por incapacidad/discapacidad." },
  { value: "D03", label: "D03 - Gastos funerales", description: "Deducción personal por gastos funerarios." },
  { value: "D04", label: "D04 - Donativos", description: "Deducción personal por donativos." },
  { value: "D05", label: "D05 - Intereses reales por créditos hipotecarios", description: "Deducción personal de intereses hipotecarios." },
  { value: "D06", label: "D06 - Aportaciones voluntarias al SAR", description: "Deducción personal de ahorro para retiro." },
  { value: "D07", label: "D07 - Primas por seguros de gastos médicos", description: "Deducción personal de seguros médicos." },
  { value: "D08", label: "D08 - Gastos de transportación escolar obligatoria", description: "Deducción personal de transporte escolar." },
  { value: "D09", label: "D09 - Depósitos en cuentas para el ahorro", description: "Deducción personal por ahorro/inversión autorizada." },
  { value: "D10", label: "D10 - Pagos por servicios educativos", description: "Deducción personal por colegiaturas." },
  { value: "S01", label: "S01 - Sin efectos fiscales", description: "Cuando el receptor no usará la factura para deducción/acreditamiento." },
  { value: "CP01", label: "CP01 - Pagos", description: "Uso para complementos de pago, no para factura normal de ingreso." },
  { value: "CN01", label: "CN01 - Nómina", description: "Uso para recibos de nómina." },
];

const PAYMENT_FORM_OPTIONS = [
  { value: "", label: "Seleccionar forma de pago", description: "La forma real en que se recibió o se recibirá el pago." },
  { value: "01", label: "01 - Efectivo", description: "Pago en efectivo." },
  { value: "02", label: "02 - Cheque nominativo", description: "Pago con cheque nominativo." },
  { value: "03", label: "03 - Transferencia electrónica de fondos", description: "SPEI/transferencia bancaria. Muy común para empresas." },
  { value: "04", label: "04 - Tarjeta de crédito", description: "Pago con tarjeta de crédito." },
  { value: "05", label: "05 - Monedero electrónico", description: "Pago con monedero electrónico autorizado." },
  { value: "06", label: "06 - Dinero electrónico", description: "Pago con dinero electrónico." },
  { value: "08", label: "08 - Vales de despensa", description: "Pago con vales de despensa." },
  { value: "12", label: "12 - Dación en pago", description: "Se paga entregando un bien o derecho." },
  { value: "13", label: "13 - Pago por subrogación", description: "Un tercero paga la obligación." },
  { value: "14", label: "14 - Pago por consignación", description: "Pago depositado judicialmente o ante autoridad." },
  { value: "15", label: "15 - Condonación", description: "Perdón total o parcial de la deuda." },
  { value: "17", label: "17 - Compensación", description: "Se compensa contra otra obligación." },
  { value: "23", label: "23 - Novación", description: "Se reemplaza una obligación por otra." },
  { value: "24", label: "24 - Confusión", description: "Acreedor y deudor se concentran en la misma persona." },
  { value: "25", label: "25 - Remisión de deuda", description: "Se libera la deuda." },
  { value: "26", label: "26 - Prescripción o caducidad", description: "La obligación se extingue por tiempo/legalidad." },
  { value: "27", label: "27 - A satisfacción del acreedor", description: "Forma especial aceptada por el acreedor." },
  { value: "28", label: "28 - Tarjeta de débito", description: "Pago con tarjeta de débito." },
  { value: "29", label: "29 - Tarjeta de servicios", description: "Pago con tarjeta de servicios." },
  { value: "30", label: "30 - Aplicación de anticipos", description: "Se aplica un anticipo previamente recibido." },
  { value: "31", label: "31 - Intermediario pagos", description: "Pago realizado mediante intermediario." },
  { value: "99", label: "99 - Por definir", description: "Úsalo cuando todavía no sabes cómo pagará el cliente. Normalmente va con método PPD." },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "Seleccionar método de pago", description: "Indica si se paga todo al facturar o después." },
  { value: "PUE", label: "PUE - Pago en una sola exhibición", description: "El pago se liquida al momento de emitir la factura o ya está pagado." },
  { value: "PPD", label: "PPD - Pago en parcialidades o diferido", description: "El pago se hará después o en parcialidades. Normalmente usa forma de pago 99." },
];

const CURRENCY_OPTIONS = [
  { value: "MXN", label: "MXN - Peso mexicano", description: "Moneda normal para facturación nacional en México." },
  { value: "USD", label: "USD - Dólar estadounidense", description: "Úsalo solo si la operación se pactó en dólares." },
];

const CFDI_TYPE_OPTIONS = [
  { value: "I", label: "I - Ingreso", description: "Factura normal por venta de productos o servicios." },
];

const EXPORTATION_OPTIONS = [
  { value: "01", label: "01 - No aplica", description: "Operación nacional sin exportación. Este será el valor normal para tus pedidos." },
  { value: "02", label: "02 - Definitiva", description: "Exportación definitiva." },
  { value: "03", label: "03 - Temporal", description: "Exportación temporal." },
  { value: "04", label: "04 - Definitiva con clave distinta a A1", description: "Caso especial de exportación definitiva." },
];

export default function InvoicePreviewModal({
  open,
  order,
  products = [],
  saving = false,
  onClose,
  onSaveDraft,
  onStampInvoice,
}) {
  const [hasValidated, setHasValidated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [localSaving, setLocalSaving] = useState(false);
  const [stamping, setStamping] = useState(false);
  const [stampResult, setStampResult] = useState(null);

  useEffect(() => {
    if (!order?.id) return;
    setHasValidated(false);
    setIsEditing(false);
    setDraft(buildInvoiceDraft(order));
    setStampResult(null);
  }, [order?.id]);

  if (!order) return null;

  const productById = new Map((products || []).map((product) => [product.id, product]));
  const invoiceData = buildInvoicePreview(order, productById, draft || buildInvoiceDraft(order));
  const validation = validateInvoicePreview(invoiceData);
  const isReady = validation.errors.length === 0;
  const invoiceGate = getInvoiceGate(order);
  const canStamp = hasValidated && isReady && invoiceGate.ready && Boolean(onStampInvoice);

  function updateDraft(key, value) {
    setDraft((current) => ({
      ...(current || buildInvoiceDraft(order)),
      [key]: value,
    }));
    setHasValidated(false);
  }

  function cancelEdit() {
    setDraft(buildInvoiceDraft(order));
    setIsEditing(false);
    setHasValidated(false);
  }


  async function handleStampInvoice() {
    if (!onStampInvoice) {
      setStampResult({
        ok: false,
        message: "No hay función conectada para timbrar en Facturama.",
      });
      return;
    }

    if (!hasValidated || !isReady || !invoiceGate.ready) {
      setStampResult({
        ok: false,
        message: "Primero valida datos y revisa que el pedido esté pagado y entregado completo.",
      });
      return;
    }

    const ok = window.confirm(
      "Esto enviará la factura a Facturama SANDBOX. No tiene valor fiscal real, pero sí consume una prueba del sandbox. ¿Continuar?",
    );

    if (!ok) return;

    try {
      setStamping(true);
      setStampResult(null);

      const result = await onStampInvoice({
        order,
        invoiceData,
      });

      setStampResult({
        ok: true,
        message: result?.message || "Factura timbrada en sandbox.",
        cfdiId: result?.cfdiId || result?.facturamaId || null,
        uuid: result?.uuid || null,
        folio: result?.folio || null,
        serie: result?.serie || null,
      });
    } catch (error) {
      console.error(error);
      setStampResult({
        ok: false,
        message: error.message || "No se pudo timbrar la factura en sandbox.",
      });
    } finally {
      setStamping(false);
    }
  }

  async function saveDraft() {
    if (!onSaveDraft) {
      setIsEditing(false);
      setHasValidated(true);
      return;
    }

    try {
      setLocalSaving(true);
      await onSaveDraft({
        order,
        values: draft || buildInvoiceDraft(order),
      });
      setIsEditing(false);
      setHasValidated(true);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudieron guardar los datos fiscales.");
    } finally {
      setLocalSaving(false);
    }
  }

  const busy = saving || localSaving || stamping;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Factura · ${order.folio}`}
      subtitle="Revisa y corrige la información fiscal del pedido antes de timbrarlo."
      width="max-w-[1500px]"
      zIndex="z-[96]"
    >
      <div className="grid min-h-0 grid-cols-1 bg-surface-soft lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-h-0 space-y-6 p-5 md:p-7">
          <div className="flex flex-col gap-4 rounded-[28px] border border-border bg-background p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
                Datos fiscales
              </p>
              <h3 className="text-base font-bold text-text-primary">
                {isEditing ? "Editando información de factura" : "Información lista para revisar"}
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
                Puedes corregir cliente receptor y datos de pago desde este modal antes de validar.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={busy}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-bold text-text-primary disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={busy}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 text-sm font-bold text-white disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {busy ? "Guardando..." : "Guardar cambios"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-bold text-text-primary hover:border-primary-200 hover:bg-primary-50"
                >
                  <Pencil className="h-4 w-4" />
                  Editar datos fiscales
                </button>
              )}
            </div>
          </div>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <InfoPanel title="Cliente receptor" icon={ShieldCheck}>
              <EditableField
                editing={isEditing}
                label="Razón social"
                value={invoiceData.receiver.name}
                onChange={(value) => updateDraft("receiverName", value)}
                placeholder="Razón social como aparece en constancia fiscal"
              />
              <EditableField
                editing={isEditing}
                label="RFC"
                value={invoiceData.receiver.rfc}
                onChange={(value) => updateDraft("receiverRfc", value.toUpperCase())}
                placeholder="RFC del receptor"
              />
              <EditableSelectField
                editing={isEditing}
                label="Régimen fiscal"
                value={invoiceData.receiver.fiscalRegime}
                options={REGIMEN_FISCAL_OPTIONS}
                onChange={(value) => updateDraft("receiverFiscalRegime", value)}
              />
              <EditableSelectField
                editing={isEditing}
                label="Uso CFDI"
                value={invoiceData.receiver.cfdiUse}
                options={USO_CFDI_OPTIONS}
                onChange={(value) => updateDraft("receiverCfdiUse", value)}
              />
              <EditableField
                editing={isEditing}
                label="Código postal fiscal"
                value={invoiceData.receiver.taxZipCode}
                onChange={(value) => updateDraft("receiverTaxZipCode", value.replace(/[^0-9]/g, "").slice(0, 5))}
                placeholder="Código postal fiscal"
              />
              <EditableField
                editing={isEditing}
                label="Correo"
                value={invoiceData.receiver.email}
                onChange={(value) => updateDraft("receiverEmail", value)}
                placeholder="correo@cliente.com"
              />
            </InfoPanel>

            <InfoPanel title="Datos de factura" icon={ReceiptText}>
              <CatalogField label="Tipo CFDI" value="I" options={CFDI_TYPE_OPTIONS} />
              <EditableField
                editing={isEditing}
                label="Serie"
                value={invoiceData.header.serie}
                onChange={(value) => updateDraft("serie", value.toUpperCase())}
                placeholder="Ej. F"
              />
              <EditableField
                editing={isEditing}
                label="Folio"
                value={invoiceData.header.folio}
                onChange={(value) => updateDraft("folio", value)}
                placeholder="Folio interno de factura"
              />
              <EditableSelectField
                editing={isEditing}
                label="Moneda"
                value={invoiceData.header.currency}
                options={CURRENCY_OPTIONS}
                onChange={(value) => updateDraft("currency", value)}
              />
              <EditableSelectField
                editing={isEditing}
                label="Forma de pago"
                value={invoiceData.header.paymentForm}
                options={PAYMENT_FORM_OPTIONS}
                onChange={(value) => updateDraft("paymentForm", value)}
              />
              <EditableSelectField
                editing={isEditing}
                label="Método de pago"
                value={invoiceData.header.paymentMethod}
                options={PAYMENT_METHOD_OPTIONS}
                onChange={(value) => updateDraft("paymentMethod", value)}
              />
              <CatalogField label="Exportación" value="01" options={EXPORTATION_OPTIONS} />
              <EditableField
                editing={isEditing}
                label="Lugar de expedición"
                value={invoiceData.header.expeditionPlace}
                onChange={(value) => updateDraft("expeditionPlace", value.replace(/[^0-9]/g, "").slice(0, 5))}
                placeholder="CP del emisor"
              />
            </InfoPanel>
          </section>

          <PaymentGuide paymentForm={invoiceData.header.paymentForm} paymentMethod={invoiceData.header.paymentMethod} />

          <section className="rounded-[28px] border border-border bg-background p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
                  Conceptos
                </p>
                <h3 className="text-base font-bold text-text-primary">
                  Productos que se enviarían a Facturama
                </h3>
              </div>
              <span className="rounded-full border border-border bg-surface-soft px-3 py-1 text-xs font-bold text-text-secondary">
                {invoiceData.items.length} concepto{invoiceData.items.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-soft text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                    <th className="px-3 py-3">Producto</th>
                    <th className="px-3 py-3">SAT</th>
                    <th className="px-3 py-3">Unidad</th>
                    <th className="px-3 py-3 text-right">Cantidad</th>
                    <th className="px-3 py-3 text-right">Precio</th>
                    <th className="px-3 py-3 text-right">Base</th>
                    <th className="px-3 py-3 text-right">IVA</th>
                    <th className="px-3 py-3 text-right">ISR</th>
                    <th className="px-3 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => (
                    <tr key={item.id || `${item.identificationNumber}-${index}`} className="border-b border-border">
                      <td className="px-3 py-3 align-top">
                        <p className="font-semibold text-text-primary">{item.description}</p>
                        <p className="mt-1 text-xs text-text-muted">Código: {item.identificationNumber || "-"}</p>
                      </td>
                      <td className="px-3 py-3 align-top text-xs text-text-secondary">
                        <p>{item.productCode || "Sin clave SAT"}</p>
                        <p className="mt-1">TaxObject: {item.taxObject || "-"}</p>
                      </td>
                      <td className="px-3 py-3 align-top text-xs text-text-secondary">
                        <p>{item.unitCode || "Sin unidad SAT"}</p>
                        <p className="mt-1">{item.unit || "-"}</p>
                      </td>
                      <td className="px-3 py-3 text-right align-top font-semibold">{item.quantity}</td>
                      <td className="px-3 py-3 text-right align-top">{formatMoney(item.unitPrice)}</td>
                      <td className="px-3 py-3 text-right align-top">{formatMoney(item.subtotal)}</td>
                      <td className="px-3 py-3 text-right align-top">{formatMoney(item.ivaTotal)}</td>
                      <td className="px-3 py-3 text-right align-top text-error-700">-{formatMoney(item.isrTotal)}</td>
                      <td className="px-3 py-3 text-right align-top font-bold">{formatMoney(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <InvoiceGatePanel gate={invoiceGate} />
            <TotalsPanel totals={invoiceData.totals} />
          </section>
        </div>

        <aside className="border-t border-border bg-background p-5 lg:border-l lg:border-t-0 lg:p-6">
          <ValidationPanel validation={validation} ready={isReady} hasValidated={hasValidated} />

          <div className="mt-5 space-y-4">
            <button
              type="button"
              onClick={() => setHasValidated(true)}
              disabled={isEditing || busy}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 text-sm font-bold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileCheck2 className="h-4 w-4" />
              Validar datos
            </button>

            {isEditing ? (
              <div className="rounded-2xl border border-warning-100 bg-warning-50 p-3 text-sm text-warning-800">
                Guarda o cancela la edición antes de validar datos.
              </div>
            ) : null}

            {hasValidated ? (
              <div className={`rounded-2xl border p-3 text-sm ${isReady ? "border-success-100 bg-success-50 text-success-800" : "border-error-100 bg-error-50 text-error-800"}`}>
                <div className="flex items-center gap-2 font-bold">
                  {isReady ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {isReady ? "El pedido pasó la validación." : "El pedido todavía tiene errores."}
                </div>
              </div>
            ) : null}

            {stampResult ? (
              <div
                className={`rounded-2xl border p-3 text-sm ${
                  stampResult.ok
                    ? "border-success-100 bg-success-50 text-success-800"
                    : "border-error-100 bg-error-50 text-error-800"
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {stampResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {stampResult.ok ? "Timbrado sandbox creado." : "No se pudo timbrar."}
                </div>
                <p className="mt-1 leading-5">{stampResult.message}</p>
                {stampResult.ok ? (
                  <div className="mt-2 space-y-1 rounded-xl bg-white/60 p-3 text-xs">
                    <p><strong>Facturama ID:</strong> {stampResult.cfdiId || "-"}</p>
                    <p><strong>UUID:</strong> {stampResult.uuid || "-"}</p>
                    <p><strong>Serie/Folio:</strong> {[stampResult.serie, stampResult.folio].filter(Boolean).join("-") || "-"}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <ActionButton
              icon={Send}
              label={stamping ? "Timbrando en sandbox..." : "Timbrar sandbox"}
              disabled={!canStamp || stamping}
              onClick={handleStampInvoice}
              note={
                onStampInvoice
                  ? getStampDisabledReason({ hasValidated, isReady, gate: invoiceGate })
                  : "Falta conectar la función de timbrado sandbox."
              }
            />
            <ActionButton icon={Download} label="Descargar PDF/XML" disabled note="Lo conectamos después de confirmar el timbrado sandbox." />
            <ActionButton icon={Mail} label="Enviar por correo" disabled note="Lo conectamos después de confirmar el timbrado sandbox." />
            <ActionButton icon={XCircle} label="Cancelar CFDI" disabled note="Lo conectamos después de confirmar el timbrado sandbox." danger />
          </div>
        </aside>
      </div>
    </Modal>
  );
}

function buildInvoiceDraft(order = {}) {
  return {
    receiverRfc: order.cliente_rfc || order.rfc || "",
    receiverName: order.cliente_razon_social || order.razon_social || order.cliente_nombre || "",
    receiverFiscalRegime: order.cliente_regimen_fiscal || order.regimen_fiscal || "",
    receiverCfdiUse: order.cliente_uso_cfdi || order.uso_cfdi || "",
    receiverTaxZipCode: order.cliente_codigo_postal || order.codigo_postal || "",
    receiverEmail: order.cliente_email || "",
    serie: order.factura_serie || DEFAULT_SERIE,
    folio: order.factura_folio || order.folio || "",
    paymentForm: order.payment_form || DEFAULT_PAYMENT_FORM,
    paymentMethod: order.payment_method || DEFAULT_PAYMENT_METHOD,
    currency: order.currency || DEFAULT_CURRENCY,
    expeditionPlace: order.expedition_place || DEFAULT_EXPEDITION_PLACE,
  };
}

function buildInvoicePreview(order, productById, draft) {
  const subtotal = Number(order.subtotal || 0);
  const descuento = Number(order.descuento || 0);
  const base = Math.max(subtotal - descuento, 0);
  const ivaRate = Number(order.iva_porcentaje || 0) / 100;
  const isrRate = Number(order.isr_porcentaje || 0) / 100;
  const ivaMonto = Number(order.iva_monto ?? base * ivaRate);
  const isrMonto = Number(order.isr_monto ?? base * isrRate);
  const total = Number(order.total ?? base + ivaMonto - isrMonto);

  const items = (order.details || []).map((detail) => {
    const product = productById.get(detail.producto_id) || {};
    const quantity = Number(detail.cantidad_pedida || 0);
    const unitPrice = Number(detail.precio_unitario || 0);
    const lineSubtotal = Number(detail.importe || quantity * unitPrice);
    const lineIvaRate = Number(product.iva_porcentaje ?? order.iva_porcentaje ?? 0) / 100;
    const lineIvaTotal = lineSubtotal * lineIvaRate;
    const lineIsrTotal = lineSubtotal * isrRate;

    return {
      id: detail.id,
      productoId: detail.producto_id,
      quantity,
      productCode: product.clave_sat || detail.clave_sat || "",
      unitCode: product.clave_unidad_sat || detail.clave_unidad_sat || "",
      unit: product.unidad || detail.unidad || "Pieza",
      description: detail.nombre_producto || product.nombre || "Producto",
      identificationNumber: detail.codigo || product.codigo || "",
      unitPrice,
      subtotal: lineSubtotal,
      ivaRate: lineIvaRate,
      ivaTotal: lineIvaTotal,
      isrRate,
      isrTotal: lineIsrTotal,
      taxObject: product.tax_object || detail.tax_object || "02",
      total: lineSubtotal + lineIvaTotal - lineIsrTotal,
    };
  });

  return {
    header: {
      cfdiType: "I",
      serie: draft?.serie || DEFAULT_SERIE,
      folio: draft?.folio || order.folio,
      paymentForm: draft?.paymentForm || DEFAULT_PAYMENT_FORM,
      paymentMethod: draft?.paymentMethod || DEFAULT_PAYMENT_METHOD,
      currency: draft?.currency || DEFAULT_CURRENCY,
      expeditionPlace: draft?.expeditionPlace || DEFAULT_EXPEDITION_PLACE,
    },
    receiver: {
      rfc: draft?.receiverRfc || "",
      name: draft?.receiverName || "",
      fiscalRegime: draft?.receiverFiscalRegime || "",
      cfdiUse: draft?.receiverCfdiUse || "",
      taxZipCode: draft?.receiverTaxZipCode || "",
      email: draft?.receiverEmail || "",
    },
    items,
    totals: {
      subtotal,
      descuento,
      base,
      ivaRate,
      ivaMonto,
      isrRate,
      isrMonto,
      total,
    },
  };
}

function validateInvoicePreview(data) {
  const errors = [];
  const warnings = [];

  if (!data.receiver.rfc) errors.push("El cliente no tiene RFC.");
  if (!data.receiver.name) errors.push("El cliente no tiene razón social fiscal.");
  if (!data.receiver.fiscalRegime) errors.push("El cliente no tiene régimen fiscal.");
  if (!data.receiver.cfdiUse) errors.push("El cliente no tiene uso CFDI.");
  if (!data.receiver.taxZipCode) errors.push("El cliente no tiene código postal fiscal.");
  if (!data.receiver.email) warnings.push("El cliente no tiene correo. Podrás timbrar, pero no enviar por correo desde el sistema.");

  if (!data.header.paymentForm) errors.push("El pedido no tiene forma de pago.");
  if (!data.header.paymentMethod) errors.push("El pedido no tiene método de pago.");
  if (!data.header.currency) errors.push("El pedido no tiene moneda.");

  if (data.header.paymentMethod === "PUE" && data.header.paymentForm === "99") {
    warnings.push("Revisa forma de pago 99 con método PUE: si ya está pagado, normalmente conviene elegir la forma real de pago, por ejemplo 03 transferencia.");
  }

  if (data.header.paymentMethod === "PPD" && data.header.paymentForm !== "99") {
    warnings.push("Para PPD normalmente se usa forma de pago 99 - Por definir, porque el pago será posterior.");
  }
  if (!data.header.expeditionPlace) errors.push("Falta lugar de expedición/código postal del emisor.");

  if (!data.items.length) errors.push("El pedido no tiene productos para facturar.");

  data.items.forEach((item, index) => {
    const label = item.description || `Producto ${index + 1}`;
    if (!item.productCode) errors.push(`${label}: falta clave SAT del producto.`);
    if (!item.unitCode) errors.push(`${label}: falta clave unidad SAT.`);
    if (!item.taxObject) errors.push(`${label}: falta TaxObject.`);
    if (Number(item.quantity || 0) <= 0) errors.push(`${label}: la cantidad debe ser mayor a 0.`);
    if (Number(item.unitPrice || 0) <= 0) errors.push(`${label}: el precio unitario debe ser mayor a 0.`);
  });

  if (Number(data.totals.total || 0) <= 0) errors.push("El total de la factura debe ser mayor a 0.");

  return { errors, warnings };
}

function InfoPanel({ title, icon: Icon, children }) {
  return (
    <section className="rounded-[28px] border border-border bg-background p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        {Icon ? <Icon className="h-5 w-5 shrink-0 text-primary-600" /> : null}
        <h3 className="text-base font-bold text-text-primary">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, value }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className={`min-h-[86px] rounded-2xl border p-4 transition ${empty ? "border-warning-100 bg-warning-50" : "border-border bg-surface-soft"}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className={`mt-2 break-words text-sm font-bold leading-5 ${empty ? "text-warning-800" : "text-text-primary"}`}>
        {empty ? "Pendiente" : value}
      </p>
    </div>
  );
}


function CatalogField({ label, value, options }) {
  const option = findCatalogOption(options, value);

  return (
    <div
      title={option?.description || ""}
      className="min-h-[86px] rounded-2xl border border-border bg-surface-soft p-4 transition"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold leading-5 text-text-primary">
        {option?.label || value || "Pendiente"}
      </p>
    </div>
  );
}

function EditableSelectField({ editing, label, value, options, onChange }) {
  if (!editing) return <CatalogField label={label} value={value} options={options} />;

  const option = findCatalogOption(options, value);

  return (
    <label
      title={option?.description || ""}
      className="min-h-[86px] rounded-2xl border border-primary-100 bg-primary-50/40 p-4 transition"
    >
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">
        {label}
      </span>
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-text-primary outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
      >
        {options.map((item) => (
          <option key={item.value || "empty"} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function findCatalogOption(options = [], value) {
  return options.find((item) => item.value === value) || null;
}

function PaymentGuide({ paymentForm, paymentMethod }) {
  const isPpdWith99 = paymentMethod === "PPD" && paymentForm === "99";
  const isPueWith99 = paymentMethod === "PUE" && paymentForm === "99";

  if (!isPpdWith99 && !isPueWith99) return null;

  return (
    <section className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
      isPpdWith99
        ? "border-success-100 bg-success-50 text-success-800"
        : "border-warning-100 bg-warning-50 text-warning-800"
    }`}>
      {isPpdWith99 ? (
        <p>
          Combinación válida: <strong>PPD</strong> con <strong>99 - Por definir</strong> cuando el pago será después.
        </p>
      ) : null}

      {isPueWith99 ? (
        <p>
          Revisa esta combinación: si usas <strong>PUE</strong>, normalmente conviene elegir la forma real de pago, por ejemplo <strong>03 - Transferencia</strong>.
        </p>
      ) : null}
    </section>
  );
}

function EditableField({ editing, label, value, onChange, placeholder }) {
  if (!editing) return <Field label={label} value={value} />;

  return (
    <label className="min-h-[86px] rounded-2xl border border-primary-100 bg-primary-50/40 p-4 transition">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">{label}</span>
      <input
        type="text"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-text-primary outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
      />
    </label>
  );
}

function getInvoiceGate(order = {}) {
  return getOrderInvoiceReadiness(order);
}

function InvoiceGatePanel({ gate }) {
  const items = [
    { label: "Pago", ok: gate.isPaid, value: gate.isPaid ? "Pagado" : "Pendiente" },
    {
      label: "Entrega",
      ok: gate.isDelivered,
      value: gate.isDelivered
        ? "Entregado completo"
        : `${gate.progress.delivered}/${gate.progress.total} unidades entregadas`,
    },
  ];

  return (
    <section className="rounded-[28px] border border-border bg-background p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
        Condiciones para facturar
      </p>
      <h3 className="mt-1 text-base font-bold text-text-primary">
        El timbrado se habilita solo cuando cumpla estas reglas
      </h3>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl border p-3 ${
              item.ok
                ? "border-success-100 bg-success-50 text-success-800"
                : "border-warning-100 bg-warning-50 text-warning-800"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.14em]">{item.label}</p>
            <p className="mt-1 text-sm font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      {!gate.ready ? (
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Puedes revisar y validar datos, pero el botón de timbrar queda bloqueado hasta que el pedido esté pagado y entregado completo.
        </p>
      ) : null}
    </section>
  );
}

function TotalsPanel({ totals }) {
  return (
    <div className="rounded-[28px] border border-border bg-background p-5 shadow-sm">
      <p className="mb-4 text-base font-bold text-text-primary">Resumen fiscal</p>
      <TotalLine label="Subtotal" value={totals.subtotal} />
      <TotalLine label="Descuento" value={totals.descuento} negative />
      <TotalLine label="Base" value={totals.base} />
      <TotalLine label={`IVA ${(totals.ivaRate * 100).toFixed(2)}%`} value={totals.ivaMonto} />
      <TotalLine label={`ISR retenido ${(totals.isrRate * 100).toFixed(2)}%`} value={totals.isrMonto} negative />
      <div className="mt-3 rounded-2xl bg-primary-600 px-4 py-3 text-white">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold">Total</span>
          <span className="text-lg font-black">{formatMoney(totals.total)}</span>
        </div>
      </div>
    </div>
  );
}

function TotalLine({ label, value, negative = false }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-bold ${negative ? "text-error-700" : "text-text-primary"}`}>
        {negative && Number(value || 0) > 0 ? "-" : ""}{formatMoney(value)}
      </span>
    </div>
  );
}

function ValidationPanel({ validation, ready, hasValidated }) {
  return (
    <section className="rounded-[28px] border border-border bg-background p-5 shadow-sm">
      <div className="flex items-start gap-3">
        {hasValidated && ready ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success-600" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error-600" />
        )}
        <div>
          <p className="font-bold text-text-primary">
            {!hasValidated ? "Validación pendiente" : ready ? "Datos listos para siguiente fase" : "Faltan datos para facturar"}
          </p>
          <p className="mt-1 text-sm leading-6 text-text-secondary">
            Presiona “Validar datos” para revisar si el pedido tiene la información mínima para facturar.
          </p>
        </div>
      </div>

      {hasValidated && validation.errors.length ? (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-error-700">Errores</p>
          <ul className="mt-2 space-y-2">
            {validation.errors.map((error) => (
              <li key={error} className="rounded-2xl border border-error-100 bg-error-50 px-3 py-2 text-sm text-error-800">
                {error}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasValidated && validation.warnings.length ? (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-warning-700">Advertencias</p>
          <ul className="mt-2 space-y-2">
            {validation.warnings.map((warning) => (
              <li key={warning} className="rounded-2xl border border-warning-100 bg-warning-50 px-3 py-2 text-sm text-warning-800">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasValidated && ready ? (
        <div className="mt-4 rounded-2xl border border-success-100 bg-success-50 p-3 text-sm text-success-800">
          <div className="flex items-center gap-2 font-bold">
            <FileCheck2 className="h-4 w-4" />
            Validación correcta
          </div>
          <p className="mt-1 leading-6">
            El pedido ya tiene la información mínima para construir el payload CFDI.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function getStampDisabledReason({ hasValidated, isReady, gate }) {
  if (!hasValidated) {
    return "Primero valida los datos fiscales del pedido.";
  }

  if (!isReady) {
    return "Corrige los errores de validación antes de timbrar.";
  }

  if (!gate?.ready) {
    return gate?.reasons?.length
      ? gate.reasons.join(" ")
      : "El pedido debe estar pagado y entregado completamente.";
  }

  return "Listo para timbrar cuando se conecte la función real.";
}

function ActionButton({ icon: Icon, label, note, danger = false, disabled = true, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
        danger ? "border-error-100 bg-error-50" : "border-border bg-background"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        {Icon ? <Icon className={`h-4 w-4 shrink-0 ${danger ? "text-error-700" : "text-text-muted"}`} /> : null}
        <span className="min-w-0">
          <span className="block text-sm font-bold text-text-primary">{label}</span>
          <span className="mt-0.5 block text-xs text-text-muted">{note}</span>
        </span>
      </span>
    </button>
  );
}
