import {
  Download,
  Eye,
  Pencil,
  Tag,
  Trash2,
} from "lucide-react";

import ActionIconButton from "../../../components/ui/ActionIconButton";
import { formatLabelDate } from "../label.helpers";

export default function LabelCard({
  label,
  onDownload,
  onEdit,
  onView,
  onDelete,
}) {
  return (
    <article className="rounded-[24px] border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">
            {label.productos?.nombre || "Producto"}
          </p>

          <p className="mt-1 text-xs text-text-muted">
            {formatLabelDate(label.created_at)}
          </p>
        </div>

        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-soft">
          <Tag className="h-4 w-4 text-text-secondary" />
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-text-secondary">
        <p>
          Tamaño: {Number(label.ancho_mm || 0)} x{" "}
          {Number(label.alto_mm || 0)} mm
        </p>

        {label.codigo ? <p>Código: {label.codigo}</p> : null}
        {label.codigo_barras ? <p>Barcode: {label.codigo_barras}</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
        >
          <Download className="h-4 w-4" />
          PDF
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </button>

        <ActionIconButton
          icon={Eye}
          label="Ver"
          tone="default"
          onClick={onView}
        />

        <ActionIconButton
          icon={Trash2}
          label="Eliminar"
          tone="error"
          onClick={onDelete}
        />
      </div>
    </article>
  );
}