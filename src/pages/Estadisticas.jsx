import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { formatCurrency, ESTATUS_CONFIG } from "../utils/calculos";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const COLORS = ["#c8f04a", "#4db8ff", "#ff5c5c", "#ffb84d", "#4dffb8", "#c084fc"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      {label && <div style={{ color: "var(--text3)", marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "var(--accent)" }}>
          {p.name}: <strong>{typeof p.value === "number" && p.name?.toLowerCase().includes("total") ? formatCurrency(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function Estadisticas() {
  const { state } = useApp();

  const stats = useMemo(() => {
    const cots = state.cotizaciones;
    const total = cots.reduce((a, c) => a + (c.total || 0), 0);
    const aprobadas = cots.filter((c) => c.estatus === "aprobada");
    const totalAprobado = aprobadas.reduce((a, c) => a + (c.total || 0), 0);

    // Cotizaciones por mes (año actual)
    const year = new Date().getFullYear();
    const porMes = MESES.map((mes, i) => {
      const del_mes = cots.filter((c) => {
        const d = new Date(c.fecha);
        return d.getFullYear() === year && d.getMonth() === i;
      });
      return {
        mes,
        cotizaciones: del_mes.length,
        total: del_mes.reduce((a, c) => a + (c.total || 0), 0),
        aprobadas: del_mes.filter((c) => c.estatus === "aprobada").length,
      };
    });

    // Por estatus
    const porEstatus = Object.entries(ESTATUS_CONFIG).map(([key, cfg]) => ({
      name: cfg.label,
      value: cots.filter((c) => c.estatus === key).length,
      color: cfg.color,
    })).filter((e) => e.value > 0);

    // Top clientes
    const clienteMap = {};
    cots.forEach((c) => {
      if (!c.clienteId) return;
      if (!clienteMap[c.clienteId]) clienteMap[c.clienteId] = { count: 0, total: 0 };
      clienteMap[c.clienteId].count++;
      clienteMap[c.clienteId].total += c.total || 0;
    });
    const topClientes = Object.entries(clienteMap)
      .map(([id, data]) => {
        const cl = state.clientes.find((c) => c.id === id);
        return { nombre: cl?.nombre || "Desconocido", ...data };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Top productos
    const prodMap = {};
    cots.forEach((c) => {
      (c.items || []).forEach((item) => {
        const key = item.nombre;
        if (!prodMap[key]) prodMap[key] = { count: 0, total: 0 };
        prodMap[key].count += item.cantidad || 1;
        prodMap[key].total += (item.precio * item.cantidad) || 0;
      });
    });
    const topProductos = Object.entries(prodMap)
      .map(([nombre, data]) => ({ nombre, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { total, totalAprobado, porMes, porEstatus, topClientes, topProductos, aprobadas };
  }, [state]);

  const tasaAprobacion = state.cotizaciones.length
    ? Math.round((stats.aprobadas.length / state.cotizaciones.length) * 100)
    : 0;

  if (state.cotizaciones.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">📊</div>
        <div className="empty-state__title">Sin datos todavía</div>
        <div className="empty-state__sub">Crea cotizaciones para ver estadísticas aquí</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPIs */}
      <div className="card-grid card-grid--4">
        <div className="stat-card stat-card--accent">
          <div className="stat-card__label">Total Cotizado</div>
          <div className="stat-card__value" style={{ fontSize: 20 }}>{formatCurrency(stats.total)}</div>
          <div className="stat-card__sub">{state.cotizaciones.length} cotizaciones</div>
          <span className="stat-card__icon">💰</span>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Total Aprobado</div>
          <div className="stat-card__value" style={{ fontSize: 20, color: "var(--success)" }}>{formatCurrency(stats.totalAprobado)}</div>
          <div className="stat-card__sub">{stats.aprobadas.length} cotizaciones</div>
          <span className="stat-card__icon">✅</span>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Tasa de Aprobación</div>
          <div className="stat-card__value" style={{ color: tasaAprobacion >= 50 ? "var(--success)" : "var(--warning)" }}>
            {tasaAprobacion}%
          </div>
          <div className="stat-card__sub">De cotizaciones enviadas</div>
          <span className="stat-card__icon">📈</span>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Clientes Activos</div>
          <div className="stat-card__value">{state.clientes.length}</div>
          <div className="stat-card__sub">{state.productos.length + state.servicios.length} ítems en catálogo</div>
          <span className="stat-card__icon">👥</span>
        </div>
      </div>

      {/* Cotizaciones por mes */}
      <div className="card">
        <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 16, marginBottom: 20 }}>Cotizaciones por mes ({new Date().getFullYear()})</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.porMes}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="mes" tick={{ fill: "var(--text3)", fontSize: 11 }} />
            <YAxis tick={{ fill: "var(--text3)", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--text3)" }} />
            <Bar dataKey="cotizaciones" name="Cotizaciones" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="aprobadas" name="Aprobadas" fill="var(--success)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Total cotizado por mes + Distribución por estatus */}
      <div className="card-grid card-grid--2">
        <div className="card">
          <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 16, marginBottom: 20 }}>Monto cotizado por mes</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={stats.porMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fill: "var(--text3)", fontSize: 10 }} />
              <YAxis tick={{ fill: "var(--text3)", fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="total" name="Total" stroke="var(--accent)" strokeWidth={2} dot={{ fill: "var(--accent)", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 16, marginBottom: 20 }}>Distribución por estatus</div>
          {stats.porEstatus.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={stats.porEstatus} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="value" paddingAngle={3}>
                    {stats.porEstatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {stats.porEstatus.map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                    <span style={{ color: "var(--text2)", fontSize: 12, flex: 1 }}>{e.name}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "var(--text)" }}>{e.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: "var(--text3)", fontSize: 13, textAlign: "center", paddingTop: 40 }}>Sin datos</div>
          )}
        </div>
      </div>

      {/* Top clientes + Top productos */}
      <div className="card-grid card-grid--2">
        <div className="card">
          <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 16, marginBottom: 16 }}>Top Clientes</div>
          {stats.topClientes.length === 0 ? (
            <div style={{ color: "var(--text3)", fontSize: 13 }}>Sin datos</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stats.topClientes.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: COLORS[i % COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0f0f12", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontWeight: 500, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nombre}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{c.count} cotizaciones</div>
                  </div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>
                    {formatCurrency(c.total)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 16, marginBottom: 16 }}>Top Conceptos Cotizados</div>
          {stats.topProductos.length === 0 ? (
            <div style={{ color: "var(--text3)", fontSize: 13 }}>Sin datos</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stats.topProductos.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: COLORS[i % COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0f0f12", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontWeight: 500, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{p.count} unidades cotizadas</div>
                  </div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 13, color: "var(--info)", fontWeight: 600 }}>
                    {formatCurrency(p.total)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}