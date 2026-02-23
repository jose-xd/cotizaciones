import { createContext, useContext, useReducer, useEffect } from "react";

// ─── Estado inicial ───────────────────────────────────────────────────────────
const initialState = {
  clientes: [],
  productos: [],
  servicios: [],
  cotizaciones: [],
  empresa: {
    nombre: "Mi Empresa S.A.",
    rfc: "MEM000101AAA",
    direccion: "Calle Principal #100, Ciudad",
    telefono: "664-000-0000",
    email: "contacto@miempresa.com",
    logo: null,
  },
};

// ─── Tipos de acciones ────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export const ACTIONS = {
  // Clientes
  ADD_CLIENTE: "ADD_CLIENTE",
  UPDATE_CLIENTE: "UPDATE_CLIENTE",
  DELETE_CLIENTE: "DELETE_CLIENTE",
  // Productos
  ADD_PRODUCTO: "ADD_PRODUCTO",
  UPDATE_PRODUCTO: "UPDATE_PRODUCTO",
  DELETE_PRODUCTO: "DELETE_PRODUCTO",
  // Servicios
  ADD_SERVICIO: "ADD_SERVICIO",
  UPDATE_SERVICIO: "UPDATE_SERVICIO",
  DELETE_SERVICIO: "DELETE_SERVICIO",
  // Cotizaciones
  ADD_COTIZACION: "ADD_COTIZACION",
  UPDATE_COTIZACION: "UPDATE_COTIZACION",
  DELETE_COTIZACION: "DELETE_COTIZACION",
  // Empresa
  UPDATE_EMPRESA: "UPDATE_EMPRESA",
  // Carga inicial
  LOAD_STATE: "LOAD_STATE",
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function appReducer(state, action) {
  const { type, payload } = action;

  switch (type) {
    case ACTIONS.LOAD_STATE:
      return { ...state, ...payload };

    // CLIENTES
    case ACTIONS.ADD_CLIENTE:
      return { ...state, clientes: [...state.clientes, payload] };
    case ACTIONS.UPDATE_CLIENTE:
      return {
        ...state,
        clientes: state.clientes.map((c) => (c.id === payload.id ? payload : c)),
      };
    case ACTIONS.DELETE_CLIENTE:
      return { ...state, clientes: state.clientes.filter((c) => c.id !== payload) };

    // PRODUCTOS
    case ACTIONS.ADD_PRODUCTO:
      return { ...state, productos: [...state.productos, payload] };
    case ACTIONS.UPDATE_PRODUCTO:
      return {
        ...state,
        productos: state.productos.map((p) => (p.id === payload.id ? payload : p)),
      };
    case ACTIONS.DELETE_PRODUCTO:
      return { ...state, productos: state.productos.filter((p) => p.id !== payload) };

    // SERVICIOS
    case ACTIONS.ADD_SERVICIO:
      return { ...state, servicios: [...state.servicios, payload] };
    case ACTIONS.UPDATE_SERVICIO:
      return {
        ...state,
        servicios: state.servicios.map((s) => (s.id === payload.id ? payload : s)),
      };
    case ACTIONS.DELETE_SERVICIO:
      return { ...state, servicios: state.servicios.filter((s) => s.id !== payload) };

    // COTIZACIONES
    case ACTIONS.ADD_COTIZACION:
      return { ...state, cotizaciones: [...state.cotizaciones, payload] };
    case ACTIONS.UPDATE_COTIZACION:
      return {
        ...state,
        cotizaciones: state.cotizaciones.map((c) =>
          c.id === payload.id ? payload : c
        ),
      };
    case ACTIONS.DELETE_COTIZACION:
      return {
        ...state,
        cotizaciones: state.cotizaciones.filter((c) => c.id !== payload),
      };

    // EMPRESA
    case ACTIONS.UPDATE_EMPRESA:
      return { ...state, empresa: { ...state.empresa, ...payload } };

    default:
      return state;
  }
}

// ─── Contexto ─────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Cargar datos de localStorage al iniciar
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cotizaciones_app_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: ACTIONS.LOAD_STATE, payload: parsed });
      }
    } catch (e) {
      console.error("Error cargando datos guardados:", e);
    }
  }, []);

  // Guardar en localStorage cada vez que cambia el estado
  useEffect(() => {
    try {
      localStorage.setItem("cotizaciones_app_data", JSON.stringify(state));
    } catch (e) {
      console.error("Error guardando datos:", e);
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook personalizado ───────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp debe usarse dentro de AppProvider");
  }
  return context;
}

export default AppContext;