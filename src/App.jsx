import { Routes, Route } from "react-router-dom";
import Base from "./pages/start/Base.jsx";
import NotFound from "./pages/NotFound.jsx";
import Catalogo from "./pages/catalago.jsx";
import CatalogLayout from "./pages/CatalogLayout";
import ProductPage from "./pages/ProductPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Base />} />
      <Route path="/catalogo" element={<CatalogLayout />}>
        <Route index element={<Catalogo />} />
        <Route path=":id" element={<ProductPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}