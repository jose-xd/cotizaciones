import { useApp } from "../context/AppContext";
import { formatCurrency, ESTATUS_CONFIG } from "../utils/calculos";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { state } = useApp();

  const totalCotizaciones = state.cotizaciones.length;
  const cotizacionesAprobadas = state.cotizaciones.filter(
    (c) => c.estatus === "aprobada"
  );
  const totalAprobado = cotizacionesAprobadas.reduce(
    (acc, c) => acc + (c.total || 0), 0
  );
  const pendientes = state.cotizaciones.filter(
    (c) => c.estatus === "enviada"
  ).length;

  const recientes = [...state.cotizaciones]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  return (
    <div>
      {/* Stats grid */}
      <div className="card-grid card-grid--4" style={{ marginBottom: 24 }}>
        <div className="stat-card stat-card--accent">
          <div className="stat-card__label">Ingresos Aprobados</div>
          <div className="stat-card__value">{formatCurrency(totalAprobado)}</div>
          <div className="stat-card__sub">{cotizacionesAprobadas.length} cotizaciones</div>
          <span className="stat-card__icon">💰</span>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Cotizaciones</div>
          <div className="stat-card__value">{totalCotizaciones}</div>
          <div className="stat-card__sub">Total registradas</div>
          <span className="stat-card__icon">📄</span>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Clientes</div>
          <div className="stat-card__value">{state.clientes.length}</div>
          <div className="stat-card__sub">Registrados</div>
          <span className="stat-card__icon">👥</span>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">En Espera</div>
          <div className="stat-card__value" style={{ color: "var(--warning)" }}>
            {pendientes}
          </div>
          <div className="stat-card__sub">Cotizaciones enviadas</div>
          <span className="stat-card__icon">⏳</span>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="card-grid card-grid--3" style={{ marginBottom: 24, textDecoration: "none"}}>
        {[
          { path: "/cotizaciones", label: "Nueva Cotización", icon: "➕", desc: "Crear cotización para un cliente" },
          { path: "/clientes", label: "Agregar Cliente", icon: "👤", desc: "Registrar nuevo cliente" },
          { path: "/productos", label: "Nuevo Producto", icon: "📦", desc: "Agregar producto al catálogo" },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="card"
            style={{ textDecoration: "none", display: "block", cursor: "pointer", transition: "border-color 0.15s", color: "inherit" }}
            onMouseOver={e => e.currentTarget.style.borderColor = "var(--accent)"}
            onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: "var(--text3)" }}>{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* Cotizaciones recientes */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontFamily: "DM Serif Display, serif", fontSize: 18, fontWeight: 400 }}>
            Cotizaciones Recientes
          </h2>
          <Link to="/cotizaciones" className="btn btn--ghost btn--sm">
            Ver todas →
          </Link>
        </div>

        {recientes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📄</div>
            <div className="empty-state__title">Sin cotizaciones aún</div>
            <div className="empty-state__sub">Crea tu primera cotización para empezar</div>
            <Link to="/cotizaciones" className="btn btn--primary" style={{ marginTop: 8 }}>
              Crear cotización
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {recientes.map((cot) => {
                  const cliente = state.clientes.find((c) => c.id === cot.clienteId);
                  const cfg = ESTATUS_CONFIG[cot.estatus] || ESTATUS_CONFIG.borrador;
                  return (
                    <tr key={cot.id}>
                      <td style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>
                        {cot.numero}
                      </td>
                      <td>{cliente?.nombre || "—"}</td>
                      <td style={{ color: "var(--text3)" }}>{cot.fecha}</td>
                      <td style={{ fontFamily: "DM Mono, monospace" }}>
                        {formatCurrency(cot.total)}
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}