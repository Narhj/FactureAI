import { createContext, useContext, useState, useCallback } from "react";
import { api } from "../api.js";

// Nota sobre el "login": este MVP no maneja tokens de sesion (JWT) todavia,
// el backend solo confirma usuario/contrasena. Por eso aqui simplemente
// guardamos los datos basicos del usuario que devuelve el login en
// localStorage (si marco "Recordar mi sesion") o sessionStorage (si no),
// y los leemos al recargar la pagina. Es una limitacion conocida del MVP,
// no un intento de simular seguridad que no existe.

const STORAGE_KEY = "factureai_user";
const AuthContext = createContext(null);

function leerUsuarioGuardado() {
  const desdeLocal = localStorage.getItem(STORAGE_KEY);
  const desdeSesion = sessionStorage.getItem(STORAGE_KEY);
  const crudo = desdeLocal || desdeSesion;
  if (!crudo) return null;
  try {
    return JSON.parse(crudo);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => leerUsuarioGuardado());

  const guardarSesion = useCallback((usuario, recordar) => {
    const valor = JSON.stringify(usuario);
    if (recordar) {
      localStorage.setItem(STORAGE_KEY, valor);
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, valor);
      localStorage.removeItem(STORAGE_KEY);
    }
    setUser(usuario);
  }, []);

  const login = useCallback(
    async (correo, password, recordar) => {
      const data = await api.iniciarSesion({ correo, password });
      const usuario = data.usuario || { correo };
      guardarSesion(usuario, recordar);
      return usuario;
    },
    [guardarSesion]
  );

  const registrar = useCallback(
    async (datos) => {
      await api.registrar(datos);
      // Iniciamos sesion automaticamente con las credenciales recien creadas,
      // para no pedirle a la persona que las vuelva a escribir.
      return login(datos.correo, datos.password, true);
    },
    [login]
  );

  const actualizarUsuarioLocal = useCallback(
    (cambios) => {
      setUser((actual) => {
        if (!actual) return actual;
        const actualizado = { ...actual, ...cambios };
        const enLocal = Boolean(localStorage.getItem(STORAGE_KEY));
        guardarSesion(actualizado, enLocal);
        return actualizado;
      });
    },
    [guardarSesion]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, registrar, logout, actualizarUsuarioLocal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  }
  return ctx;
}
