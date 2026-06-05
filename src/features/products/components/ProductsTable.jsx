import { useEffect, useRef, useState } from "react";

import {
  Barcode,
  Check,
  Copy,
  Download,
  MoreVertical,
  Package,
  Pencil,
  Tag,
  Trash2,
} from "lucide-react";

import { formatMoney } from "../../../utils/formatters";
import {
  formatSalePriceWithIva,
  formatUtilityPercent,
  getCategoryLabel,
  getInventoryStatus,
  getProductIvaPercent,
} from "../product.helpers";

export default function ProductsTable({
  products,
  onView,
  onEdit,
  onDelete,
  onDownloadLabel,
}) {
  return (
    <div className="hidden xl:block">
      <div className="overflow-visible border-t border-border">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[27%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[8%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[7%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
          </colgroup>

          <thead className="bg-surface-soft">
            <tr>
              <TableHeader>Producto</TableHeader>
              <TableHeader>Código</TableHeader>
              <TableHeader>Proveedor</TableHeader>
              <TableHeader align="right">Compra</TableHeader>
              <TableHeader align="right">Venta s/IVA</TableHeader>
              <TableHeader align="right">Venta c/IVA</TableHeader>
              <TableHeader align="center">Utilidad</TableHeader>
              <TableHeader align="center">Estado</TableHeader>
              <TableHeader align="center">Opciones</TableHeader>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {products.map((item) => (
              <ProductTableRow
                key={item.id}
                item={item}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onDownloadLabel={onDownloadLabel}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductTableRow({ item, onView, onEdit, onDelete, onDownloadLabel }) {
  const status = getInventoryStatus(item);
  const StatusIcon = status.icon;
  const iva = getProductIvaPercent(item);

  return (
    <tr
      className="group cursor-pointer bg-surface transition hover:bg-surface-soft/70"
      onClick={() => onView(item)}
      title="Ver producto"
    >
      <td className="px-3 py-4 align-middle">
        <ProductIdentity item={item} />
      </td>

      <td className="px-3 py-4 align-middle">
        <CodeBadge value={item.codigo} />
      </td>

      <td className="px-3 py-4 align-middle">
        <SupplierCell item={item} />
      </td>

      <td className="px-3 py-4 align-middle text-right">
        <MoneyCell value={formatMoney(item.precio_compra)} />
      </td>

      <td className="px-3 py-4 align-middle text-right">
        <MoneyCell value={formatMoney(item.precio)} />
      </td>

      <td className="px-3 py-4 align-middle text-right">
        <MoneyCell value={formatSalePriceWithIva(item)} helper={`IVA ${iva}%`} strong />
      </td>

      <td className="px-3 py-4 align-middle text-center">
        <span className="text-sm font-extrabold text-text-primary">
          {formatUtilityPercent(item)}
        </span>
      </td>

      <td className="px-3 py-4 align-middle text-center">
        <StatusBadge icon={StatusIcon} className={status.className}>
          {status.label}
        </StatusBadge>
      </td>

      <td className="px-3 py-4 align-middle" onClick={(event) => event.stopPropagation()}>
        <ActionsDropdown
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onDownloadLabel={onDownloadLabel}
        />
      </td>
    </tr>
  );
}

function TableHeader({ children, align = "left" }) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <th
      className={`px-3 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted ${alignClass}`}
    >
      {children}
    </th>
  );
}

function ProductIdentity({ item }) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <div className="flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary-100 bg-primary-50 text-primary-700 transition group-hover:border-primary-200 group-hover:bg-primary-100">
        {item.imagen ? (
          <img
            src={item.imagen}
            alt={item.nombre}
            className="h-full w-full object-cover"
          />
        ) : (
          <Package className="h-5 w-5" />
        )}
      </div>

      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-extrabold leading-5 text-text-primary">
          {item.nombre}
        </p>

        <div className="mt-1.5 flex max-w-full items-center gap-2">
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
            <Tag className="h-3 w-3 shrink-0 text-accent-500" />
            <span className="truncate">{getCategoryLabel(item.categoria)}</span>
          </span>
        </div>

        {item.descripcion ? (
          <p className="mt-1.5 line-clamp-1 max-w-[280px] text-xs leading-5 text-text-muted">
            {item.descripcion}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CodeBadge({ value }) {
  const [copied, setCopied] = useState(false);
  const code = value || "Sin código";

  const handleCopy = async (event) => {
    event.stopPropagation();

    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch (error) {
      console.warn("No se pudo copiar el código", error);
    }
  };

  return (
    <div className="relative inline-flex max-w-full items-center rounded-xl border border-border bg-surface text-sm font-semibold text-text-secondary">
      <div className="flex min-w-0 items-center gap-2 px-3 py-2" title={code}>
        <Barcode className="h-4 w-4 shrink-0 text-accent-500" />
        <span className="min-w-0 max-w-[64px] truncate leading-5">{code}</span>
      </div>

      {value ? (
        <button
          type="button"
          onClick={handleCopy}
          className={`flex h-full items-center justify-center border-l border-border px-2.5 py-2 transition ${
            copied
              ? "bg-green-50 text-green-700"
              : "text-text-muted hover:bg-surface-soft hover:text-text-primary"
          }`}
          title={copied ? "Código copiado" : "Copiar código"}
          aria-label={copied ? "Código copiado" : "Copiar código"}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      ) : null}

      {copied ? (
        <span className="pointer-events-none absolute -bottom-7 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-lg bg-text-primary px-2 py-1 text-[10px] font-bold text-white shadow-lg">
          Copiado
        </span>
      ) : null}
    </div>
  );
}

function SupplierCell({ item }) {
  const suppliers = item.proveedores_asociados || [];
  const main = suppliers.find((supplier) => supplier.es_principal) || suppliers[0];
  const supplierName = main?.nombre || main?.proveedor?.nombre;

  return (
    <div className="min-w-0 max-w-[125px]">
      <p className="truncate text-sm font-bold text-text-primary" title={supplierName || "Sin proveedores"}>
        {supplierName || "Sin proveedores"}
      </p>
      <p className="mt-0.5 truncate text-xs text-text-muted">
        {!suppliers.length
          ? "Sin asignar"
          : suppliers.length === 1
            ? "1 proveedor"
            : `${suppliers.length} proveedores`}
      </p>
    </div>
  );
}

function MoneyCell({ value, helper, strong = false }) {
  return (
    <div className="min-w-0">
      <p
        className={`whitespace-nowrap text-sm font-extrabold ${
          strong ? "text-primary-700" : "text-text-primary"
        }`}
      >
        {value}
      </p>
      {helper ? (
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function StatusBadge({ icon: Icon, className, children }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function ActionsDropdown({ item, onEdit, onDelete, onDownloadLabel }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleAction = (event, action) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
    action(item);
  };

  const toggleDropdown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen((current) => !current);
  };

  return (
    <div className="relative flex justify-center" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 ${
          open ? "border-primary-200 bg-primary-50 text-primary-700" : ""
        }`}
        aria-label="Opciones del producto"
        aria-expanded={open}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-30 w-52 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-xl">
          <DropdownButton
            icon={Pencil}
            label="Editar producto"
            onClick={(event) => handleAction(event, onEdit)}
          />
          <DropdownButton
            icon={Download}
            label="Descargar etiqueta"
            onClick={(event) => handleAction(event, onDownloadLabel)}
          />
          <div className="my-1 border-t border-border" />
          <DropdownButton
            icon={Trash2}
            label="Eliminar producto"
            danger
            onClick={(event) => handleAction(event, onDelete)}
          />
        </div>
      ) : null}
    </div>
  );
}

function DropdownButton({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
        danger
          ? "text-danger-600 hover:bg-danger-50"
          : "text-text-secondary hover:bg-surface-soft hover:text-text-primary"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
