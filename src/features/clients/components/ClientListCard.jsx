import { Pencil, Trash2, User2 } from "lucide-react";
import ActionIconButton from "../../../components/ui/ActionIconButton";

export default function ClientListCard({
  client,
  active,
  onSelect,
  onEdit,
  onDelete,
}) {
  return (
    <article
      className={`rounded-2xl border p-4 transition ${
        active
          ? "border-accent-500 bg-accent-50"
          : "border-border bg-background hover:border-primary-200 hover:bg-surface-soft"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <ClientAvatar client={client} />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">
              {client.nombre}
            </p>

            {client.razon_social ? (
              <p className="mt-1 truncate text-xs text-text-muted">
                {client.razon_social}
              </p>
            ) : null}

            {client.rfc ? (
              <p className="mt-1 text-xs font-semibold text-text-secondary">
                RFC: {client.rfc}
              </p>
            ) : null}
          </div>
        </button>

        <div className="flex items-center gap-2">
          <ActionIconButton
            icon={Pencil}
            label="Editar cliente"
            tone="default"
            onClick={onEdit}
            className="h-9 w-9"
          />

          <ActionIconButton
            icon={Trash2}
            label="Eliminar cliente"
            tone="error"
            onClick={onDelete}
            className="h-9 w-9"
          />
        </div>
      </div>
    </article>
  );
}

function ClientAvatar({ client }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white">
      {client.logo ? (
        <img
          src={client.logo}
          alt={client.nombre}
          className="h-full w-full object-contain"
        />
      ) : (
        <User2 className="h-5 w-5 text-text-muted" />
      )}
    </div>
  );
}