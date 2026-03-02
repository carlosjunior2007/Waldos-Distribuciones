import Navbar from "../../components/Navbar.jsx";
import Hero from "./Hero.jsx";
import Categorias from "./Categorias.jsx";
import Trabajo from "./Trabajo.jsx";
import Cobertura from "./Cobertura.jsx";
import Contacto from "./Contacto.jsx";
import Footer from "./Foooter.jsx";

export default function Base() {
  return (
    <>
      <Navbar />
      <Hero />
      <Categorias/>
      <Trabajo/>
      <Cobertura/>
      <Contacto/>
      <Footer/>
    </>
  );
}
