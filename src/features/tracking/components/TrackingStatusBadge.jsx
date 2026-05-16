import { TRACKING_STATUS_CLASSES } from "../tracking.constants";
import { getPublicStatusLabel } from "../tracking.helpers";

export default function TrackingStatusBadge({ status }) {
  const key = String(status || "").toLowerCase();
  const classes = TRACKING_STATUS_CLASSES[key] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${classes}`}>
      {getPublicStatusLabel(status)}
    </span>
  );
}
