import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  width = "max-w-4xl",
  zIndex = "z-[70]",
  className = "",
}) {
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 ${zIndex} bg-black/50 h-full`}>
      <div className="flex min-h-dvh items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          className={[
            "flex h-dvh w-full flex-col overflow-hidden border border-border bg-surface shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-[28px]",
            width,
            className,
          ].join(" ")}
        >
          <div className="sticky top-0 z-10 border-b border-border bg-surface/95 p-4 backdrop-blur sm:p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-text-primary">{title}</h3>

                {subtitle ? (
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                    {subtitle}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition hover:border-border-strong hover:bg-surface-soft hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
