import {
  Building2,
  Eye,
  Mail,
  Pencil,
  Upload,
  Phone,
  Trash2,
} from "lucide-react";

import ActionIconButton from "../../../components/ui/ActionIconButton";
import {
  formatProviderAddress,
  formatProviderContact,
  getProviderStatus,
} from "../proveedores.helpers";

export default function ProveedoresTable({
  providers,
  onView,
  onEdit,
  onDelete,
  onImport,
}) {
  return (
    <div className="hidden xl:block">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-surface-soft">
            <tr>
              {[
                "Proveedor",
                "Contacto",
                "Ubicación",
                "Estado",
                "Acciones",
              ].map((header) => (
                <th
                  key={header}
                  className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted ${
                    header === "Acciones" ? "text-right" : ""
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {providers.map((provider) => (
              <ProviderTableRow
                key={provider.id}
                provider={provider}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onImport={onImport}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProviderTableRow({ provider, onView, onEdit, onDelete, onImport }) {
  const status = getProviderStatus(provider);
  const StatusIcon = status.icon;

  return (
    <tr className="border-t border-border transition hover:bg-surface-soft/70">
      <td className="px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary-100 bg-primary-50 text-primary-700">
            <Building2 className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary">
              {provider.nombre}
            </p>

            <p className="mt-1 w-56 truncate text-xs text-text-muted">
              {provider.razon_social || provider.rfc || "Proveedor registrado"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-5">
        <div className="space-y-1 text-sm text-text-secondary">
          <IconLine icon={Phone}>{provider.telefono || "Sin teléfono"}</IconLine>
          <IconLine icon={Mail}>{provider.correo || "Sin correo"}</IconLine>
          {provider.contacto_nombre ? (
            <p className="text-xs font-semibold text-text-muted">
              Contacto: {provider.contacto_nombre}
            </p>
          ) : null}
        </div>
      </td>

      <td className="px-6 py-5">
        <p className="max-w-xs text-sm text-text-secondary">
          {formatProviderAddress(provider) || "Sin dirección"}
        </p>
      </td>

      <td className="px-6 py-5">
        <StatusBadge icon={StatusIcon} className={status.className}>
          {status.label}
        </StatusBadge>
      </td>

      <td className="px-6 py-5">
        <div className="flex items-center justify-end gap-2">
          <ActionIconButton
            icon={Eye}
            label="Ver proveedor"
            tone="default"
            onClick={() => onView(provider)}
          />

          <ActionIconButton
            icon={Pencil}
            label="Editar proveedor"
            tone="default"
            onClick={() => onEdit(provider)}
          />

          <ActionIconButton
            icon={Upload}
            label="Importar productos"
            tone="default"
            onClick={() => onImport(provider)}
          />

          <ActionIconButton
            icon={Trash2}
            label="Eliminar proveedor"
            tone="default"
            onClick={() => onDelete(provider)}
          />
        </div>
      </td>
    </tr>
  );
}

function IconLine({ icon: Icon, children }) {
  return (
    <p className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-accent-500" />
      {children}
    </p>
  );
}

function StatusBadge({ icon: Icon, className, children }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}
