// ==========================================================
// FactureAI - Backend para Render.com
// Evidencia GA8-220501096-AA1-EV02 (Modulos integrados)
// Autor: Moises David Florez Olivero
// ----------------------------------------------------------
// CAMBIO DE ARQUITECTURA (documentado honestamente en la evidencia):
// Firebase Cloud Functions exige el plan de pago Blaze (con tarjeta
// registrada) incluso para uso gratuito. Como el proyecto sigue una
// filosofia de "todo gratis" para el cliente final, se decidio mover
// el HOSTING del backend a Render.com (gratis, sin tarjeta).
//
// La base de datos NO cambia: sigue siendo Firestore, el mismo
// proyecto de Firebase (practicefactureia). Lo unico que cambia es
// donde corre el codigo de Express: antes en una Cloud Function,
// ahora en un servidor normal de Node en Render.
//
// Por eso este archivo es casi identico a functions/index.js (que se
// conserva para seguir probando localmente con el emulador), con dos
// diferencias puntuales:
//   1. No se usa "firebase-functions": el servidor se levanta con
//      app.listen(), como cualquier API de Express.
//   2. La conexion a Firestore se autentica con una cuenta de
//      servicio (service account), porque fuera de la infraestructura
//      de Google ya no hay credenciales automaticas.
// ==========================================================

const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");

// ----------------------------------------------------------
// Credenciales de Firestore (cuenta de servicio)
// La variable de entorno FIREBASE_SERVICE_ACCOUNT debe contener el
// JSON completo de la cuenta de servicio (como texto). Se configura
// en Render, nunca se sube al repositorio.
// ----------------------------------------------------------
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error(
    "Falta la variable de entorno FIREBASE_SERVICE_ACCOUNT. " +
      "Sin ella el servidor no puede conectarse a Firestore."
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = getFirestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const usersCollection = db.collection("usuarios");
const proyectosCollection = db.collection("proyectos");
const facturasCollection = db.collection("facturas");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Ruta raiz: sirve para que Render confirme que el servicio esta vivo,
// y para "despertarlo" manualmente si hace falta.
app.get("/", (req, res) => {
  res.status(200).json({ estado: "ok", mensaje: "FactureAI API activa." });
});

// ==========================================================
// Modulo de Autenticacion (igual que en functions/index.js)
// ==========================================================

app.post("/register", async (req, res) => {
  try {
    const { nombres, apellidos, cedula, fechaNacimiento, correo, password } = req.body;

    if (!nombres || !apellidos || !cedula || !fechaNacimiento || !correo || !password) {
      return res.status(400).json({
        estado: "error",
        mensaje: "Nombres, apellidos, cedula, fecha de nacimiento, correo y contrasena son obligatorios.",
      });
    }

    const correoNormalizado = String(correo).trim().toLowerCase();

    if (!EMAIL_REGEX.test(correoNormalizado)) {
      return res.status(400).json({
        estado: "error",
        mensaje: "El correo electronico no tiene un formato valido.",
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        estado: "error",
        mensaje: "La contrasena debe tener minimo 8 caracteres.",
      });
    }

    const existingUser = await usersCollection.doc(correoNormalizado).get();
    if (existingUser.exists) {
      return res.status(409).json({
        estado: "error",
        mensaje: "Ese correo ya esta registrado.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await usersCollection.doc(correoNormalizado).set({
      nombres,
      apellidos,
      cedula,
      fechaNacimiento,
      correo: correoNormalizado,
      passwordHash,
      creadoEn: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      estado: "ok",
      mensaje: "Usuario registrado correctamente.",
    });
  } catch (error) {
    console.error("Error en /register:", error);
    return res.status(500).json({
      estado: "error",
      mensaje: "Error interno al registrar el usuario.",
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({
        estado: "error",
        mensaje: "Correo y contrasena son obligatorios.",
      });
    }

    const correoNormalizado = String(correo).trim().toLowerCase();
    const userDoc = await usersCollection.doc(correoNormalizado).get();

    if (!userDoc.exists) {
      return res.status(401).json({
        estado: "error",
        mensaje: "Error en la autenticacion.",
      });
    }

    const userData = userDoc.data();
    const passwordValida = await bcrypt.compare(password, userData.passwordHash);

    if (!passwordValida) {
      return res.status(401).json({
        estado: "error",
        mensaje: "Error en la autenticacion.",
      });
    }

    return res.status(200).json({
      estado: "ok",
      mensaje: "Autenticacion satisfactoria.",
      usuario: {
        correo: userData.correo,
        nombres: userData.nombres,
        apellidos: userData.apellidos,
      },
    });
  } catch (error) {
    console.error("Error en /login:", error);
    return res.status(500).json({
      estado: "error",
      mensaje: "Error interno al iniciar sesion.",
    });
  }
});

// ==========================================================
// Modulo de Perfil
// ==========================================================

app.get("/perfil/:correo", async (req, res) => {
  try {
    const correoNormalizado = String(req.params.correo).trim().toLowerCase();
    const doc = await usersCollection.doc(correoNormalizado).get();

    if (!doc.exists) {
      return res.status(404).json({
        estado: "error",
        mensaje: "Usuario no encontrado.",
      });
    }

    const { nombres, apellidos, cedula, fechaNacimiento, correo } = doc.data();

    return res.status(200).json({
      estado: "ok",
      perfil: { nombres, apellidos, cedula, fechaNacimiento, correo },
    });
  } catch (error) {
    console.error("Error en GET /perfil/:correo:", error);
    return res.status(500).json({
      estado: "error",
      mensaje: "Error interno al consultar el perfil.",
    });
  }
});

app.put("/perfil/:correo", async (req, res) => {
  try {
    const correoNormalizado = String(req.params.correo).trim().toLowerCase();
    const docRef = usersCollection.doc(correoNormalizado);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        estado: "error",
        mensaje: "Usuario no encontrado.",
      });
    }

    const { nombres, apellidos, cedula, fechaNacimiento } = req.body;
    const cambios = {};
    if (nombres !== undefined) cambios.nombres = nombres;
    if (apellidos !== undefined) cambios.apellidos = apellidos;
    if (cedula !== undefined) cambios.cedula = cedula;
    if (fechaNacimiento !== undefined) cambios.fechaNacimiento = fechaNacimiento;

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({
        estado: "error",
        mensaje: "No se recibio ningun campo para actualizar.",
      });
    }

    await docRef.update(cambios);

    return res.status(200).json({
      estado: "ok",
      mensaje: "Perfil actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error en PUT /perfil/:correo:", error);
    return res.status(500).json({
      estado: "error",
      mensaje: "Error interno al actualizar el perfil.",
    });
  }
});

