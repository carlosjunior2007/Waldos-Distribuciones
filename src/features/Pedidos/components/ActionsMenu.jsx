import { MoreVertical } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function ActionsMenu({ actions = [] }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 232 });

  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  function calculatePosition() {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 232;
    const gap = 8;
    const estimatedHeight = Math.min(actions.length * 44 + 12, 320);

    let left = rect.right - menuWidth;
    let top = rect.bottom + gap;

    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }

    if (top + estimatedHeight > window.innerHeight - 8) {
      top = rect.top - estimatedHeight - gap;
    }

    if (top < 8) top = 8;

    setPosition({ top, left, width: menuWidth });
  }

  useLayoutEffect(() => {
    if (open) calculatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleClick(event) {
      const target = event.target;

      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    }

    function handleReposition() {
      calculatePosition();
    }

    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: position.width,
            }}
            className="z-[9999] max-h-80 overflow-y-auto rounded-2xl border border-border bg-surface p-1 shadow-2xl"
          >
            {actions.map((action) => {
              const Icon = action.icon;

              const disabled = Boolean(action.disabled);

              return (
                <button
                  key={action.label}
                  type="button"
                  disabled={disabled}
                  title={action.disabledReason || action.label}
                  onClick={() => {
                    if (disabled) return;
                    setOpen(false);
                    action.onClick?.();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    disabled
                      ? "cursor-not-allowed text-text-muted opacity-50"
                      : action.danger
                        ? "text-error-700 hover:bg-surface-soft"
                        : "text-text-primary hover:bg-surface-soft"
                  }`}
                >
                  {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                  <span className="min-w-0 truncate">{action.label}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-primary transition hover:border-border-strong hover:bg-surface-soft"
        aria-label="Acciones"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {menu}
    </>
  );
}
