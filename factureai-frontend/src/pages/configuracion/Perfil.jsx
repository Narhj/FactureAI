import { useEffect, useState } from "react";
import { User, IdCard, Calendar, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../../api.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { useWaitingMessages } from "../../hooks/useWaitingMessages.js";

function iniciales(nombres, apellidos) {
  const n = (nombres || "").trim().charAt(0);
  const a = (apellidos || "").trim().charAt(0);
  return (n + a).toUpperCase() || "FA";
}

export default function Perfil() {
  const { user, actualizarUsuarioLocal } = useAuth();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [form, setForm] = useState({ nombres: "", apellidos: "", cedula: "", fechaNacimiento: "" });
  const mensajeEspera = useWaitingMessages(cargando || guardando);

  useEffect(() => {
    let activo = true;

    async function cargarPerfil() {
      setCargando(true);
      setError("");
      try {
        const data = await api.obtenerPerfil(user.correo);
        if (!activo) return;
        const perfil = data.perfil || {};
        setForm({
          nombres: perfil.nombres || "",
          apellidos: perfil.apellidos || "",
          cedula: perfil.cedula || "",
          fechaNacimiento: perfil.fechaNacimiento || "",
        });
      } catch (err) {
        if (activo) setError(err.message || "No se pudo cargar tu perfil.");
      } finally {
        if (activo) setCargando(false);
      }
    }

    if (user?.correo) cargarPerfil();

    return () => {
      activo = false;
    };
  }, [user?.correo]);

  function actualizarCampo(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  async function guardarCambios(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError("");
    setExito("");
    try {
      await api.actualizarPerfil(user.correo, form);
      actualizarUsuarioLocal({ nombres: form.nombres, apellidos: form.apellidos });
      setExito("Perfil actualizado correctamente.");
    } catch (err) {
      setError(err.message || "No se pudieron guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="settings-card">
      <div className="profile-header">
        <div className="avatar-lg">{iniciales(form.nombres, form.apellidos)}</div>
        <div>
          <h3>{form.nombres ? `${form.nombres} ${form.apellidos}` : "Tu perfil"}</h3>
          <p>{user?.correo}</p>
        </div>
      </div>

      {cargando ? (
        <div aria-live="polite">
          <div className="skeleton-line" style={{ width: "60%" }} />
          <div className="skeleton-line" style={{ width: "80%" }} />
          <div className="skeleton-line" style={{ width: "40%" }} />
        </div>
      ) : (
        <form onSubmit={guardarCambios} noValidate>
          {error && (
            <div className="form-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {exito && (
            <div className="form-success">
              <CheckCircle2 size={16} />
              {exito}
            </div>
          )}

          <div className="field-row">
            <div className="field">
              <label htmlFor="p-nombres">Nombres</label>
              <div className="input-wrap">
                <User size={16} />
                <input
                  id="p-nombres"
                  value={form.nombres}
                  onChange={(e) => actualizarCampo("nombres", e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="p-apellidos">Apellidos</label>
              <div className="input-wrap">
                <User size={16} />
                <input
                  id="p-apellidos"
                  value={form.apellidos}
                  onChange={(e) => actualizarCampo("apellidos", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="field">
            <label htmlFor="p-correo">Correo electrónico</label>
            <div className="input-wrap">
              <Mail size={16} />
              <input id="p-correo" value={user?.correo || ""} disabled readOnly />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="p-cedula">Número de cédula</label>
              <div className="input-wrap">
                <IdCard size={16} />
                <input
                  id="p-cedula"
                  inputMode="numeric"
                  value={form.cedula}
                  onChange={(e) => actualizarCampo("cedula", e.target.value.replace(/[^0-9]/g, ""))}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="p-fecha">Fecha de nacimiento</label>
              <div className="input-wrap">
                <Calendar size={16} />
                <input
                  id="p-fecha"
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(e) => actualizarCampo("fechaNacimiento", e.target.value)}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>

          {mensajeEspera && <p className="waiting-message">{mensajeEspera}</p>}
        </form>
      )}
    </div>
  );
}
