import { Navigate, Route, Routes } from "react-router-dom";
import { Login } from "../auth/Login";
import { Register } from "../auth/Register";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import { AdminLayout } from "../pages/admin/AdminLayout";
import { OverviewPage } from "../pages/admin/OverviewPage";
import { OrdersPage } from "../pages/admin/OrdersPage";
import { ProductsPage } from "../pages/admin/ProductsPage";
import { PaymentsPage } from "../pages/admin/PaymentsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
