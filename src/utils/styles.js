export function getToneClass(tone = "primary") {
  const tones = {
    success: "border-success-100 bg-success-50 text-success-700",
    warning: "border-warning-100 bg-warning-50 text-warning-700",
    error: "border-error-100 bg-error-50 text-error-700",
    info: "border-info-100 bg-info-50 text-info-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    primary: "border-primary-100 bg-primary-50 text-primary-700",
  };

  return tones[tone] || tones.primary;
}