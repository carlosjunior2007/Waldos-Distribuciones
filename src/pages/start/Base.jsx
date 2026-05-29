import { useRef } from "react";
import Navbar from "../../components/Navbar.jsx";
import Hero from "./Hero.jsx";
import Categorias from "./Categorias.jsx";
import Trabajo from "./Trabajo.jsx";
import Cobertura from "./Cobertura.jsx";
import Contacto from "./Contacto.jsx";
import Footer from "./Foooter.jsx";

export default function Base() {
  const pageRef = useRef(null);

  const handleMouseMove = (event) => {
    if (!pageRef.current) return;

    pageRef.current.style.setProperty("--mouse-x", `${event.clientX}px`);
    pageRef.current.style.setProperty("--mouse-y", `${event.clientY}px`);
  };

  return (
    <main
      ref={pageRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen overflow-hidden bg-[#f5f8fc]"
      style={{
        "--mouse-x": "50vw",
        "--mouse-y": "30vh",
      }}
    >
      {/* Fondo base uniforme */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[#f5f8fc]" />

      {/* Cuadrícula base */}
      <div
        className="
          pointer-events-none fixed inset-0 z-0 opacity-[0.24]
          [background-image:linear-gradient(to_right,rgba(14,52,103,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(14,52,103,0.08)_1px,transparent_1px)]
          [background-size:44px_44px]
          sm:[background-size:52px_52px]
        "
      />

      {/* Halo suave azul alrededor del mouse */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(240px circle at var(--mouse-x) var(--mouse-y), rgba(22,119,255,0.12), rgba(22,119,255,0.08) 28%, rgba(22,119,255,0.04) 46%, transparent 72%)",
        }}
      />

      {/* Cuadrícula iluminada cerca del mouse */}
      <div
        className="
          pointer-events-none fixed inset-0 z-0 opacity-[0.95]
          [background-image:linear-gradient(to_right,rgba(22,119,255,0.30)_1px,transparent_1px),linear-gradient(to_bottom,rgba(22,119,255,0.30)_1px,transparent_1px)]
          [background-size:44px_44px]
          sm:[background-size:52px_52px]
        "
        style={{
          WebkitMaskImage:
            "radial-gradient(210px circle at var(--mouse-x) var(--mouse-y), rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 24%, rgba(0,0,0,0.72) 44%, rgba(0,0,0,0.28) 62%, transparent 76%)",
          maskImage:
            "radial-gradient(210px circle at var(--mouse-x) var(--mouse-y), rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 24%, rgba(0,0,0,0.72) 44%, rgba(0,0,0,0.28) 62%, transparent 76%)",
        }}
      />

      <div className="relative z-10">
        <Navbar />
        <Hero />
        <Categorias />
        <Trabajo />
        <Cobertura />
        <Contacto />
        <Footer />
      </div>
    </main>
  );
}
