import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { useWaitingMessages } from "../hooks/useWaitingMessages.js";

const CUENTA_DEMO = {
  correo: "carlos.gomez@facturasai.com",
  password: "Demo1234",
};

const HERO_ITEMS = [
  "Procesamiento automático de facturas con IA",
  "Sincronización con Gmail y Outlook",
  "Reportes financieros en tiempo real",
  "Soporte técnico 24/7",
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(true);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const mensajeEspera = useWaitingMessages(enviando);

  const mensajeExito = location.state?.mensaje || "";

  function usarCuentaDemo() {
    setCorreo(CUENTA_DEMO.correo);
    setPassword(CUENTA_DEMO.password);
    setError("");
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError("");

    if (!correo || !password) {
      setError("Ingresa tu correo y tu contraseña.");
      return;
    }

    setEnviando(true);
    try {
      await login(correo.trim().toLowerCase(), password, recordar);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "No fue posible iniciar sesión.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout heroTitle="Gestiona tus facturas de forma inteligente" heroItems={HERO_ITEMS}>
      <h2>Bienvenido de nuevo</h2>
      <p>Ingresa tus credenciales para acceder a tu cuenta</p>

      <div className="auth-demo-card">
        <span className="icon">
          <Sparkles size={17} />
        </span>
        <div className="details">
          <strong>Cuenta de ejemplo disponible</strong>
          Correo: {CUENTA_DEMO.correo} · Contraseña: {CUENTA_DEMO.password}
        </div>
        <button type="button" className="btn btn-secondary" onClick={usarCuentaDemo}>
          Usar cuenta
        </button>
      </div>

      {mensajeExito && <div className="form-success">{mensajeExito}</div>}

      {error && (
        <div className="form-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form onSubmit={manejarEnvio} noValidate>
        <div className="field">
          <label htmlFor="correo">Correo electrónico</label>
          <div className="input-wrap">
            <Mail size={16} />
            <input
              id="correo"
              type="email"
              placeholder="correo@empresa.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <div className="input-wrap">
            <Lock size={16} />
            <input
              id="password"
              type={mostrarPassword ? "text" : "password"}
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => setMostrarPassword((v) => !v)}
              aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="checkbox-row">
          <input
            id="recordar"
            type="checkbox"
            checked={recordar}
            onChange={(e) => setRecordar(e.target.checked)}
          />
          <label htmlFor="recordar">Recordar mi sesión en este dispositivo</label>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
          {enviando ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>

        {mensajeEspera && <p className="waiting-message">{mensajeEspera}</p>}
      </form>

      <div className="auth-divider">o continúa con</div>

      <div className="auth-oauth-row">
        <span className="btn-ghost-disabled" style={{ position: "relative" }} title="Próximamente">
          Google
          <span className="badge-soon">Pronto</span>
        </span>
        <span className="btn-ghost-disabled" style={{ position: "relative" }} title="Próximamente">
          Microsoft
          <span className="badge-soon">Pronto</span>
        </span>
      </div>

      <p className="auth-footer-text">
        ¿No tienes cuenta? <Link to="/register">Crear cuenta nueva</Link>
      </p>
    </AuthLayout>
  );
}
