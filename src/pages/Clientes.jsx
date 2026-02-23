import { useState } from "react";
import { useApp, ACTIONS } from "../context/AppContext";
import { v4 as uuidv4 } from "uuid";

const EMPTY_CLIENTE = {
  nombre: "", empresa: "", rfc: "", email: "",
  telefono: "", direccion: "", ciudad: "", notas: "",
};

export default function Clientes() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(EMPTY_CLIENTE);
  const [errors, setErrors] = useState({});

  const filtered = state.clientes.filter(
    (c) =>
      c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      c.empresa?.toLowerCase().includes(search.toLowerCase()) ||
      c.rfc?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() { setForm(EMPTY_CLIENTE); setErrors({}); setModal({ mode: "create" }); }
  function openEdit(c) { setForm({ ...c }); setErrors({}); setModal({ mode: "edit", data: c }); }
  function closeModal() { setModal(null); setForm(EMPTY_CLIENTE); setErrors({}); }

  function validate() {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es requerido";
    if (form.email && !/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) e.email = "Email inválido";
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    if (modal.mode === "create") {
      dispatch({ type: ACTIONS.ADD_CLIENTE, payload: { ...form, id: uuidv4(), createdAt: new Date().toISOString() } });
    } else {
      dispatch({ type: ACTIONS.UPDATE_CLIENTE, payload: form });
    }
    closeModal();
  }

  function handleDelete(id) { dispatch({ type: ACTIONS.DELETE_CLIENTE, payload: id }); setDeleteConfirm(null); }

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
          <div className="page-header__title">Clientes</div>
          <div className="page-header__sub">{state.clientes.length} clientes registrados</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn--primary" onClick={openCreate}>+ Nuevo Cliente</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">👥</div>
          <div className="empty-state__title">{search ? "Sin resultados" : "No hay clientes aún"}</div>
          <div className="empty-state__sub">{search ? "Intenta con otro término" : "Agrega tu primer cliente"}</div>
          {!search && <button className="btn btn--primary" onClick={openCreate} style={{ marginTop: 12 }}>+ Nuevo Cliente</button>}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Nombre / Empresa</th><th>RFC</th><th>Contacto</th><th>Ciudad</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{c.nombre}</div>
                    {c.empresa && <div style={{ fontSize: 12, color: "var(--text3)" }}>{c.empresa}</div>}
                  </td>
                  <td style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>{c.rfc || "—"}</td>
                  <td>
                    {c.email && <div style={{ fontSize: 13 }}>{c.email}</div>}
                    {c.telefono && <div style={{ fontSize: 12, color: "var(--text3)" }}>{c.telefono}</div>}
                  </td>
                  <td style={{ color: "var(--text3)" }}>{c.ciudad || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => openEdit(c)}>✏️ Editar</button>
                      <button className="btn btn--danger btn--sm" onClick={() => setDeleteConfirm(c)}>🗑️</button>
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
              <h2 className="modal__title">{modal.mode === "create" ? "Nuevo Cliente" : "Editar Cliente"}</h2>
              <button className="btn btn--ghost btn--sm" onClick={closeModal}>✕</button>
            </div>
            <div className="modal__body">
              <div className="form-row">
                {field("nombre", "Nombre completo *", "text", "Juan García")}
                {field("empresa", "Empresa / Razón social", "text", "Empresa SA de CV")}
              </div>
              <div className="form-row">
                {field("rfc", "RFC", "text", "XAXX010101000")}
                {field("email", "Correo electrónico", "email", "contacto@empresa.com")}
              </div>
              <div className="form-row">
                {field("telefono", "Teléfono", "tel", "664-000-0000")}
                {field("ciudad", "Ciudad", "text", "Hermosillo, Sonora")}
              </div>
              {field("direccion", "Dirección completa", "text", "Calle Principal #100")}
              <div className="form-group">
                <label>Notas</label>
                <textarea placeholder="Notas adicionales..." value={form.notas || ""}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })} />
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={closeModal}>Cancelar</button>
              <button className="btn btn--primary" onClick={handleSave}>
                {modal.mode === "create" ? "Crear Cliente" : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal__header"><h2 className="modal__title">¿Eliminar cliente?</h2></div>
            <div className="modal__body">
              <p style={{ color: "var(--text2)" }}>
                Estás a punto de eliminar a <strong style={{ color: "var(--text)" }}>{deleteConfirm.nombre}</strong>. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn btn--danger" onClick={() => handleDelete(deleteConfirm.id)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}