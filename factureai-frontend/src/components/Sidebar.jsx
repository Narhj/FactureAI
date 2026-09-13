import { NavLink } from "react-router-dom";
import {
  FileSpreadsheet,
  LayoutDashboard,
  Receipt,
  FolderKanban,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";

const LINKS = [
  { to: "/dashboard", label: "Panel de Control", icon: LayoutDashboard, end: true },
  { to: "/dashboard/facturas", label: "Facturas", icon: Receipt },
  { to: "/dashboard/proyectos", label: "Proyectos", icon: FolderKanban },
  { to: "/dashboard/informes", label: "Informes", icon: BarChart3 },
  { to: "/dashboard/configuracion", label: "Configuración", icon: Settings },
];

function iniciales(nombres, apellidos) {
  const n = (nombres || "").trim().charAt(0);
  const a = (apellidos || "").trim().charAt(0);
  return (n + a).toUpperCase() || "FA";
}

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="logo">
          <FileSpreadsheet size={19} />
        </span>
        <span>FactureAI</span>
      </div>

      <nav className="sidebar-nav">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="avatar">{iniciales(user?.nombres, user?.apellidos)}</div>
        <div className="who">
          <strong>
            {user?.nombres ? `${user.nombres} ${user.apellidos || ""}`.trim() : "Cuenta"}
          </strong>
          <span>{user?.correo}</span>
        </div>
        <button type="button" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
