# 📄 Sistema de Cotizaciones

App web para gestión de cotizaciones, clientes, productos y servicios.

## 🧩 Módulos completados

- [x] Setup inicial (Vite + React)
- [x] AppContext con useReducer (estado global)
- [x] Persistencia en localStorage (auto-guardado)
- [x] React Router con 6 rutas
- [x] Layout con sidebar colapsable
- [x] Dashboard con estadísticas resumen
- [x] Utilidades de cálculo (subtotales, IVA, descuentos)
- [x] Módulo Clientes — CRUD completo con búsqueda y modal
- [x] Módulo Productos — CRUD con SKU, unidades, stock
- [x] Módulo Servicios — CRUD con tipo fijo/hora
- [x] Módulo Cotizaciones — Formulario completo, ítems de catálogo o manuales, cálculo automático, cambio de estatus
- [x] Generación de PDFs — jsPDF con diseño profesional (logo, header, tabla, totales, footer)
- [x] Estadísticas — KPIs, barras por mes, línea de monto, pie de estatus, top clientes y conceptos

## 🔑 Acciones disponibles en AppContext

```js
import { useApp, ACTIONS } from "./context/AppContext";

const { state, dispatch } = useApp();

// Agregar cliente
dispatch({ type: ACTIONS.ADD_CLIENTE, payload: { id, nombre, rfc, ... } });

// Actualizar producto
dispatch({ type: ACTIONS.UPDATE_PRODUCTO, payload: { id, nombre, precio, ... } });

// Eliminar cotización
dispatch({ type: ACTIONS.DELETE_COTIZACION, payload: cotizacionId });
```