import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Package,
  Wallet,
  Menu,
  X,
  ChevronRight,
  Mail,
  LogOut,
  Tag ,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import supabase from "../../utils/supabase.js";

const NAV_ITEMS = [
  {
    label: "Resumen",
    to: "/dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Cotizaciones",
    to: "/dashboard/cotizaciones",
    icon: FileText,
    end: true,
  },
  {
    label: "Productos",
    to: "/dashboard/productos",
    icon: Package,
    end: true,
  },
  {
    label: "Gastos y ganancias",
    to: "/dashboard/gastos",
    icon: Wallet,
    end: true,
  },
  {
    label: "Etiquetas y clientes",
    to: "/dashboard/etiquetas",
    icon: Tag ,
    end: true,
  },
];

function SidebarLink({ item, onClick }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-accent-500 text-text-on-dark shadow-[var(--shadow-soft)]"
            : "text-text-on-dark-secondary hover:bg-primary-700 hover:text-text-on-dark",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <div
            className={[
              "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
              isActive
                ? "bg-white/12 text-text-on-dark"
                : "bg-primary-800 text-text-on-dark-secondary group-hover:bg-primary-600 group-hover:text-text-on-dark",
            ].join(" ")}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <span className="truncate">{item.label}</span>
            <ChevronRight
              className={[
                "h-4 w-4 shrink-0 transition-transform duration-200",
                isActive
                  ? "translate-x-0 text-text-on-dark"
                  : "text-text-on-dark-muted group-hover:translate-x-0.5 group-hover:text-text-on-dark-secondary",
              ].join(" ")}
            />
          </div>
        </>
      )}
    </NavLink>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        setLoadingUser(true);

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Error obteniendo usuario:", error.message);
          if (mounted) setUserEmail("");
          return;
        }

        if (!mounted) return;

        setUserEmail(user?.email || "");
      } catch (error) {
        console.error("Error inesperado obteniendo usuario:", error);
        if (mounted) setUserEmail("");
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || "");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error al cerrar sesión:", error.message);
        return;
      }

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error inesperado al cerrar sesión:", error);
    } finally {
      setLoggingOut(false);
      setMobileOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Sidebar desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[290px] lg:flex-col border-r border-primary-800 bg-primary-900 text-text-on-dark">
        {/* Brand */}
        <div className="border-b border-primary-800 px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-[var(--shadow-soft)]">
              <img src="/camion.png" alt="Camión" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-on-dark-muted">
                Administración
              </p>
              <h1 className="truncate text-xl font-bold text-text-on-dark">
                Dashboard
              </h1>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 px-4 py-5">
          <div className="mb-4 px-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-on-dark-muted">
              Navegación
            </p>
          </div>

          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <SidebarLink key={item.to} item={item} />
            ))}
          </nav>
        </div>

        {/* Footer card */}
        <div className="border-t border-primary-800 p-4">
          <div className="rounded-2xl border border-primary-700 bg-primary-800/70 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-text-on-dark">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-on-dark-muted">
                  Sesión activa
                </p>

                <p className="mt-2 truncate text-sm font-semibold text-text-on-dark">
                  {loadingUser ? "Cargando..." : userEmail || "Sin correo"}
                </p>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary-600 bg-primary-700 px-4 text-sm font-semibold text-text-on-dark transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <LogOut className="h-4 w-4" />
                  {loggingOut ? "Cerrando..." : "Cerrar sesión"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile topbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl overflow-hidden shadow-[var(--shadow-soft)]">
              <img
                src="/camion.png"
                alt="Camión"
                className="h-8 w-8 object-contain"
              />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                Administración
              </p>
              <p className="truncate text-base font-bold text-text-primary">
                Dashboard
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface text-text-primary transition hover:border-border-strong hover:bg-surface-soft"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen ? (
          <div className="border-t border-border bg-surface px-4 py-4 shadow-[var(--shadow-soft)]">
            <div className="mb-4 rounded-2xl border border-border bg-surface-soft p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 border border-primary-100">
                  <Mail className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                    Sesión activa
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-text-primary">
                    {loadingUser ? "Cargando..." : userEmail || "Sin correo"}
                  </p>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <LogOut className="h-4 w-4" />
                    {loggingOut ? "Cerrando..." : "Cerrar sesión"}
                  </button>
                </div>
              </div>
            </div>

            <nav className="space-y-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      [
                        "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary-500 text-white"
                          : "text-text-secondary hover:bg-surface-soft hover:text-text-primary",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={[
                            "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                            isActive
                              ? "bg-white/12 text-white"
                              : "bg-surface-soft text-text-secondary group-hover:bg-primary-50 group-hover:text-primary-700",
                          ].join(" ")}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                          <span className="truncate">{item.label}</span>
                          <ChevronRight
                            className={[
                              "h-4 w-4 shrink-0 transition-transform duration-200",
                              isActive
                                ? "text-white"
                                : "text-text-muted group-hover:translate-x-0.5 group-hover:text-text-secondary",
                            ].join(" ")}
                          />
                        </div>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ) : null}
      </header>

      {/* Content area */}
      <div className="lg:pl-[290px]">
        <main className="px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
          <section className="mb-6 rounded-[28px] border border-border bg-surface px-5 py-5 shadow-[var(--shadow-soft)] md:px-6 md:py-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-accent-600">
                  Panel administrativo
                </p>

                <h2 className="mt-1 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                  Gestión de cotizaciones, productos y gastos
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  Visualiza el estado general de tu operación y administra cada
                  módulo desde un entorno claro, profesional y responsivo.
                </p>
              </div>

              <div className="flex flex-col gap-3 xl:items-end">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-info-100 bg-info-50 px-3 py-1 text-xs font-semibold text-info-700">
                    Sistema interno
                  </span>
                  <span className="inline-flex items-center rounded-full border border-success-100 bg-success-50 px-3 py-1 text-xs font-semibold text-success-700">
                    Activo
                  </span>
                </div>
              </div>
            </div>
          </section>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
