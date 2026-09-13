import { NavLink, Outlet } from "react-router-dom";

const SUBTABS = [
  { to: "/dashboard/configuracion", label: "Perfil", end: true },
  { to: "/dashboard/configuracion/seguridad", label: "Seguridad" },
  { to: "/dashboard/configuracion/preferencias", label: "Preferencias" },
  { to: "/dashboard/configuracion/personalizacion", label: "Personalización" },
  { to: "/dashboard/configuracion/actividad", label: "Actividad" },
];

export default function Configuracion() {
  return (
    <div>
      <div className="page-header">
        <h1>Configuración</h1>
        <p>Administra tu cuenta y personaliza FactureAI.</p>
      </div>

      <nav className="settings-tabs">
        {SUBTABS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `settings-tab${isActive ? " active" : ""}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
