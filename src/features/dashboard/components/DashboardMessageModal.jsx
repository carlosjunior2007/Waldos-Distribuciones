import { AlertTriangle, CheckCircle2, Info, RefreshCcw, XCircle } from "lucide-react";

const TONE_CONFIG = {
  info: {
    icon: Info,
    iconClass: "bg-info-50 text-info-700",
    buttonClass: "bg-primary-600 hover:bg-primary-700 text-white",
  },
  success: {
    icon: CheckCircle2,
    iconClass: "bg-success-50 text-success-700",
    buttonClass: "bg-success-600 hover:bg-success-700 text-white",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "bg-warning-50 text-warning-800",
    buttonClass: "bg-warning-600 hover:bg-warning-700 text-white",
  },
  error: {
    icon: XCircle,
    iconClass: "bg-error-50 text-error-700",
    buttonClass: "bg-error-600 hover:bg-error-700 text-white",
  },
};

export default function DashboardMessageModal({
  open,
  title = "Aviso",
  message = "",
  tone = "info",
  confirmText = "Entendido",
  retryText = "",
  onClose,
  onRetry,
}) {
  if (!open) return null;

  const config = TONE_CONFIG[tone] || TONE_CONFIG.info;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[160] flex min-h-screen items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-border bg-surface p-6 shadow-2xl">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${config.iconClass}`}
        >
          <Icon className="h-6 w-6" />
        </div>

        <h3 className="mt-5 text-xl font-black text-text-primary">
          {title}
        </h3>

        {message ? (
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-text-secondary">
            {message}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-surface px-5 text-sm font-bold text-text-primary transition hover:bg-surface-soft"
          >
            {confirmText}
          </button>

          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition ${config.buttonClass}`}
            >
              <RefreshCcw className="h-4 w-4" />
              {retryText || "Reintentar"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
