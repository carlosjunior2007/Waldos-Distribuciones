import { CheckCircle2, Loader2 } from "lucide-react";

export default function OperationOverlay({ loadingLabel, feedback }) {
  return (
    <>
      {feedback?.message ? (
        <div className="fixed right-4 top-4 z-[10020] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-success-100 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-700">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-text-primary">Listo</p>
              <p className="mt-0.5 text-sm text-text-secondary">{feedback.message}</p>
            </div>
          </div>
        </div>
      ) : null}

      {loadingLabel ? (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-[24px] border border-border bg-white p-5 text-center shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-soft text-accent-600">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <p className="mt-4 text-base font-black text-text-primary">{loadingLabel}</p>
            <p className="mt-1 text-sm text-text-secondary">Espera un momento. El sistema está actualizando la información.</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
