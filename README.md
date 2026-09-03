# FactureAI - Backend de Servicios Web

**Autor:** Moises David Florez Olivero
**Programa:** Tecnologo en Analisis y Desarrollo de Software - SENA (ficha 3235900)

## Que es esto

Este repositorio contiene el backend de FactureAI, construido sobre
**Firebase Cloud Functions + Express**, conectado a **Firestore**.
No es el repositorio de una evidencia puntual: es el repositorio del
proyecto, que se ha ido ampliando evidencia tras evidencia siguiendo
el mismo criterio de honestidad y alcance realista definido desde el
informe tecnico inicial (GA7-220501096-AA1-EV01).

## Trazabilidad de evidencias

| Evidencia | Aporte |
|-----------|--------|
| GA7-220501096-AA5-EV01 | Servicios de registro (`/register`) e inicio de sesion (`/login`). |
| GA7-220501096-AA5-EV02 | Pruebas de esos dos servicios con Postman. |
| GA7-220501096-AA5-EV03 | Servicios de **Proyectos** (CRUD completo) y **Facturas** (consulta + ingreso manual), representando caracteristicas reales del proyecto. |

## Por que esta arquitectura

- **Node.js + Express**: tecnologia sugerida por el material formativo
  "Construccion de API".
- **Firestore**: es la base de datos ya definida para FactureAI desde
  la fase de analisis, no se agrega tecnologia nueva.
- **Cloud Functions**: no requiere contratar ni mantener un servidor
  aparte, y se despliega sobre el mismo proyecto de Firebase que
  usara el resto del sistema.
- **n8n** (parte del stack MVP) no se toca: sigue encargandose de la
  automatizacion de recepcion de facturas por WhatsApp. Este backend
  cubre un ambito distinto: los servicios propios del panel web
  (autenticacion, gestion de proyectos, consulta e ingreso manual de
  facturas).

## Seguridad implementada

- Las contrasenas **nunca** se guardan en texto plano: se guardan con
  hash usando `bcryptjs` (10 rondas de sal).
- El login no distingue en su respuesta si fallo el usuario o la
  contrasena, para no dar pistas a quien intente adivinar usuarios
  validos.

## Estructura del proyecto

```
factureai-backend/
├── firebase.json
├── postman_collection.json
├── README.md
└── functions/
    ├── index.js           # Registro/Login + Proyectos + Facturas
    ├── package.json
    └── .gitignore
```

## Como probarlo localmente (emulador, sin necesidad de desplegar)

Requisitos: tener Node.js 18+ y una cuenta de Firebase (gratis).

```bash
npm install -g firebase-tools
firebase login
firebase use --add
cd functions
npm install
cd ..
firebase emulators:start --only functions,firestore
```

El emulador mostrara una URL parecida a:
`http://127.0.0.1:5001/TU-PROYECTO/us-central1/api`

## Como probar con Postman

1. Importa `postman_collection.json` en Postman.
2. Ajusta la variable `base_url` con la URL que te dio el emulador.
3. Ejecuta las carpetas en orden: **01 - Autenticacion**, **02 - Proyectos**,
   **03 - Facturas**. Las variables `proyecto_id` y `factura_id` se
   capturan automaticamente al crear los recursos, asi que no hay que
   copiar ids a mano.

## Endpoints

### Autenticacion

| Metodo | Ruta        | Body                                      | Respuesta exitosa                          |
|--------|-------------|--------------------------------------------|---------------------------------------------|
| POST   | `/register` | `{ "usuario": "...", "password": "..." }`  | `201` - "Usuario registrado correctamente." |
| POST   | `/login`    | `{ "usuario": "...", "password": "..." }`  | `200` - "Autenticacion satisfactoria."      |

### Proyectos

| Metodo | Ruta              | Body                                              | Respuesta exitosa                             |
|--------|-------------------|-----------------------------------------------------|-------------------------------------------------|
| POST   | `/proyectos`      | `{ "nombre", "cliente", "descripcion" }`            | `201` - "Proyecto creado correctamente."         |
| GET    | `/proyectos`      | (sin body)                                          | `200` - Lista de proyectos                      |
| GET    | `/proyectos/:id`  | (sin body)                                          | `200` - Datos del proyecto                      |
| PUT    | `/proyectos/:id`  | Campos a actualizar                                 | `200` - "Proyecto actualizado correctamente."    |
| DELETE | `/proyectos/:id`  | (sin body)                                          | `200` - "Proyecto eliminado correctamente."      |

### Facturas

| Metodo | Ruta                        | Body                                                    | Respuesta exitosa                            |
|--------|------------------------------|-----------------------------------------------------------|-------------------------------------------------|
| POST   | `/facturas`                  | `{ "proveedor", "numero", "monto", "proyectoId" }`        | `201` - "Factura registrada correctamente."      |
| GET    | `/facturas`                  | (sin body)                                                | `200` - Lista de facturas                       |
| GET    | `/facturas/:id`               | (sin body)                                                | `200` - Datos de la factura                     |
| GET    | `/proyectos/:id/facturas`     | (sin body)                                                | `200` - Facturas de ese proyecto                |

El ingreso manual de facturas (`POST /facturas`) cubre el requisito
funcional RF08 definido en GA6-220501096-AA3-EV02 ("Permitir el
ingreso manual de facturas o recibos"), y es independiente del flujo
automatico por WhatsApp/n8n que alimentara la misma coleccion de
Firestore en fases posteriores del proyecto.

## Control de versiones

```bash
git add .
git commit -m "Servicios de Proyectos y Facturas - GA7-220501096-AA5-EV03"
git push
```
