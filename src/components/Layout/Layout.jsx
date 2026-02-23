import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: "⬛", exact: true },
  { path: "/cotizaciones", label: "Cotizaciones", icon: "📄" },
  { path: "/clientes", label: "Clientes", icon: "👥" },
  { path: "/productos", label: "Productos", icon: "📦" },
  { path: "/servicios", label: "Servicios", icon: "⚙️" },
  { path: "/estadisticas", label: "Estadísticas", icon: "📊" },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { state } = useApp();
  const location = useLocation();

  const currentPage = NAV_ITEMS.find((item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : "sidebar--closed"}`}>
        <div className="sidebar__brand">
          <div className="brand-icon">◈</div>
          {sidebarOpen && (
            <div className="brand-text">
              <span className="brand-name">{state.empresa.nombre}</span>
              <span className="brand-sub">Sistema de Cotizaciones</span>
            </div>
          )}
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item--active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Colapsar" : "Expandir"}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar__left">
            <h1 className="page-title">{currentPage?.label || "App"}</h1>
          </div>
          <div className="topbar__right">
            <div className="stats-pill">
              <span>📄 {state.cotizaciones.length} cotizaciones</span>
              <span>|</span>
              <span>👥 {state.clientes.length} clientes</span>
            </div>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}