// ==========================================================
// Modulo de Proyectos (sin cambios de logica, GA7-220501096-AA5-EV03)
// ==========================================================

app.post("/proyectos", async (req, res) => {
  try {
    const { nombre, cliente, descripcion } = req.body;

    if (!nombre || !cliente) {
      return res.status(400).json({
        estado: "error",
        mensaje: "Nombre y cliente son obligatorios.",
      });
    }

    const nuevoProyecto = {
      nombre,
      cliente,
      descripcion: descripcion || "",
      estado: "activo",
      creadoEn: FieldValue.serverTimestamp(),
    };

    const docRef = await proyectosCollection.add(nuevoProyecto);

    return res.status(201).json({
      estado: "ok",
      mensaje: "Proyecto creado correctamente.",
      id: docRef.id,
    });
  } catch (error) {
    console.error("Error en POST /proyectos:", error);
    return res.status(500).json({
      estado: "error",
      mensaje: "Error interno al crear el proyecto.",
    });
  }
});

app.get("/proyectos", async (req, res) => {
  try {
    const snapshot = await proyectosCollection.orderBy("creadoEn", "desc").get();
    const proyectos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json({
      estado: "ok",
      total: proyectos.length,
      proyectos,
    });
  } catch (error) {
    console.error("Error en GET /proyectos:", error);
    return res.status(500).json({
      estado: "error",
      mensaje: "Error interno al listar los proyectos.",
    });
  }
});

