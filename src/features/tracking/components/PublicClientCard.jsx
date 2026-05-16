import { Mail, Phone, UserRound } from "lucide-react";
import { safeText } from "../tracking.helpers";

export default function PublicClientCard({ order }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black text-slate-950">Cliente</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Info icon={<UserRound className="h-4 w-4" />} label="Nombre" value={safeText(order.cliente_nombre)} />
        <Info icon={<Phone className="h-4 w-4" />} label="Teléfono" value={safeText(order.cliente_telefono)} />
        <Info icon={<Mail className="h-4 w-4" />} label="Correo" value={safeText(order.cliente_email)} />
      </div>
    </section>
  );
}

function Info({ icon, label, value }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {icon}
        {label}
      </div>
      <p className="break-words text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}
