import { User2 } from "lucide-react";

export default function ClientSearchCard({ client, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
        active
          ? "border-accent-500 bg-accent-50"
          : "border-border bg-background hover:border-primary-200 hover:bg-surface-soft"
      }`}
    >
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

        {client.correo ? (
          <p className="mt-1 truncate text-xs text-text-muted">
            {client.correo}
          </p>
        ) : null}
      </div>
    </button>
  );
}