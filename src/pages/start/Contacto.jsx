import { useMemo, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import {
  Mail,
  Send,
  Phone,
  Building2,
  MapPin,
  CheckCircle2,
  MessageSquareText,
  User,
  PackageSearch,
  Clock,
} from "lucide-react";

export default function ContactSection() {
  const formRef = useRef(null);

  const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const TO_EMAIL = import.meta.env.VITE_CONTACT_TO_EMAIL;

  const initial = useMemo(
    () => ({
      from_name: "",
      company: "",
      from_email: "",
      phone: "",
      city_zone: "",
      subject: "Solicitud de cotización",
      message: "",
      to_email: TO_EMAIL || "",
    }),
    [TO_EMAIL],
  );

  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState({ state: "idle", msg: "" });

  const setField = (key) => (e) => {
    setStatus({ state: "idle", msg: "" });
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const errors = validate(form);
  const canSubmit = Object.keys(errors).length === 0;

  const markAllTouched = () => {
    setTouched({
      from_name: true,
      company: true,
      from_email: true,
      phone: true,
      city_zone: true,
      subject: true,
      message: true,
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    markAllTouched();

    if (!canSubmit) return;

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      setStatus({
        state: "error",
        msg: "Falta configurar EmailJS. Revisa service ID, template ID y public key.",
      });
      return;
    }

    try {
      setStatus({ state: "sending", msg: "Enviando solicitud..." });

      await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, {
        publicKey: PUBLIC_KEY,
      });

      setStatus({
        state: "ok",
        msg: "Solicitud enviada. Te responderemos lo antes posible.",
      });

      setForm(initial);
      setTouched({});
    } catch (err) {
      setStatus({
        state: "error",
        msg: "No se pudo enviar el mensaje. Intenta nuevamente.",
      });
    }
  };

  return (
    <section
      id="contacto"
      className="
        relative overflow-hidden bg-transparent
        px-4 py-16
        sm:px-6 sm:py-20
        lg:px-8 lg:py-24
      "
    >

      <div
        className="
          pointer-events-none absolute inset-0 opacity-0
          [background-image:linear-gradient(to_right,#0e34670d_1px,transparent_1px),linear-gradient(to_bottom,#0e34670d_1px,transparent_1px)]
          [background-size:44px_44px]
          sm:[background-size:52px_52px]
        "
      />

      <div className="relative mx-auto max-w-7xl">
        <div
          className="
            grid gap-6
            lg:grid-cols-[0.95fr_0.85fr] lg:items-end
          "
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#c70f25]">
              Contacto
            </p>

            <h2
              className="
                mt-3 max-w-4xl text-balance
                text-[2.1rem] font-black leading-[1] tracking-[-0.045em] text-[#0e3467]
                sm:text-4xl
                lg:text-[3.25rem]
              "
            >
              Pide una cotización para tu negocio.
            </h2>
          </div>

          <p className="max-w-xl text-sm leading-7 text-slate-600 lg:justify-self-end">
            Cuéntanos qué productos necesitas y dónde los ocupas. Con eso
            podemos responderte de forma más clara y ayudarte a armar tu pedido.
          </p>
        </div>

        <div
          className="
            mt-10 grid gap-6
            lg:mt-14 lg:grid-cols-12 lg:items-stretch
          "
        >
          <aside
            className="
              relative overflow-hidden rounded-[2rem] bg-[#0e3467]
              p-6 text-white
              shadow-[0_24px_70px_rgba(14,52,103,0.20)]
              sm:p-7
              lg:col-span-4
            "
          >
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 left-8 h-72 w-72 rounded-full bg-[#c70f25]/25 blur-3xl" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/15">
                <PackageSearch size={25} />
              </div>

              <h3 className="mt-7 text-3xl font-black leading-tight">
                Te ayudamos a armar tu pedido.
              </h3>

              <p className="mt-4 text-sm leading-7 text-white/74">
                Puedes mandar una lista exacta o solo una idea general. Nosotros
                revisamos productos, cantidades y forma de entrega.
              </p>

              <div className="mt-7 space-y-4">
                <SidePoint text="Cotizaciones para negocios, empresas y sucursales." />
                <SidePoint text="Productos de limpieza, papelería, higiene, cocina y más." />
                <SidePoint text="Atención clara para avanzar sin vueltas." />
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/52">
                  Correo
                </p>

                <p className="mt-2 break-words text-sm font-semibold text-white">
                  {TO_EMAIL || "contacto@waldodistribuciones.com"}
                </p>
              </div>

              <div className="mt-auto pt-8">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-sm font-black text-white">
                    Puedes pedir
                  </p>

                  <p className="mt-2 text-sm leading-6 text-white/68">
                    Limpieza, higiene, lavandería, cocina, desechables,
                    papelería, mascotas, alimentos y bebidas.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <div
            className="
              rounded-[2rem] border border-[#0e3467]/10 bg-white
              p-5 shadow-[0_24px_70px_rgba(14,52,103,0.10)]
              sm:p-7
              lg:col-span-8
            "
          >
            <div className="mb-6 flex flex-col gap-3 border-b border-[#0e3467]/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-black text-[#0e3467]">
                  Datos de la solicitud
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Escribe tus datos y lo que necesitas cotizar.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#c70f25]/8 px-4 py-2 text-xs font-black text-[#c70f25]">
                <Clock size={14} />
                Respuesta en horario comercial
              </div>
            </div>

            <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
              <input type="hidden" name="to_email" value={form.to_email} />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nombre"
                  name="from_name"
                  icon={User}
                  value={form.from_name}
                  onChange={setField("from_name")}
                  onBlur={() => setTouched((t) => ({ ...t, from_name: true }))}
                  placeholder="Tu nombre"
                  error={touched.from_name ? errors.from_name : ""}
                  required
                />

                <Field
                  label="Empresa o negocio"
                  name="company"
                  icon={Building2}
                  value={form.company}
                  onChange={setField("company")}
                  onBlur={() => setTouched((t) => ({ ...t, company: true }))}
                  placeholder="Nombre del negocio"
                  error={touched.company ? errors.company : ""}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Correo"
                  name="from_email"
                  type="email"
                  icon={Mail}
                  value={form.from_email}
                  onChange={setField("from_email")}
                  onBlur={() =>
                    setTouched((t) => ({ ...t, from_email: true }))
                  }
                  placeholder="correo@ejemplo.com"
                  error={touched.from_email ? errors.from_email : ""}
                  required
                />

                <Field
                  label="Teléfono"
                  name="phone"
                  icon={Phone}
                  value={form.phone}
                  onChange={setField("phone")}
                  onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                  placeholder="664 000 0000"
                  error={touched.phone ? errors.phone : ""}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Ciudad o zona"
                  name="city_zone"
                  icon={MapPin}
                  value={form.city_zone}
                  onChange={setField("city_zone")}
                  onBlur={() => setTouched((t) => ({ ...t, city_zone: true }))}
                  placeholder="Ej. Tijuana, Otay, Zona Río"
                  error={touched.city_zone ? errors.city_zone : ""}
                />

                <Field
                  label="Asunto"
                  name="subject"
                  icon={MessageSquareText}
                  value={form.subject}
                  onChange={setField("subject")}
                  onBlur={() => setTouched((t) => ({ ...t, subject: true }))}
                  placeholder="Solicitud de cotización"
                  error={touched.subject ? errors.subject : ""}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-black text-[#0e3467]">
                  ¿Qué productos necesitas?{" "}
                  <span className="text-[#c70f25]">*</span>
                </label>

                <textarea
                  name="message"
                  value={form.message}
                  onChange={setField("message")}
                  onBlur={() => setTouched((t) => ({ ...t, message: true }))}
                  placeholder="Ej. Necesito papel higiénico, jabón para manos, bolsas negras y productos de limpieza para una oficina. Si tienes cantidades aproximadas, mejor."
                  rows={8}
                  className={inputClass(!!(touched.message && errors.message))}
                />

                {touched.message && errors.message ? (
                  <p className="mt-2 text-xs font-semibold text-[#c70f25]">
                    {errors.message}
                  </p>
                ) : (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Incluye productos, cantidades aproximadas y si necesitas
                    entrega en una o varias ubicaciones.
                  </p>
                )}
              </div>

              <div
                className="
                  flex flex-col gap-3 border-t border-[#0e3467]/10 pt-5
                  sm:flex-row sm:items-center sm:justify-between
                "
              >
                <button
                  type="submit"
                  disabled={status.state === "sending"}
                  className="
                    group inline-flex items-center justify-center gap-2
                    rounded-2xl bg-[#c70f25] px-7 py-4
                    text-sm font-black text-white
                    shadow-[0_16px_34px_rgba(199,15,37,0.24)]
                    transition-all duration-300
                    hover:-translate-y-1 hover:bg-[#a90d20]
                    active:translate-y-0 active:scale-[0.98]
                    disabled:cursor-not-allowed disabled:opacity-60
                  "
                >
                  <Send size={16} />
                  {status.state === "sending"
                    ? "Enviando..."
                    : "Enviar solicitud"}
                </button>

                {status.state === "ok" && (
                  <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={17} />
                    {status.msg}
                  </p>
                )}

                {status.state === "error" && (
                  <p className="text-sm font-semibold text-[#c70f25]">
                    {status.msg}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function SidePoint({ text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/12">
        <CheckCircle2 size={14} />
      </div>
      <p className="text-sm leading-6 text-white/76">{text}</p>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required,
  type = "text",
  icon: Icon,
}) {
  return (
    <div>
      <label className="block text-sm font-black text-[#0e3467]">
        {label} {required ? <span className="text-[#c70f25]">*</span> : null}
      </label>

      <div className="relative mt-2">
        {Icon ? (
          <Icon
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
        ) : null}

        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`${inputClass(!!error)} ${Icon ? "pl-11" : ""}`}
        />
      </div>

      {error ? (
        <p className="mt-2 text-xs font-semibold text-[#c70f25]">{error}</p>
      ) : null}
    </div>
  );
}

function inputClass(hasError) {
  return `
    mt-2 w-full rounded-2xl
    border ${hasError ? "border-[#c70f25]" : "border-[#0e3467]/12"}
    bg-[#f8fafc]
    px-4 py-3.5
    text-sm text-[#0e3467]
    placeholder:text-slate-400
    outline-none
    transition
    focus:border-[#0e3467]/30
    focus:bg-white
    focus:ring-4 focus:ring-[#0e3467]/8
  `;
}

function validate(v) {
  const e = {};

  if (!v.from_name.trim()) e.from_name = "Ingresa tu nombre.";
  else if (v.from_name.trim().length < 2)
    e.from_name = "El nombre es demasiado corto.";

  if (v.company && v.company.trim().length > 90)
    e.company = "El nombre de la empresa es demasiado largo.";

  if (!v.from_email.trim()) e.from_email = "Ingresa tu correo.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.from_email.trim()))
    e.from_email = "Ingresa un correo válido.";

  if (v.phone && v.phone.replace(/\D/g, "").length < 10)
    e.phone = "Ingresa un teléfono válido.";

  if (v.city_zone && v.city_zone.trim().length < 3)
    e.city_zone = "Escribe una ciudad o zona válida.";

  if (!v.subject.trim()) e.subject = "Ingresa un asunto.";
  else if (v.subject.trim().length < 4)
    e.subject = "El asunto es demasiado corto.";

  if (!v.message.trim()) e.message = "Escribe qué necesitas.";
  else if (v.message.trim().length < 15)
    e.message = "Agrega un poco más de información.";

  return e;
}