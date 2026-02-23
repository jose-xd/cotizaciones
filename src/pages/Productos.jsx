import { useState } from "react";
import { useApp, ACTIONS } from "../context/AppContext";
import { v4 as uuidv4 } from "uuid";
import { formatCurrency } from "../utils/calculos";

const EMPTY = { nombre: "", descripcion: "", sku: "", precio: "", unidad: "pza", categoria: "", stock: "" };
const UNIDADES = ["pza", "kg", "lt", "mt", "m2", "m3", "hr", "día", "caja", "rollo", "par", "juego", "servicio"];

export default function Productos() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const filtered = state.productos.filter(
    (p) =>
      p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() { setForm(EMPTY); setErrors({}); setModal({ mode: "create" }); }
  function openEdit(p) { setForm({ ...p }); setErrors({}); setModal({ mode: "edit" }); }
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
    const payload = { ...form, precio: parseFloat(form.precio), stock: form.stock ? parseFloat(form.stock) : null };
    if (modal.mode === "create") {
      dispatch({ type: ACTIONS.ADD_PRODUCTO, payload: { ...payload, id: uuidv4(), createdAt: new Date().toISOString() } });
    } else {
      dispatch({ type: ACTIONS.UPDATE_PRODUCTO, payload });
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
          <div className="page-header__title">Productos</div>
          <div className="page-header__sub">{state.productos.length} productos en catálogo</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn--primary" onClick={openCreate}>+ Nuevo Producto</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📦</div>
          <div className="empty-state__title">{search ? "Sin resultados" : "No hay productos aún"}</div>
          <div className="empty-state__sub">{search ? "Intenta con otro término" : "Agrega productos a tu catálogo"}</div>
          {!search && <button className="btn btn--primary" onClick={openCreate} style={{ marginTop: 12 }}>+ Nuevo Producto</button>}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Nombre</th><th>SKU</th><th>Categoría</th><th>Unidad</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                    {p.descripcion && <div style={{ fontSize: 12, color: "var(--text3)" }}>{p.descripcion.slice(0, 50)}{p.descripcion.length > 50 ? "…" : ""}</div>}
                  </td>
                  <td style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>{p.sku || "—"}</td>
                  <td style={{ color: "var(--text3)" }}>{p.categoria || "—"}</td>
                  <td><span className="badge" style={{ background: "var(--bg3)", color: "var(--text2)" }}>{p.unidad}</span></td>
                  <td style={{ fontFamily: "DM Mono, monospace", color: "var(--accent)" }}>{formatCurrency(p.precio)}</td>
                  <td style={{ color: p.stock != null && p.stock <= 5 ? "var(--warning)" : "var(--text3)" }}>
                    {p.stock != null ? p.stock : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => openEdit(p)}>✏️ Editar</button>
                      <button className="btn btn--danger btn--sm" onClick={() => setDeleteConfirm(p)}>🗑️</button>
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
              <h2 className="modal__title">{modal.mode === "create" ? "Nuevo Producto" : "Editar Producto"}</h2>
              <button className="btn btn--ghost btn--sm" onClick={closeModal}>✕</button>
            </div>
            <div className="modal__body">
              {field("nombre", "Nombre del producto *", "text", "Ej. Cable UTP Cat6")}
              <div className="form-row">
                {field("sku", "SKU / Código", "text", "PROD-001")}
                {field("categoria", "Categoría", "text", "Electrónica")}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Precio unitario *</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={form.precio || ""}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    style={errors.precio ? { borderColor: "var(--danger)" } : {}} />
                  {errors.precio && <span style={{ color: "var(--danger)", fontSize: 11 }}>{errors.precio}</span>}
                </div>
                <div className="form-group">
                  <label>Unidad</label>
                  <select value={form.unidad || "pza"} onChange={(e) => setForm({ ...form, unidad: e.target.value })}>
                    {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                {field("stock", "Stock disponible", "number", "0")}
                <div />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea placeholder="Descripción del producto..." value={form.descripcion || ""}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={closeModal}>Cancelar</button>
              <button className="btn btn--primary" onClick={handleSave}>
                {modal.mode === "create" ? "Crear Producto" : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal__header"><h2 className="modal__title">¿Eliminar producto?</h2></div>
            <div className="modal__body">
              <p style={{ color: "var(--text2)" }}>
                Eliminarás <strong style={{ color: "var(--text)" }}>{deleteConfirm.nombre}</strong> del catálogo. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn btn--danger" onClick={() => { dispatch({ type: ACTIONS.DELETE_PRODUCTO, payload: deleteConfirm.id }); setDeleteConfirm(null); }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}