import {
  Download,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

import ActionIconButton from "../../../components/ui/ActionIconButton";
import { formatDateTimeTijuana } from "../../../utils/dates";

export default function ReceiptsTable({
  rows,
  onDownload,
  onEdit,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-surface-soft">
          <tr>
            {["Folio", "Cliente", "Fecha", "Estado", "Acciones"].map(
              (header) => (
                <th
                  key={header}
                  className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-text-muted ${
                    header === "Acciones" ? "text-right" : ""
                  }`}
                >
                  {header}
                </th>
              ),
            )}
          </tr>
        </thead>

        <tbody>
          {rows.map((item) => (
            <tr key={item.id} className="border-t border-border">
              <td className="px-6 py-5">
                <p className="text-sm font-bold text-text-primary">
                  {item.folio}
                </p>

                {item.cotizacion_id ? (
                  <p className="mt-1 text-xs text-text-muted">
                    Asociado a cotización
                  </p>
                ) : null}
              </td>

              <td className="px-6 py-5">
                <p className="text-sm font-semibold text-text-primary">
                  {item.cliente_nombre}
                </p>

                <p className="mt-1 text-xs text-text-muted">
                  {item.cliente_rfc || "Sin RFC"}
                </p>
              </td>

              <td className="px-6 py-5 text-sm text-text-secondary">
                {formatDateTimeTijuana(item.fecha)}
              </td>

              <td className="px-6 py-5">
                <span className="rounded-full border border-success-100 bg-success-50 px-3 py-1 text-xs font-semibold text-success-700">
                  {item.estado || "emitido"}
                </span>
              </td>

              <td className="px-6 py-5">
                <div className="flex justify-end gap-2">
                  <ActionIconButton
                    icon={Download}
                    label="PDF"
                    onClick={() => onDownload(item.id)}
                  />

                  <ActionIconButton
                    icon={Eye}
                    label="Ver"
                    onClick={() => onEdit(item.id)}
                  />

                  <ActionIconButton
                    icon={Pencil}
                    label="Editar"
                    onClick={() => onEdit(item.id)}
                  />

                  <ActionIconButton
                    icon={Trash2}
                    label="Eliminar"
                    tone="error"
                    onClick={() => onDelete(item)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}