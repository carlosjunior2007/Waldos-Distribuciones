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
  ShieldCheck,
  UserRound,
  CheckCheck,
  Van,
  BugPlay,
  UsersRound,
  Boxes,
} from "lucide-react";
import { useEffect, useState } from "react";
import supabase from "../../utils/supabase.js";

const NAV_GROUPS = [
  {
    title: "Principal",
    items: [
      {
        label: "Resumen",
        to: "/dashboard",
        icon: LayoutDashboard,
        end: true,
      },
      {
        label: "Pedidos",
        to: "/dashboard/pedidos",
        icon: Van,
        end: true,
      },
      {
        label: "Cotizaciones",
        to: "/dashboard/cotizaciones",
        icon: FileText,
        end: true,
      },
      {
        label: "Contra Recibo",
        to: "/dashboard/contrarecibo",
        icon: CheckCheck,
        end: true,
      },
    ],
  },
  {
    title: "Catálogo y contactos",
    items: [
      {
        label: "Productos",
        to: "/dashboard/productos",
        icon: Package,
        end: true,
      },
      {
        label: "Clientes",
        to: "/dashboard/clientes",
        icon: UserRound,
        end: true,
      },
      {
        label: "Proveedores",
        to: "/dashboard/provedores",
        icon: UsersRound,
        end: true,
      },
    ],
  },
  {
    title: "Administración",
    items: [
      {
        label: "Gastos y ganancias",
        to: "/dashboard/gastos",
        icon: Wallet,
        end: true,
      },
      {
        label: "Playground",
        to: "/dashboard/playground",
        icon: BugPlay,
        end: true,
      },
    ],
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
          "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
          isActive
            ? "bg-white text-primary-900 shadow-[0_14px_34px_rgba(0,0,0,0.18)]"
            : "text-text-on-dark-secondary hover:bg-white/8 hover:text-text-on-dark",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <div
            className={[
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
              isActive
                ? "bg-accent-500 text-white"
                : "bg-white/8 text-text-on-dark-secondary group-hover:bg-white/12 group-hover:text-text-on-dark",
            ].join(" ")}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <span className="truncate">{item.label}</span>

            <ChevronRight
              className={[
                "h-4 w-4 shrink-0 transition-all duration-200",
                isActive
                  ? "text-primary-700"
                  : "text-text-on-dark-muted group-hover:translate-x-0.5 group-hover:text-text-on-dark-secondary",
              ].join(" ")}
            />
          </div>
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({
  onLinkClick,
  userEmail,
  loadingUser,
  loggingOut,
  handleLogout,
}) {
  return (
    <>
      {/* Brand */}
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-16 shrink-0 items-center justify-center">
            <img
              src="/camion.png"
              alt="Waldo Distribuciones"
              className="h-full w-full object-contain"
            />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-text-on-dark-muted">
              Administración
            </p>

            <h1 className="mt-1 truncate text-xl font-black text-text-on-dark">
              Dashboard
            </h1>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="dashboard-sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="mb-2 px-2">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-text-on-dark-muted">
                  {group.title}
                </p>
              </div>

              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <SidebarLink
                    key={item.to}
                    item={item}
                    onClick={onLinkClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer card */}
      <div className="border-t border-white/10 p-3">
        <div className="rounded-3xl border border-white/10 bg-white/6 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.14)]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/8 text-text-on-dark ring-1 ring-white/10">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-text-on-dark-muted">
                Sesión activa
              </p>

              <p className="mt-2 truncate text-sm font-bold text-text-on-dark">
                {loadingUser ? "Cargando..." : userEmail || "Sin correo"}
              </p>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="
                  mt-4 inline-flex h-10 w-full items-center justify-center gap-2
                  rounded-xl border border-white/10 bg-white/8 px-4
                  text-sm font-bold text-text-on-dark
                  transition hover:bg-white/12
                  disabled:cursor-not-allowed disabled:opacity-70
                "
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? "Cerrando..." : "Cerrar sesión"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
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

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

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
      <aside
        className="
          hidden overflow-hidden border-r border-white/10
          bg-primary-900 text-text-on-dark
          lg:fixed lg:inset-y-0 lg:left-0 lg:z-40
          lg:flex lg:w-[286px] lg:flex-col
        "
      >
        <SidebarContent
          userEmail={userEmail}
          loadingUser={loadingUser}
          loggingOut={loggingOut}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Mobile topbar */}
      <header
        className="
          sticky top-0 z-50 border-b border-border
          bg-surface/95 backdrop-blur
          lg:hidden
        "
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/camion.png"
              alt="Waldo Distribuciones"
              className="h-10 w-14 shrink-0 object-contain"
            />

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                Administración
              </p>

              <p className="truncate text-base font-black text-text-primary">
                Dashboard
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="
              inline-flex h-11 w-11 items-center justify-center
              rounded-2xl border border-border bg-surface
              text-text-primary transition
              hover:border-border-strong hover:bg-surface-soft
            "
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={[
          "fixed inset-0 z-[60] lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className={[
            "absolute inset-0 bg-slate-950/45 backdrop-blur-sm transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          aria-label="Cerrar menú"
        />

        <aside
          className={[
            "absolute left-0 top-0 flex h-[100dvh] w-[min(88vw,310px)] flex-col overflow-hidden border-r border-white/10 bg-primary-900 text-text-on-dark shadow-2xl transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src="/camion.png"
                alt="Waldo Distribuciones"
                className="h-10 w-14 shrink-0 object-contain"
              />

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-on-dark-muted">
                  Administración
                </p>

                <p className="truncate text-base font-black text-text-on-dark">
                  Dashboard
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 text-white transition hover:bg-white/12"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <SidebarContent
            onLinkClick={() => setMobileOpen(false)}
            userEmail={userEmail}
            loadingUser={loadingUser}
            loggingOut={loggingOut}
            handleLogout={handleLogout}
          />
        </aside>
      </div>

      {/* Content area */}
      <div className="lg:pl-[286px]">
        <main className="w-full px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
          <section className="mb-6 rounded-[28px] border border-border bg-surface px-5 py-5 shadow-[var(--shadow-soft)] md:px-6 md:py-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-accent-600">
                  Panel administrativo
                </p>

                <h2 className="mt-1 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                  Gestión de pedidos, cotizaciones y productos
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  Administra las áreas principales del sistema desde un panel
                  más ordenado, claro y fácil de navegar.
                </p>
              </div>

              <div className="flex flex-col gap-3 xl:items-end">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-info-100 bg-info-50 px-3 py-1 text-xs font-semibold text-info-700">
                    <Boxes className="h-3.5 w-3.5" />
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