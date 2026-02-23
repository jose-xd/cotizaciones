import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate, calcularSubtotalItem } from "./calculos";

export function generarPDF(cotizacion, cliente, empresa) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const MARGIN = 15;
  const PAGE_W = 210;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const ACCENT = [200, 240, 74]; // #c8f04a
  const DARK = [15, 15, 18];
  const GRAY = [100, 100, 120];
  const LIGHT_GRAY = [240, 240, 245];

  // ─── Fondo del header ────────────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, PAGE_W, 45, "F");

  // ─── Nombre empresa ──────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(empresa.nombre || "Mi Empresa", MARGIN, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...ACCENT);
  doc.text("SISTEMA DE COTIZACIONES", MARGIN, 24);

  // ─── Número cotización (derecha) ─────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text(cotizacion.numero || "COT-0001", PAGE_W - MARGIN, 16, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 200);
  doc.text(`Fecha: ${formatDate(cotizacion.fecha)}`, PAGE_W - MARGIN, 22, { align: "right" });
  doc.text(`Válida hasta: ${formatDate(cotizacion.vigencia)}`, PAGE_W - MARGIN, 28, { align: "right" });

  const statusColors = {
    borrador: [148, 163, 184],
    enviada: [59, 130, 246],
    aprobada: [34, 197, 94],
    rechazada: [239, 68, 68],
    vencida: [249, 115, 22],
  };
  const sc = statusColors[cotizacion.estatus] || GRAY;
  doc.setFillColor(...sc);
  doc.roundedRect(PAGE_W - MARGIN - 28, 32, 28, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(
    (cotizacion.estatus || "borrador").toUpperCase(),
    PAGE_W - MARGIN - 14, 37.5, { align: "center" }
  );

  // ─── Datos empresa + cliente ─────────────────────────────────────────────
  let y = 55;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY);
  doc.text("DE:", MARGIN, y);
  doc.text("PARA:", PAGE_W / 2 + 5, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(empresa.nombre || "—", MARGIN, y);
  doc.text(cliente?.nombre || "—", PAGE_W / 2 + 5, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  const empLines = [empresa.rfc, empresa.direccion, empresa.telefono, empresa.email].filter(Boolean);
  const cliLines = [cliente?.empresa, cliente?.rfc, cliente?.direccion, cliente?.email, cliente?.telefono].filter(Boolean);

  empLines.forEach((line, i) => doc.text(line, MARGIN, y + 5 + i * 4.5));
  cliLines.forEach((line, i) => doc.text(line, PAGE_W / 2 + 5, y + 5 + i * 4.5));

  const blockH = Math.max(empLines.length, cliLines.length) * 4.5 + 8;

  // ─── Separador ───────────────────────────────────────────────────────────
  y += blockH + 6;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);

  // ─── Tabla de ítems ──────────────────────────────────────────────────────
  y += 5;
  const rows = (cotizacion.items || []).map((item, idx) => [
    idx + 1,
    item.nombre || "—",
    item.descripcion || "",
    item.cantidad,
    item.unidad || "pza",
    formatCurrency(item.precio),
    item.descuento ? `${item.descuento}%` : "—",
    formatCurrency(calcularSubtotalItem(item)),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["#", "Concepto", "Descripción", "Cant.", "Unidad", "P. Unit.", "Dto.", "Subtotal"]],
    body: rows,
    margin: { left: MARGIN, right: MARGIN },
    styles: {
      font: "helvetica", fontSize: 8, cellPadding: 3,
      textColor: [...DARK], lineColor: [220, 220, 230], lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [...DARK], textColor: [...ACCENT],
      fontStyle: "bold", fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: [...LIGHT_GRAY] },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 38, fontStyle: "bold" },
      2: { cellWidth: 45 },
      3: { cellWidth: 12, halign: "center" },
      4: { cellWidth: 14, halign: "center" },
      5: { cellWidth: 22, halign: "right" },
      6: { cellWidth: 12, halign: "center" },
      7: { cellWidth: 24, halign: "right", fontStyle: "bold" },
    },
  });

  // ─── Totales ─────────────────────────────────────────────────────────────
  const finalY = doc.lastAutoTable.finalY + 6;
  const totX = PAGE_W - MARGIN - 65;

  const totales = [
    ["Subtotal:", formatCurrency(cotizacion.subtotal)],
    cotizacion.descuentoGlobal > 0
      ? [`Descuento (${cotizacion.descuentoGlobal}%):`, `- ${formatCurrency(cotizacion.descuentoMonto)}`]
      : null,
    [`IVA (${cotizacion.iva || 16}%):`, formatCurrency(cotizacion.ivaMonto)],
    ["TOTAL:", formatCurrency(cotizacion.total)],
  ].filter(Boolean);

  totales.forEach(([label, value], i) => {
    const rowY = finalY + i * 7;
    const isTotal = label === "TOTAL:";
    if (isTotal) {
      doc.setFillColor(...DARK);
      doc.rect(totX - 2, rowY - 4.5, 67, 8, "F");
    }
    doc.setFont("helvetica", isTotal ? "bold" : "normal");
    doc.setFontSize(isTotal ? 10 : 8.5);
    const labelColor = isTotal ? ACCENT : GRAY;
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    doc.text(label, totX + 30, rowY, { align: "right" });
    const valueColor = isTotal ? ACCENT : DARK;
    doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
    doc.text(value, totX + 64, rowY, { align: "right" });
  });

  // ─── Notas ───────────────────────────────────────────────────────────────
  const notasY = finalY + totales.length * 7 + 10;
  if (cotizacion.notas) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GRAY);
    doc.text("NOTAS:", MARGIN, notasY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(cotizacion.notas, CONTENT_W);
    doc.text(lines, MARGIN, notasY + 5);
  }

  // ─── Footer ───────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(...DARK);
  doc.rect(0, pageH - 12, PAGE_W, 12, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 120);
  doc.text(
    `${empresa.nombre} | ${empresa.email || ""} | ${empresa.telefono || ""}`,
    PAGE_W / 2, pageH - 4.5, { align: "center" }
  );

  doc.save(`${cotizacion.numero || "cotizacion"}.pdf`);
}