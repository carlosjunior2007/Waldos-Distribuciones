import { Search } from "lucide-react";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "",
}) {
  return (
    <div
      className={[
        "flex h-12 items-center gap-3 rounded-2xl border border-border bg-background px-4 text-sm transition focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100",
        className,
      ].join(" ")}
    >
      <Search className="h-4 w-4 shrink-0 text-text-muted" />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent text-text-primary outline-none placeholder:text-text-muted"
      />
    </div>
  );
}
