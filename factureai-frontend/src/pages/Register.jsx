import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, IdCard, Calendar, Mail, Lock, Eye, EyeOff, AlertCircle, Info } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { useWaitingMessages } from "../hooks/useWaitingMessages.js";

const HERO_ITEMS = [
  "Procesamiento automático de facturas con IA",
  "Sincronización con Gmail y Outlook",
  "Reportes financieros en tiempo real",
  "Soporte técnico 24/7",
];

const VACIO = {
  nombres: "",
  apellidos: "",
  cedula: "",
  fechaNacimiento: "",
  correo: "",
  password: "",
};

export default function Register() {
  const { registrar } = useAuth();
  const navigate = useNavigate();

  const [datos, setDatos] = useState(VACIO);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const mensajeEspera = useWaitingMessages(enviando);

  function actualizarCampo(campo, valor) {
    setDatos((actual) => ({ ...actual, [campo]: valor }));
  }

  function validar() {
    if (!datos.nombres || !datos.apellidos || !datos.cedula || !datos.fechaNacimiento || !datos.correo) {
      return "Completa todos los campos.";
    }
    if (datos.password.length < 8) {
      return "La contraseña debe tener mínimo 8 caracteres.";
    }
    if (!aceptaTerminos) {
      return "Debes aceptar los Términos y Condiciones para continuar.";
    }
    return "";
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    const mensajeValidacion = validar();
    if (mensajeValidacion) {
      setError(mensajeValidacion);
      return;
    }

    setError("");
    setEnviando(true);
    try {
      await registrar({ ...datos, correo: datos.correo.trim().toLowerCase() });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "No fue posible crear la cuenta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout heroTitle="Únete a miles de empresas que confían en nosotros" heroItems={HERO_ITEMS}>
      <h2>Crear cuenta nueva</h2>
      <p>Completa tus datos personales para registrarte</p>

      {error && (
        <div className="form-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form onSubmit={manejarEnvio} noValidate>
        <div className="field-row">
          <div className="field">
            <label htmlFor="nombres">Nombres</label>
            <div className="input-wrap">
              <User size={16} />
              <input
                id="nombres"
                placeholder="Ej: Carlos Andrés"
                value={datos.nombres}
                onChange={(e) => actualizarCampo("nombres", e.target.value)}
                autoComplete="given-name"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="apellidos">Apellidos</label>
            <div className="input-wrap">
              <User size={16} />
              <input
                id="apellidos"
                placeholder="Ej: Gómez Ruiz"
                value={datos.apellidos}
                onChange={(e) => actualizarCampo("apellidos", e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="cedula">Número de cédula</label>
            <div className="input-wrap">
              <IdCard size={16} />
              <input
                id="cedula"
                inputMode="numeric"
                placeholder="Ej: 1234567890"
                value={datos.cedula}
                onChange={(e) => actualizarCampo("cedula", e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
            <div className="input-wrap">
              <Calendar size={16} />
              <input
                id="fechaNacimiento"
                type="date"
                value={datos.fechaNacimiento}
                onChange={(e) => actualizarCampo("fechaNacimiento", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="field">
          <label htmlFor="correo">Correo electrónico</label>
          <div className="input-wrap">
            <Mail size={16} />
            <input
              id="correo"
              type="email"
              placeholder="correo@empresa.com"
              value={datos.correo}
              onChange={(e) => actualizarCampo("correo", e.target.value)}
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
              placeholder="Mínimo 8 caracteres"
              value={datos.password}
              onChange={(e) => actualizarCampo("password", e.target.value)}
              autoComplete="new-password"
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

        <div className="form-hint">
          <Info size={16} style={{ flexShrink: 0 }} />
          <span>
            Tu cédula y fecha de nacimiento se guardan como datos de tu perfil. Este MVP no realiza una
            verificación de identidad automática todavía; asegúrate de ingresar datos reales.
          </span>
        </div>

        <div className="checkbox-row">
          <input
            id="terminos"
            type="checkbox"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
          />
          <label htmlFor="terminos">
            Acepto los <span className="terms-text">Términos y Condiciones</span> y la{" "}
            <span className="terms-text">Política de Privacidad</span> de FactureAI.
          </label>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
          {enviando ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        {mensajeEspera && <p className="waiting-message">{mensajeEspera}</p>}
      </form>

      <p className="auth-footer-text">
        ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
      </p>
    </AuthLayout>
  );
}
