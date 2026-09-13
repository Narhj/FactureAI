// ==========================================================
// FactureAI - Cliente HTTP hacia el backend (Firebase Functions)
// ----------------------------------------------------------
// La URL base se toma de una variable de entorno de Vite para
// poder apuntar al emulador local en desarrollo y a la funcion
// desplegada en produccion (Vercel) sin tocar el codigo.
//
// Ver ".env.example" para configurarla.
// ==========================================================

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5001/practicefactureia/us-central1/api";

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (networkError) {
    // El backend no respondio (emulador apagado, sin internet, URL mal configurada, etc.)
    throw new Error(
      "No se pudo conectar con el servidor. Verifica tu conexion o que el backend este desplegado/corriendo."
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Respuesta sin cuerpo JSON valido; seguimos con data = null.
  }

  if (!response.ok) {
    const mensaje = data?.mensaje || "Ocurrio un error inesperado.";
    const error = new Error(mensaje);
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  registrar(datos) {
    return request("/register", {
      method: "POST",
      body: JSON.stringify(datos),
    });
  },

  iniciarSesion({ correo, password }) {
    return request("/login", {
      method: "POST",
      body: JSON.stringify({ correo, password }),
    });
  },

  obtenerPerfil(correo) {
    return request(`/perfil/${encodeURIComponent(correo)}`, {
      method: "GET",
    });
  },

  actualizarPerfil(correo, cambios) {
    return request(`/perfil/${encodeURIComponent(correo)}`, {
      method: "PUT",
      body: JSON.stringify(cambios),
    });
  },
};
