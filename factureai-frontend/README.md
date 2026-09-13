# FactureAI - Frontend

**Autor:** Moises David Florez Olivero
**Evidencia:** GA8-220501096-AA1-EV02 (Módulos integrados)

## Qué es esto

Frontend en React (JavaScript plano, sin TypeScript) para FactureAI, construido
sobre Vite. Se conecta al backend de Express (ver `functions/` para el
emulador local, o `render-backend/` para producción en Render.com). La base
de datos, en ambos casos, es la misma: Firestore.

## Alcance real de esta evidencia

| Módulo | Estado |
|---|---|
| Login / Registro | **Real**, conectado al backend (`/login`, `/register`) |
| Configuración → Perfil | **Real**, conectado al backend (`/perfil/:correo`) |
| Panel de Control, Facturas, Proyectos, Informes | Pantalla "En construcción" (backend no conectado todavía) |
| Configuración → Seguridad / Preferencias / Personalización / Actividad | Pantalla "En construcción" |

Esto es intencional: el objetivo de esta evidencia es demostrar la
integración real del módulo de Autenticación, no simular funcionalidad que
todavía no existe en el backend.

## Instalación

```bash
npm install
```

## Configurar la URL del backend

Copia `.env.example` a `.env` y define `VITE_API_BASE_URL`:

- Para el emulador local: `http://127.0.0.1:5001/practicefactureia/us-central1/api`
- Para producción: la URL que te da Render.com al desplegar `render-backend/` (ver su README)

Si no defines nada, el proyecto usa la URL del emulador local por defecto.

## Ejecutar en desarrollo

```bash
npm run dev
```

## Generar la versión de producción (para Vercel)

```bash
npm run build
```

## Estructura

```
src/
├── api.js                     # Llamadas HTTP al backend
├── App.jsx                    # Rutas de la aplicación
├── main.jsx                   # Punto de entrada
├── styles.css                 # Estilos globales (paleta, tipografía, componentes)
├── auth/
│   └── AuthContext.jsx        # Sesión del usuario (login/registro/logout)
├── components/
│   ├── AuthLayout.jsx         # Layout compartido de Login/Registro
│   ├── ComingSoon.jsx         # Placeholder reutilizable "En construcción"
│   ├── ProtectedRoute.jsx     # Redirige a /login si no hay sesión
│   └── Sidebar.jsx            # Menú lateral del dashboard
└── pages/
    ├── Login.jsx
    ├── Register.jsx
    ├── DashboardLayout.jsx
    └── configuracion/
        ├── Configuracion.jsx  # Shell con las 5 sub-pestañas
        └── Perfil.jsx         # Única sub-pestaña real
```

## Nota sobre la sesión de usuario

Este MVP no maneja tokens (JWT) todavía: el backend solo confirma
correo/contraseña. El frontend guarda los datos básicos del usuario en
`localStorage` (si se marca "Recordar mi sesión") o `sessionStorage` (si no),
como una simplificación consciente para el alcance de esta evidencia.
