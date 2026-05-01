import { getToneClass } from "../../utils/styles";

export default function ActionIconButton({
  icon: Icon,
  label,
  onClick,
  tone = "primary",
  disabled = false,
  className = "",
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-surface transition disabled:cursor-not-allowed disabled:opacity-50",
        tone === "default"
          ? "border-border text-text-secondary hover:border-border-strong hover:bg-surface-soft hover:text-text-primary"
          : getToneClass(tone),
        className,
      ].join(" ")}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
    </button>
  );
}