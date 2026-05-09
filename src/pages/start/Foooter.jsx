import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-14 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          
          {/* Marca */}
          <div className="max-w-sm">
            <Link
              to="/"
              className="inline-flex items-center"
            >
              <img
                src="/Logo.png"
                alt="Waldo Distribuciones"
                className="h-11 w-auto object-contain"
              />
            </Link>

            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Distribución de productos de limpieza, higiene,
              desechables y suministros para negocios.
            </p>
          </div>

          {/* Información */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-900">
                Contacto
              </h3>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail className="h-4 w-4 text-[#081f3a]" />
                  <span>contacto@waldodistribuciones.com</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-[#081f3a]" />
                  <span>Tijuana, Baja California</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-900">
                Navegación
              </h3>

              <div className="mt-4 flex flex-col gap-3">
                <Link
                  to="/catalogo"
                  className="text-sm text-slate-600 transition hover:text-[#081f3a]"
                >
                  Catálogo
                </Link>

                <a
                  href="#contacto"
                  className="text-sm text-slate-600 transition hover:text-[#081f3a]"
                >
                  Contacto
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Waldo Distribuciones. Todos los
            derechos reservados.
          </p>

          <p className="text-sm text-slate-500">
            Sitio desarrollado por{" "}
            <a
              href="https://jumalancers.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#081f3a] transition hover:text-emerald-700"
            >
              Jumalancers
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}