app.get("/proyectos/:id", async (req, res) => {
  try {
    const doc = await proyectosCollection.doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({
        estado: "error",
        mensaje: "Proyecto no encontrado.",
      });
    }

    return res.status(200).json({
      estado: "ok",
      proyecto: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error en GET /proyectos/:id:", error);
    return res.status(500).json({
      estado: "error",
      mensaje: "Error interno al consultar el proyecto.",
    });
  }
});

app.put("/proyectos/:id", async (req, res) => {
  try {
    const docRef = proyectosCollection.doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        estado: "error",
        mensaje: "Proyecto no encontrado.",
      });
    }

    const { nombre, cliente, descripcion, estado } = req.body;
    const cambios = {};
    if (nombre !== undefined) cambios.nombre = nombre;
    if (cliente !== undefined) cambios.cliente = cliente;
    if (descripcion !== undefined) cambios.descripcion = descripcion;
    if (estado !== undefined) cambios.estado = estado;

    await docRef.update(cambios);

    return res.status(200).json({
      estado: "ok",
      mensaje: "Proyecto actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error en PUT /proyectos/:id:", error);
    return res.status(500).json({
      estado: "error",
      mensaje: "Error interno al actualizar el proyecto.",
    });
  }
});

app.delete("/proyectos/:id", async (req, res) => {
  try {
    const docRef = proyectosCollection.doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        estado: "error",
        mensaje: "Proyecto no encontrado.",
      });
    }

    await docRef.delete();

    return res.status(200).json({
      estado: "ok",
      mensaje: "Proyecto eliminado correctamente.",
    });
  } catch (error) {
    console.error("Error en DELETE /proyectos/:id:", error);
    return res.status(500).json({
      estado: "error",
      mensaje: "Error interno al eliminar el proyecto.",
    });
  }
});

// ==========================================================
// Modulo de Facturas (sin cambios de logica, GA7-220501096-AA5-EV03)
// ==========================================================

app.post("/facturas", async (req, res) => {
  try {
    const { proveedor, numero, monto, fecha, proyectoId } = req.body;

    if (!proveedor || !numero || !monto || !proyectoId) {
      return res.status(400).json({
        estado: "error",
        mensaje: "proveedor, numero, monto y proyectoId son obligatorios.",
      });
    }

    const proyectoDoc = await proyectosCollection.doc(proyectoId).get();
    if (!proyectoDoc.exists) {
      return res.status(404).json({
        estado: "error",
        mensaje: "El proyecto indicado no existe.",
      });
    }

    const nuevaFactura = {
      proveedor,
      numero,
      monto,
      fecha: fecha || new Date().toISOString(),
      proyectoId,
      origen: "manual",
      estado: "registrada",
      creadoEn: FieldValue.serverTimestamp(),
    };

    const docRef = await facturasCollection.add(nuevaFactura);

    return res.status(201).json({
      estado: "ok",
      mensaje: "Factura registrada correctamente.",
      id: docRef.id,
    });
  } catch (error) {
    console.error("Error en POST /facturas:", error);
    return res.status(500).json({
      estado: "error",
      mensaje: "Error interno al registrar la factura.",
    });
  }
});

app.get("/facturas", async (req, res) => {
  try {
    const snapshot = await facturasCollection.orderBy("creadoEn", "desc").get();
    const facturas = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json({
      estado: "ok",
      total: facturas.length,
      facturas,
    });
  } catch (error) {
    console.error("Error en GET /facturas:", error);
    return res.status(500).json({
      estado: "error",
      mensaje: "Error interno al listar las facturas.",
    });
  }
});

app.get("/facturas/:id", async (req, res) => {
  try {
    const doc = await facturasCollection.doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({
        estado: "error",
        mensaje: "Factura no encontrada.",
      });
    }

    return res.status(200).json({
      estado: "ok",
      factura: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error en GET /facturas/:id:", error);
    return res.status(500).json({
      estado: "error",
      mensaje: "Error interno al consultar la factura.",
    });
  }
});

app.get("/proyectos/:id/facturas", async (req, res) => {
  try {
    const proyectoDoc = await proyectosCollection.doc(req.params.id).get();
    if (!proyectoDoc.exists) {
      return res.status(404).json({
        estado: "error",
        mensaje: "Proyecto no encontrado.",
      });
    }

    const snapshot = await facturasCollection
      .where("proyectoId", "==", req.params.id)
      .orderBy("creadoEn", "desc")
      .get();

    const facturas = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json({
      estado: "ok",
      proyectoId: req.params.id,
      total: facturas.length,
      facturas,
    });
  } catch (error) {
    console.error("Error en GET /proyectos/:id/facturas:", error);
    return res.status(500).json({
      estado: "error",
      mensaje: "Error interno al listar las facturas del proyecto.",
    });
  }
});

// ----------------------------------------------------------
// Render asigna el puerto por la variable de entorno PORT.
// ----------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FactureAI API escuchando en el puerto ${PORT}`);
});
