import { useState } from "react";
import { useApp, ACTIONS } from "../context/AppContext";
import { v4 as uuidv4 } from "uuid";
import { formatCurrency } from "../utils/calculos";

const EMPTY = { nombre: "", descripcion: "", precio: "", tipo: "fijo", categoria: "" };

export default function Servicios() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const filtered = state.servicios.filter(
    (s) =>
      s.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      s.categoria?.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() { setForm(EMPTY); setErrors({}); setModal({ mode: "create" }); }
  function openEdit(s) { setForm({ ...s }); setErrors({}); setModal({ mode: "edit" }); }
  function closeModal() { setModal(null); setForm(EMPTY); setErrors({}); }

  function validate() {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es requerido";
    if (!form.precio || isNaN(form.precio) || parseFloat(form.precio) < 0) e.precio = "Precio inválido";
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    const payload = { ...form, precio: parseFloat(form.precio) };
    if (modal.mode === "create") {
      dispatch({ type: ACTIONS.ADD_SERVICIO, payload: { ...payload, id: uuidv4(), createdAt: new Date().toISOString() } });
    } else {
      dispatch({ type: ACTIONS.UPDATE_SERVICIO, payload });
    }
    closeModal();
  }

  const field = (key, label, type = "text", placeholder = "") => (
    <div className="form-group">
      <label>{label}</label>
      <input type={type} placeholder={placeholder} value={form[key] || ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        style={errors[key] ? { borderColor: "var(--danger)" } : {}} />
      {errors[key] && <span style={{ color: "var(--danger)", fontSize: 11 }}>{errors[key]}</span>}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header__title">Servicios</div>
          <div className="page-header__sub">{state.servicios.length} servicios en catálogo</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder="Buscar servicio..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn--primary" onClick={openCreate}>+ Nuevo Servicio</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">⚙️</div>
          <div className="empty-state__title">{search ? "Sin resultados" : "No hay servicios aún"}</div>
          <div className="empty-state__sub">{search ? "Intenta con otro término" : "Agrega servicios a tu catálogo"}</div>
          {!search && <button className="btn btn--primary" onClick={openCreate} style={{ marginTop: 12 }}>+ Nuevo Servicio</button>}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Nombre</th><th>Categoría</th><th>Tipo</th><th>Precio</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.nombre}</div>
                    {s.descripcion && <div style={{ fontSize: 12, color: "var(--text3)" }}>{s.descripcion.slice(0, 60)}{s.descripcion.length > 60 ? "…" : ""}</div>}
                  </td>
                  <td style={{ color: "var(--text3)" }}>{s.categoria || "—"}</td>
                  <td>
                    <span className="badge" style={{
                      background: s.tipo === "hora" ? "rgba(77,184,255,0.1)" : "rgba(200,240,74,0.1)",
                      color: s.tipo === "hora" ? "var(--info)" : "var(--accent)"
                    }}>
                      {s.tipo === "hora" ? "Por hora" : "Precio fijo"}
                    </span>
                  </td>
                  <td style={{ fontFamily: "DM Mono, monospace", color: "var(--accent)" }}>
                    {formatCurrency(s.precio)}{s.tipo === "hora" ? "/hr" : ""}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => openEdit(s)}>✏️ Editar</button>
                      <button className="btn btn--danger btn--sm" onClick={() => setDeleteConfirm(s)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal__header">
              <h2 className="modal__title">{modal.mode === "create" ? "Nuevo Servicio" : "Editar Servicio"}</h2>
              <button className="btn btn--ghost btn--sm" onClick={closeModal}>✕</button>
            </div>
            <div className="modal__body">
              {field("nombre", "Nombre del servicio *", "text", "Ej. Instalación eléctrica")}
              {field("categoria", "Categoría", "text", "Instalaciones")}
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de precio</label>
                  <select value={form.tipo || "fijo"} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                    <option value="fijo">Precio fijo</option>
                    <option value="hora">Por hora</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Precio {form.tipo === "hora" ? "(por hora)" : ""} *</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={form.precio || ""}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    style={errors.precio ? { borderColor: "var(--danger)" } : {}} />
                  {errors.precio && <span style={{ color: "var(--danger)", fontSize: 11 }}>{errors.precio}</span>}
                </div>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea placeholder="Descripción del servicio..." value={form.descripcion || ""}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={closeModal}>Cancelar</button>
              <button className="btn btn--primary" onClick={handleSave}>
                {modal.mode === "create" ? "Crear Servicio" : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal__header"><h2 className="modal__title">¿Eliminar servicio?</h2></div>
            <div className="modal__body">
              <p style={{ color: "var(--text2)" }}>
                Eliminarás <strong style={{ color: "var(--text)" }}>{deleteConfirm.nombre}</strong> del catálogo.
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn btn--danger" onClick={() => { dispatch({ type: ACTIONS.DELETE_SERVICIO, payload: deleteConfirm.id }); setDeleteConfirm(null); }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}