import { Boxes, CreditCard, LayoutDashboard, ListOrdered, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export function AdminNav() {
  const { logout } = useAuth();

  return (
    <aside className="sidebar">
      <div>
        <p className="eyebrow">WhatsApp Commerce</p>
        <h1>Admin Panel</h1>
      </div>

      <nav className="nav-list" aria-label="Admin sections">
        <NavItem to="/admin" end icon={<LayoutDashboard size={18} />} label="Overview" />
        <NavItem to="/admin/orders" icon={<ListOrdered size={18} />} label="Orders" />
        <NavItem to="/admin/products" icon={<Boxes size={18} />} label="Products" />
        <NavItem to="/admin/payments" icon={<CreditCard size={18} />} label="Payments" />
      </nav>

      <button className="subtle-button" type="button" onClick={logout}>
        <LogOut size={17} />
        Sign out
      </button>
    </aside>
  );
}

function NavItem({
  to,
  end,
  icon,
  label,
}: {
  to: string;
  end?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink className={({ isActive }) => (isActive ? "nav-button active" : "nav-button")} to={to} end={end}>
      {icon}
      {label}
    </NavLink>
  );
}
