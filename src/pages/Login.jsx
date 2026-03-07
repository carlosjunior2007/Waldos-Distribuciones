import { useEffect, useMemo, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import supabase from "../utils/supabase.js";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();

  const initialForm = useMemo(
    () => ({
      email: "",
      password: "",
    }),
    [],
  );

  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [session, setSession] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session || null);
      setCheckingSession(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session || null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    if (!form.email.trim()) return "Ingresa tu correo.";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Ingresa un correo válido.";
    if (!form.password.trim()) return "Ingresa tu contraseña.";
    if (form.password.length < 6)
      return "La contraseña debe tener al menos 6 caracteres.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

      console.log("Login response:", { data, error });

      if (error) {
        setErrorMsg(error.message || "No se pudo iniciar sesión.");
        return;
      }

      if (data?.session) {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      setErrorMsg("Ocurrió un error inesperado al iniciar sesión.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background px-4 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center text-text-secondary">
          Revisando sesión...
        </div>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-sm p-6 md:p-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary-600">Acceso privado</p>
          <h1 className="mt-1 text-2xl font-bold text-text-primary">
            Iniciar sesión
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Entra con tu correo y contraseña para ir al dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text-primary outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Contraseña
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Tu contraseña"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 pr-11 text-sm text-text-primary outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-text-muted hover:text-text-primary"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {errorMsg ? (
            <div className="rounded-xl border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700">
              {errorMsg}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}