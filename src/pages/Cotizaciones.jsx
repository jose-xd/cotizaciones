import { useState } from "react";
import { useApp, ACTIONS } from "../context/AppContext";
import { v4 as uuidv4 } from "uuid";
import {
  calcularTotales,
  calcularSubtotalItem,
  formatCurrency,
  generarNumeroCotizacion,
  formatDate,
  ESTATUS_CONFIG,
} from "../utils/calculos";
import { generarPDF } from "../utils/pdf";

const HOY = () => new Date().toISOString().split("T")[0];
const EN_30 = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
};

const EMPTY_COT = {
  clienteId: "",
  fecha: HOY(),
  vigencia: EN_30(),
  estatus: "borrador",
  iva: 16,
  descuentoGlobal: 0,
  items: [],
  notas: "",
};

const EMPTY_ITEM = { tipo: "producto", refId: "", nombre: "", descripcion: "", cantidad: 1, precio: "", unidad: "pza", descuento: 0 };

export default function Cotizaciones() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(EMPTY_COT);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("info"); // info | items

  const filtered = state.cotizaciones.filter((c) => {
    const cliente = state.clientes.find((cl) => cl.id === c.clienteId);
    return (
      c.numero?.toLowerCase().includes(search.toLowerCase()) ||
      cliente?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      c.estatus?.toLowerCase().includes(search.toLowerCase())
    );
  });

  function openCreate() {
    setForm({ ...EMPTY_COT, fecha: HOY(), vigencia: EN_30(), numero: generarNumeroCotizacion(state.cotizaciones) });
    setErrors({});
    setActiveTab("info");
    setModal({ mode: "create" });
  }

  function openEdit(cot) {
    setForm({ ...cot });
    setErrors({});
    setActiveTab("info");
    setModal({ mode: "edit" });
  }

  function closeModal() {
    setModal(null);
    setItemForm(EMPTY_ITEM);
  }

  function calcularYGuardar(items, descuentoGlobal, iva) {
    const totales = calcularTotales(items, descuentoGlobal, iva);
    return { ...totales, items };
  }

  function handleSave() {
    if (!form.clienteId) return setErrors({ clienteId: "Selecciona un cliente" });
    const extras = calcularYGuardar(form.items, form.descuentoGlobal, form.iva);
    const payload = { ...form, ...extras };
    if (modal.mode === "create") {
      dispatch({ type: ACTIONS.ADD_COTIZACION, payload: { ...payload, id: uuidv4(), createdAt: new Date().toISOString() } });
    } else {
      dispatch({ type: ACTIONS.UPDATE_COTIZACION, payload });
    }
    closeModal();
  }

  function addItem() {
    if (!itemForm.nombre.trim()) return;
    const newItem = { ...itemForm, id: uuidv4() };
    const newItems = [...(form.items || []), newItem];
    setForm((f) => ({ ...f, items: newItems }));
    setItemForm(EMPTY_ITEM);
  }

  function removeItem(id) {
    setForm((f) => ({ ...f, items: f.items.filter((i) => i.id !== id) }));
  }

  function handleItemRef(tipo, refId) {
    const catalog = tipo === "producto" ? state.productos : state.servicios;
    const ref = catalog.find((p) => p.id === refId);
    if (ref) {
      setItemForm((f) => ({
        ...f, tipo, refId,
        nombre: ref.nombre,
        descripcion: ref.descripcion || "",
        precio: ref.precio,
        unidad: ref.unidad || (tipo === "servicio" && ref.tipo === "hora" ? "hr" : "pza"),
      }));
    } else {
      setItemForm((f) => ({ ...f, tipo, refId }));
    }
  }

  function handlePDF(cot) {
    const cliente = state.clientes.find((c) => c.id === cot.clienteId);
    generarPDF(cot, cliente, state.empresa);
  }

  function cambiarEstatus(cot, estatus) {
    const extras = calcularYGuardar(cot.items, cot.descuentoGlobal, cot.iva);
    dispatch({ type: ACTIONS.UPDATE_COTIZACION, payload: { ...cot, ...extras, estatus } });
  }

  const totalesForm = calcularTotales(form.items || [], form.descuentoGlobal, form.iva);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header__title">Cotizaciones</div>
          <div className="page-header__sub">{state.cotizaciones.length} cotizaciones registradas</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn--primary" onClick={openCreate}>+ Nueva Cotización</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📄</div>
          <div className="empty-state__title">{search ? "Sin resultados" : "No hay cotizaciones aún"}</div>
          <div className="empty-state__sub">{search ? "Intenta con otro término" : "Crea tu primera cotización"}</div>
          {!search && <button className="btn btn--primary" onClick={openCreate} style={{ marginTop: 12 }}>+ Nueva Cotización</button>}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Número</th><th>Cliente</th><th>Fecha</th><th>Vigencia</th><th>Ítems</th><th>Total</th><th>Estatus</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.map((cot) => {
                const cliente = state.clientes.find((c) => c.id === cot.clienteId);
                const cfg = ESTATUS_CONFIG[cot.estatus] || ESTATUS_CONFIG.borrador;
                return (
                  <tr key={cot.id}>
                    <td style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>{cot.numero}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{cliente?.nombre || "—"}</div>
                      {cliente?.empresa && <div style={{ fontSize: 11, color: "var(--text3)" }}>{cliente.empresa}</div>}
                    </td>
                    <td style={{ color: "var(--text3)", fontSize: 12 }}>{formatDate(cot.fecha)}</td>
                    <td style={{ color: "var(--text3)", fontSize: 12 }}>{formatDate(cot.vigencia)}</td>
                    <td style={{ color: "var(--text3)" }}>{cot.items?.length || 0}</td>
                    <td style={{ fontFamily: "DM Mono, monospace", color: "var(--accent)", fontWeight: 600 }}>{formatCurrency(cot.total)}</td>
                    <td>
                      <select
                        value={cot.estatus || "borrador"}
                        onChange={(e) => cambiarEstatus(cot, e.target.value)}
                        style={{
                          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33`,
                          borderRadius: 999, padding: "3px 8px", fontSize: 11, fontWeight: 600,
                          cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                        }}
                      >
                        {Object.entries(ESTATUS_CONFIG).map(([k, v]) => (
                          <option key={k} value={k} style={{ background: "var(--bg2)", color: "var(--text)" }}>{v.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn--ghost btn--sm" title="Editar" onClick={() => openEdit(cot)}>✏️</button>
                        <button className="btn btn--ghost btn--sm" title="Descargar PDF" onClick={() => handlePDF(cot)}>📥 PDF</button>
                        <button className="btn btn--danger btn--sm" title="Eliminar" onClick={() => setDeleteConfirm(cot)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal modal--xl">
            <div className="modal__header">
              <h2 className="modal__title">{modal.mode === "create" ? "Nueva Cotización" : `Editar ${form.numero}`}</h2>
              <button className="btn btn--ghost btn--sm" onClick={closeModal}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 24px" }}>
              {[{ id: "info", label: "📋 Información" }, { id: "items", label: `📦 Ítems (${form.items?.length || 0})` }].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "10px 16px", background: "none", border: "none", cursor: "pointer",
                    color: activeTab === tab.id ? "var(--accent)" : "var(--text3)",
                    borderBottom: activeTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
                    fontFamily: "DM Sans, sans-serif", fontSize: 13, marginBottom: -1,
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="modal__body">
              {activeTab === "info" && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Número</label>
                      <input value={form.numero || ""} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Estatus</label>
                      <select value={form.estatus} onChange={(e) => setForm({ ...form, estatus: e.target.value })}>
                        {Object.entries(ESTATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Cliente *</label>
                    <select value={form.clienteId} onChange={(e) => { setForm({ ...form, clienteId: e.target.value }); setErrors({}); }}
                      style={errors.clienteId ? { borderColor: "var(--danger)" } : {}}>
                      <option value="">— Seleccionar cliente —</option>
                      {state.clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` (${c.empresa})` : ""}</option>)}
                    </select>
                    {errors.clienteId && <span style={{ color: "var(--danger)", fontSize: 11 }}>{errors.clienteId}</span>}
                  </div>
                  <div className="form-row form-row--3">
                    <div className="form-group">
                      <label>Fecha de emisión</label>
                      <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Válida hasta</label>
                      <input type="date" value={form.vigencia} onChange={(e) => setForm({ ...form, vigencia: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>IVA (%)</label>
                      <input type="number" min="0" max="100" value={form.iva} onChange={(e) => setForm({ ...form, iva: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Descuento global (%)</label>
                      <input type="number" min="0" max="100" value={form.descuentoGlobal}
                        onChange={(e) => setForm({ ...form, descuentoGlobal: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div />
                  </div>
                  <div className="form-group">
                    <label>Notas / Condiciones</label>
                    <textarea placeholder="Condiciones de pago, notas especiales..." value={form.notas || ""}
                      onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={3} />
                  </div>
                </>
              )}

              {activeTab === "items" && (
                <>
                  {/* Agregar ítem */}
                  <div className="card" style={{ marginBottom: 16, background: "var(--bg3)" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Agregar ítem
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Tipo</label>
                        <select value={itemForm.tipo}
                          onChange={(e) => setItemForm({ ...EMPTY_ITEM, tipo: e.target.value })}>
                          <option value="producto">Producto</option>
                          <option value="servicio">Servicio</option>
                          <option value="manual">Manual</option>
                        </select>
                      </div>
                      {itemForm.tipo !== "manual" && (
                        <div className="form-group">
                          <label>Seleccionar del catálogo</label>
                          <select value={itemForm.refId}
                            onChange={(e) => handleItemRef(itemForm.tipo, e.target.value)}>
                            <option value="">— Seleccionar —</option>
                            {(itemForm.tipo === "producto" ? state.productos : state.servicios).map((p) => (
                              <option key={p.id} value={p.id}>{p.nombre} — {formatCurrency(p.precio)}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="form-row">
                      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Nombre del concepto *</label>
                        <input placeholder="Nombre del producto o servicio" value={itemForm.nombre}
                          onChange={(e) => setItemForm({ ...itemForm, nombre: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Descripción</label>
                      <input placeholder="Descripción adicional..." value={itemForm.descripcion || ""}
                        onChange={(e) => setItemForm({ ...itemForm, descripcion: e.target.value })} />
                    </div>
                    <div className="form-row form-row--3">
                      <div className="form-group">
                        <label>Cantidad</label>
                        <input type="number" min="0.01" step="0.01" value={itemForm.cantidad}
                          onChange={(e) => setItemForm({ ...itemForm, cantidad: parseFloat(e.target.value) || 1 })} />
                      </div>
                      <div className="form-group">
                        <label>Precio unitario</label>
                        <input type="number" min="0" step="0.01" placeholder="0.00" value={itemForm.precio || ""}
                          onChange={(e) => setItemForm({ ...itemForm, precio: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Descuento ítem (%)</label>
                        <input type="number" min="0" max="100" value={itemForm.descuento || 0}
                          onChange={(e) => setItemForm({ ...itemForm, descuento: parseFloat(e.target.value) || 0 })} />
                      </div>
                    </div>
                    <button className="btn btn--primary btn--sm" onClick={addItem} disabled={!itemForm.nombre.trim()}>
                      + Agregar ítem
                    </button>
                  </div>

                  {/* Lista de ítems */}
                  {form.items?.length > 0 ? (
                    <>
                      <div className="table-container" style={{ marginBottom: 16 }}>
                        <table>
                          <thead>
                            <tr><th>#</th><th>Concepto</th><th>Cant.</th><th>P. Unit.</th><th>Dto.</th><th>Subtotal</th><th></th></tr>
                          </thead>
                          <tbody>
                            {form.items.map((item, i) => (
                              <tr key={item.id}>
                                <td style={{ color: "var(--text3)", fontSize: 12 }}>{i + 1}</td>
                                <td>
                                  <div style={{ fontWeight: 500 }}>{item.nombre}</div>
                                  {item.descripcion && <div style={{ fontSize: 11, color: "var(--text3)" }}>{item.descripcion}</div>}
                                </td>
                                <td style={{ fontFamily: "DM Mono, monospace" }}>{item.cantidad} {item.unidad}</td>
                                <td style={{ fontFamily: "DM Mono, monospace" }}>{formatCurrency(item.precio)}</td>
                                <td style={{ color: "var(--text3)" }}>{item.descuento ? `${item.descuento}%` : "—"}</td>
                                <td style={{ fontFamily: "DM Mono, monospace", color: "var(--accent)", fontWeight: 600 }}>
                                  {formatCurrency(calcularSubtotalItem(item))}
                                </td>
                                <td><button className="btn btn--ghost btn--sm" onClick={() => removeItem(item.id)}>✕</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Totales */}
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px 20px", minWidth: 240 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 32, marginBottom: 6, fontSize: 13, color: "var(--text3)" }}>
                            <span>Subtotal</span>
                            <span style={{ fontFamily: "DM Mono, monospace" }}>{formatCurrency(totalesForm.subtotal)}</span>
                          </div>
                          {form.descuentoGlobal > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 32, marginBottom: 6, fontSize: 13, color: "var(--warning)" }}>
                              <span>Descuento ({form.descuentoGlobal}%)</span>
                              <span style={{ fontFamily: "DM Mono, monospace" }}>- {formatCurrency(totalesForm.descuentoMonto)}</span>
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 32, marginBottom: 10, fontSize: 13, color: "var(--text3)" }}>
                            <span>IVA ({form.iva}%)</span>
                            <span style={{ fontFamily: "DM Mono, monospace" }}>{formatCurrency(totalesForm.ivaMonto)}</span>
                          </div>
                          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "space-between", gap: 32 }}>
                            <span style={{ fontWeight: 700, color: "var(--text)" }}>TOTAL</span>
                            <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 16, color: "var(--accent)" }}>{formatCurrency(totalesForm.total)}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="empty-state" style={{ paddingTop: 30, paddingBottom: 30 }}>
                      <div className="empty-state__icon" style={{ fontSize: 32 }}>📦</div>
                      <div className="empty-state__sub">Agrega ítems usando el formulario de arriba</div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={closeModal}>Cancelar</button>
              {activeTab === "info" && (
                <button className="btn btn--secondary" onClick={() => setActiveTab("items")}>
                  Siguiente: Ítems →
                </button>
              )}
              <button className="btn btn--primary" onClick={handleSave}>
                {modal.mode === "create" ? "Crear Cotización" : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal__header"><h2 className="modal__title">¿Eliminar cotización?</h2></div>
            <div className="modal__body">
              <p style={{ color: "var(--text2)" }}>
                Eliminarás <strong style={{ color: "var(--text)" }}>{deleteConfirm.numero}</strong>. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn btn--danger" onClick={() => { dispatch({ type: ACTIONS.DELETE_COTIZACION, payload: deleteConfirm.id }); setDeleteConfirm(null); }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}