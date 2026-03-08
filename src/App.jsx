import { Routes, Route } from "react-router-dom";

import Base from "./pages/start/Base.jsx";
import NotFound from "./pages/NotFound.jsx";
import Catalogo from "./pages/catalago.jsx";
import CatalogLayout from "./pages/Layout/CatalogLayout";
import ProductPage from "./pages/ProductPage.jsx";

import LoginPage from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardLayout from "./pages/Layout/DashboardLayout.jsx";
import DashboardHome from "./pages/dashboard/DashboardHome.jsx";
import QuotationsPage from "./pages/dashboard/QuotationsPage.jsx";
import ProductsAdminPage from "./pages/dashboard/ProductsAdminPage.jsx";
import ExpensesPage from "./pages/dashboard/ExpensesPage.jsx";
import TagsPage from "./pages/dashboard/LabelsPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* HOME */}
      <Route path="/" element={<Base />} />

      {/* LOGIN */}
      <Route path="/login" element={<LoginPage />} />

      {/* DASHBOARD PROTEGIDO */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="cotizaciones" element={<QuotationsPage />} />
        <Route path="productos" element={<ProductsAdminPage />} />
        <Route path="gastos" element={<ExpensesPage />} />
        <Route path="etiquetas" element={<TagsPage />} />
      </Route>

      {/* CATALOGO */}
      <Route path="/catalogo" element={<CatalogLayout />}>
        <Route index element={<Catalogo />} />
        <Route path=":id" element={<ProductPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
