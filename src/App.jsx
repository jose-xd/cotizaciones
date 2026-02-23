import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Productos from "./pages/Productos";
import Servicios from "./pages/Servicios";
import Cotizaciones from "./pages/Cotizaciones";
import Estadisticas from "./pages/Estadisticas";
import "./index.css";

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/cotizaciones" element={<Cotizaciones />} />
            <Route path="/estadisticas" element={<Estadisticas />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}