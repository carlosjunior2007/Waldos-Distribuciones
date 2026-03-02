import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 flex items-center justify-between gap-6 text-center">
        
        {/* Logo */}
        <Link to="/" className="inline-flex items-center">
          <img
            src="/Logo.png"
            alt="Waldo Distribuciones"
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* Derechos */}
        <p className="text-sm text-text-on-light-muted">
          © {new Date().getFullYear()} Waldo Distribuciones. 
          Todos los derechos reservados.
        </p>

      </div>
    </footer>
  );
}