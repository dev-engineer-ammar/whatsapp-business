import { Outlet, useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { AdminNav } from "../../components/AdminNav";

const titles: Record<string, string> = {
  "/admin": "Overview",
  "/admin/orders": "Orders",
  "/admin/products": "Products",
  "/admin/payments": "Payments",
};

export function AdminLayout() {
  const location = useLocation();

  return (
    <main className="app-shell">
      <AdminNav />
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations</p>
            <h2>{titles[location.pathname] ?? "Admin"}</h2>
          </div>
          <button type="button" onClick={() => window.location.reload()}>
            <RefreshCw size={17} />
            Refresh
          </button>
        </header>
        <Outlet />
      </section>
    </main>
  );
}
