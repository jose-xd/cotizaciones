// ─── Cálculos de cotización ───────────────────────────────────────────────────

/**
 * Calcula el subtotal de un ítem (precio * cantidad con descuento por ítem)
 */
export function calcularSubtotalItem(item) {
  const precio = parseFloat(item.precio) || 0;
  const cantidad = parseFloat(item.cantidad) || 0;
  const descuento = parseFloat(item.descuento) || 0;
  const subtotal = precio * cantidad;
  return subtotal - (subtotal * descuento) / 100;
}

/**
 * Calcula los totales de una cotización completa
 */
export function calcularTotales(items = [], descuentoGlobal = 0, iva = 16) {
  const subtotal = items.reduce((acc, item) => acc + calcularSubtotalItem(item), 0);
  const descuentoMonto = (subtotal * (parseFloat(descuentoGlobal) || 0)) / 100;
  const subtotalConDescuento = subtotal - descuentoMonto;
  const ivaMonto = (subtotalConDescuento * (parseFloat(iva) || 0)) / 100;
  const total = subtotalConDescuento + ivaMonto;

  return {
    subtotal,
    descuentoMonto,
    subtotalConDescuento,
    ivaMonto,
    total,
  };
}

/**
 * Formatea un número como moneda MXN
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

/**
 * Genera el número de cotización con formato COT-YYYY-XXXX
 */
export function generarNumeroCotizacion(cotizaciones = []) {
  const year = new Date().getFullYear();
  const existing = cotizaciones.filter((c) =>
    c.numero?.startsWith(`COT-${year}`)
  );
  const next = (existing.length + 1).toString().padStart(4, "0");
  return `COT-${year}-${next}`;
}

/**
 * Formatea una fecha como dd/mm/yyyy
 */
export function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Retorna el color del estatus de una cotización
 */
export const ESTATUS_CONFIG = {
  borrador: { label: "Borrador", color: "#94a3b8", bg: "#f1f5f9" },
  enviada: { label: "Enviada", color: "#3b82f6", bg: "#eff6ff" },
  aprobada: { label: "Aprobada", color: "#22c55e", bg: "#f0fdf4" },
  rechazada: { label: "Rechazada", color: "#ef4444", bg: "#fef2f2" },
  vencida: { label: "Vencida", color: "#f97316", bg: "#fff7ed" },
};