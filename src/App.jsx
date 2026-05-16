import { Routes, Route } from "react-router-dom";

import Base from "./pages/start/Base.jsx";
import NotFound from "./pages/NotFound.jsx";
import Catalogo from "./pages/catalago.jsx";
import CatalogLayout from "./pages/Layout/CatalogLayout";
import ProductPage from "./pages/ProductPage.jsx";

import LoginPage from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardLayout from "./pages/Layout/DashboardLayout.jsx";
import DashboardHome from "./features/dashboard/pages/DashboardHome.jsx";
import QuotationsPage from "./features/quotations/pages/QuotationsPage.jsx";
import ProductsAdminPage from "./features/products/pages/ProductsAdminPage.jsx";
import ExpensesPage from "./features/expenses/pages/ExpensesPage.jsx";
import ClientsPage from "./features/clients/pages/ClientsPage.jsx";
import ReceiptsPage from "./features/receipts/pages/ReceiptsPage.jsx";
import TagsPage from "./features/labels/pages/LabelsPage.jsx";
import Pedidos from "./features/Pedidos/pages/PedidosPage.jsx";
import TrackingPage from "./features/tracking/pages/TrackingPage.jsx";
import PlaygroundPage from "./features/playground/pages/PlaygroundPage.jsx";
import PlaygroundListPage from "./features/playground/pages/PlaygroundListPage.jsx";
import PublicPlaygroundPage from "./features/playground/pages/PublicPlaygroundPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* HOME */}
      <Route path="/" element={<Base />} />

      {/* LOGIN */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/tracking" element={<TrackingPage />} />
      <Route path="/playground/public/:shareToken" element={<PublicPlaygroundPage />} />

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
        <Route path="clientes" element={<ClientsPage />} />
        <Route path="contrarecibo" element={<ReceiptsPage />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="playground" element={<PlaygroundListPage  />} />
        <Route path="playground/:playgroundId" element={<PlaygroundPage  />} />
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
