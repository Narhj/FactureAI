// ==========================================================
// FactureAI - Cliente HTTP hacia el backend (Render.com / emulador)
// ----------------------------------------------------------
// La URL base se toma de una variable de entorno de Vite para
// poder apuntar al emulador local en desarrollo y al backend
// desplegado en Render en produccion, sin tocar el codigo.
//
// Ver ".env.example" para configurarla.
//
// NOTA sobre los reintentos: en el plan gratuito de Render, el
// servicio "duerme" tras 15 minutos sin trafico. La primera
// peticion que lo despierta con frecuencia se pierde (Render
// tarda unos segundos en enrutar hacia la instancia nueva), aunque
// el servidor SI termina de levantar bien un instante despues. Por
// eso, si la conexion falla a nivel de red (no es un error de la
// aplicacion, como contrasena incorrecta), se reintenta unas pocas
// veces con espera creciente antes de darlo por fallido.
// ==========================================================

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5001/practicefactureia/us-central1/api";

const ESPERAS_REINTENTO_MS = [3000, 5000, 8000, 12000, 18000, 25000];

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options = {}, intento = 0) {
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (networkError) {
    // Fallo de red real (no una respuesta de la aplicacion). Puede ser
    // que Render este despertando el servicio: reintentamos antes de
    // rendirnos.
    if (intento < ESPERAS_REINTENTO_MS.length) {
      await esperar(ESPERAS_REINTENTO_MS[intento]);
      return request(path, options, intento + 1);
    }

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
