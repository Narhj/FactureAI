import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  FolderKanban,
  BarChart3,
  ShieldCheck,
  SlidersHorizontal,
  Palette,
  History,
} from "lucide-react";

import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ComingSoon from "./components/ComingSoon.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import DashboardLayout from "./pages/DashboardLayout.jsx";
import Configuracion from "./pages/configuracion/Configuracion.jsx";
import Perfil from "./pages/configuracion/Perfil.jsx";

// Punto de entrada "/": si ya hay sesion vamos al dashboard, si no al login.
function Inicio() {
  const { user } = useAuth();
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <ComingSoon
                  icon={LayoutDashboard}
                  title="Panel de Control"
                  description="Aquí verás el resumen financiero de tus proyectos: gastos totales, ingresos, resumen fiscal y facturas pendientes, en cuanto conectemos los módulos de Facturas y Proyectos."
                />
              }
            />
            <Route
              path="facturas"
              element={
                <ComingSoon
                  icon={Receipt}
                  title="Facturas"
                  description="La recepción automática de facturas por WhatsApp y correo, y su procesamiento con IA, se conectarán a esta pantalla en una próxima entrega del proyecto."
                />
              }
            />
            <Route
              path="proyectos"
              element={
                <ComingSoon
                  icon={FolderKanban}
                  title="Proyectos"
                  description="La gestión de proyectos ya existe en el backend (crear, editar, consultar, eliminar); falta conectar esta pantalla para administrarlos desde aquí."
                />
              }
            />
            <Route
              path="informes"
              element={
                <ComingSoon
                  icon={BarChart3}
                  title="Informes"
                  description="Los reportes de gastos, ingresos, resumen fiscal y facturas pendientes se habilitarán cuando Facturas y Proyectos estén conectados a esta interfaz."
                />
              }
            />

            <Route path="configuracion" element={<Configuracion />}>
              <Route index element={<Perfil />} />
              <Route
                path="seguridad"
                element={
                  <ComingSoon
                    icon={ShieldCheck}
                    title="Seguridad"
                    description="Aquí vas a poder cambiar tu contraseña, activar la verificación en dos pasos y revisar tus sesiones activas."
                  />
                }
              />
              <Route
                path="preferencias"
                element={
                  <ComingSoon
                    icon={SlidersHorizontal}
                    title="Preferencias"
                    description="Aquí vas a poder configurar notificaciones por correo, el resumen semanal y otras preferencias del sistema."
                  />
                }
              />
              <Route
                path="personalizacion"
                element={
                  <ComingSoon
                    icon={Palette}
                    title="Personalización"
                    description="Aquí vas a poder elegir la paleta de colores y la tipografía con la que se ve tu cuenta."
                  />
                }
              />
              <Route
                path="actividad"
                element={
                  <ComingSoon
                    icon={History}
                    title="Actividad"
                    description="Aquí vas a ver el historial de acciones recientes de tu cuenta: inicios de sesión, facturas creadas y cambios de configuración."
                  />
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
