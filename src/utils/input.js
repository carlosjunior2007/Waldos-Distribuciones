export function cleanNumericInput(value, { allowDecimal = true } = {}) {
  let next = String(value ?? "");

  if (next === "") return "";

  next = allowDecimal
    ? next.replace(/[^0-9.]/g, "")
    : next.replace(/[^0-9]/g, "");

  if (allowDecimal) {
    const parts = next.split(".");
    if (parts.length > 2) {
      next = `${parts[0]}.${parts.slice(1).join("")}`;
    }

    if (next.startsWith(".")) next = `0${next}`;
  }

  if (/^0+\d/.test(next)) {
    next = next.replace(/^0+/, "");
  }

  return next;
}