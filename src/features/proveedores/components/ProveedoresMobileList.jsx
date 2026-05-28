import { Building2, Eye, Pencil, Trash2, Upload } from "lucide-react";

import {
  formatProviderAddress,
  formatProviderContact,
  getProviderStatus,
} from "../proveedores.helpers";

export default function ProveedoresMobileList({
  providers,
  onView,
  onEdit,
  onDelete,
  onImport,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:p-5 xl:hidden">
      {providers.map((provider) => (
        <ProviderMobileCard
          key={provider.id}
          provider={provider}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onImport={onImport}
        />
      ))}
    </div>
  );
}

function ProviderMobileCard({ provider, onView, onEdit, onDelete, onImport }) {
  const status = getProviderStatus(provider);
  const StatusIcon = status.icon;

  return (
    <article className="rounded-[24px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary-100 bg-primary-50 text-primary-700">
            <Building2 className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary">
              {provider.nombre}
            </p>

            <p className="mt-1 truncate text-xs text-text-muted">
              {provider.rfc || provider.razon_social || "Proveedor registrado"}
            </p>
          </div>
        </div>

        <StatusBadge icon={StatusIcon} className={status.className}>
          {status.label}
        </StatusBadge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniInfo label="Contacto" value={formatProviderContact(provider)} />
        <MiniInfo label="Ubicación" value={formatProviderAddress(provider)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MobileAction icon={Eye} label="Ver" onClick={() => onView(provider)} />
        <MobileAction icon={Pencil} label="Editar" onClick={() => onEdit(provider)} />
        <MobileAction icon={Upload} label="Importar" onClick={() => onImport(provider)} />
        <MobileAction icon={Trash2} label="Eliminar" onClick={() => onDelete(provider)} />
      </div>
    </article>
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

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-2xl bg-surface-soft p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-text-primary">
        {value || "Sin dato"}
      </p>
    </div>
  );
}

function MobileAction({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary transition hover:border-info-200 hover:bg-info-50 hover:text-info-700"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
