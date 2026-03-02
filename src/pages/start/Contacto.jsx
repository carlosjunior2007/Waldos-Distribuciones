import { useMemo, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { Mail, Send } from "lucide-react";

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
      subject: "Solicitud de información",
      message: "",
      to_email: TO_EMAIL || "",
    }),
    [TO_EMAIL]
  );

  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState({ state: "idle", msg: "" }); // idle | sending | ok | error

  const setField = (key) => (e) => {
    setStatus({ state: "idle", msg: "" });
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const errors = validate(form);

  const markAllTouched = () =>
    setTouched({
      from_name: true,
      company: true,
      from_email: true,
      subject: true,
      message: true,
    });

  const canSubmit = Object.keys(errors).length === 0;

  const onSubmit = async (e) => {
    e.preventDefault();
    markAllTouched();

    if (!canSubmit) return;

    // Validación de configuración
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      setStatus({
        state: "error",
        msg: "Falta configuración de EmailJS (service/template/public key).",
      });
      return;
    }

    try {
      setStatus({ state: "sending", msg: "Enviando..." });

      // sendForm toma los inputs por name=...
      // Asegúrate de que cada input tenga name correcto (coincide con el template)
      await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, {
        publicKey: PUBLIC_KEY,
      });

      setStatus({ state: "ok", msg: "Mensaje enviado. Te responderemos por correo." });
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
    <section id="contacto" className="px-4 sm:px-6 py-16">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-wide text-text-on-light-muted">
            Contacto
          </p>

          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-text-on-light">
            Solicitar información
          </h2>

          <p className="mt-4 text-text-on-light-secondary">
            Completa el formulario y te responderemos por correo.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form */}
          <div className="lg:col-span-8 rounded-2xl bg-surface border border-border shadow-soft p-6">
            <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
              {/* Hidden to_email (si lo usas en template) */}
              <input type="hidden" name="to_email" value={form.to_email} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Nombre"
                  name="from_name"
                  value={form.from_name}
                  onChange={setField("from_name")}
                  onBlur={() => setTouched((t) => ({ ...t, from_name: true }))}
                  placeholder="Tu nombre"
                  error={touched.from_name ? errors.from_name : ""}
                  required
                />

                <Field
                  label="Empresa (opcional)"
                  name="company"
                  value={form.company}
                  onChange={setField("company")}
                  onBlur={() => setTouched((t) => ({ ...t, company: true }))}
                  placeholder="Nombre de la empresa"
                  error={touched.company ? errors.company : ""}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Correo"
                  name="from_email"
                  type="email"
                  value={form.from_email}
                  onChange={setField("from_email")}
                  onBlur={() => setTouched((t) => ({ ...t, from_email: true }))}
                  placeholder="correo@ejemplo.com"
                  error={touched.from_email ? errors.from_email : ""}
                  required
                />

                <Field
                  label="Asunto"
                  name="subject"
                  value={form.subject}
                  onChange={setField("subject")}
                  onBlur={() => setTouched((t) => ({ ...t, subject: true }))}
                  placeholder="Asunto"
                  error={touched.subject ? errors.subject : ""}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-on-light">
                  Mensaje
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={setField("message")}
                  onBlur={() => setTouched((t) => ({ ...t, message: true }))}
                  placeholder="Describe lo que necesitas (producto, volumen, frecuencia, etc.)"
                  rows={6}
                  className={inputClass(!!(touched.message && errors.message))}
                />
                {touched.message && errors.message ? (
                  <p className="mt-2 text-xs text-error-700">{errors.message}</p>
                ) : (
                  <p className="mt-2 text-xs text-text-on-light-muted">
                    Respuesta por correo en horario comercial.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <button
                  type="submit"
                  disabled={status.state === "sending"}
                  className="
                    inline-flex items-center justify-center gap-2
                    px-6 py-3 rounded-xl
                    text-sm font-semibold text-white
                    bg-primary-500 hover:bg-primary-600
                    transition
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                >
                  <Send size={16} />
                  {status.state === "sending" ? "Enviando..." : "Enviar"}
                </button>

                {status.state === "ok" && (
                  <p className="text-sm text-success-700">{status.msg}</p>
                )}
                {status.state === "error" && (
                  <p className="text-sm text-error-700">{status.msg}</p>
                )}
              </div>
            </form>
          </div>

          {/* Email único */}
          <aside className="lg:col-span-4 rounded-2xl bg-surface border border-border shadow-soft p-6">
            <div className="flex items-start gap-4">
              <div
                className="
                  h-12 w-12 rounded-xl
                  bg-primary-50 border border-primary-200
                  flex items-center justify-center
                  text-primary-600
                  flex-shrink-0
                "
              >
                <Mail size={22} strokeWidth={2} />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-text-on-light">
                  Correo
                </h3>
                <p className="mt-1 text-sm text-text-on-light-secondary">
                  {TO_EMAIL || "ventas@tudominio.com"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
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
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-on-light">
        {label} {required ? <span className="text-error-700">*</span> : null}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={inputClass(!!error)}
      />
      {error ? <p className="mt-2 text-xs text-error-700">{error}</p> : null}
    </div>
  );
}

function inputClass(hasError) {
  return `
    mt-2 w-full rounded-xl
    border ${hasError ? "border-error-500" : "border-border"}
    bg-surface
    px-4 py-3
    text-sm text-text-on-light
    placeholder:text-text-on-light-muted
    outline-none
    focus:ring-2 focus:ring-primary-200
  `;
}

function validate(v) {
  const e = {};
  if (!v.from_name.trim()) e.from_name = "Ingresa tu nombre.";
  if (v.from_name.trim().length < 2) e.from_name = "Nombre demasiado corto.";

  if (v.company && v.company.trim().length > 80)
    e.company = "Nombre de empresa demasiado largo.";

  if (!v.from_email.trim()) e.from_email = "Ingresa tu correo.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.from_email.trim()))
    e.from_email = "Correo no válido.";

  if (!v.subject.trim()) e.subject = "Ingresa un asunto.";
  if (v.subject.trim().length < 4) e.subject = "Asunto demasiado corto.";

  if (!v.message.trim()) e.message = "Escribe tu mensaje.";
  if (v.message.trim().length < 10) e.message = "Mensaje demasiado corto.";

  return e;
}