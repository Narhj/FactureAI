// ==========================================================
// FactureAI - Servicios web del proyecto
// Evidencia GA7-220501096-AA5-EV03
// Autor: Moises David Florez Olivero
// ----------------------------------------------------------
// Esta evidencia parte del servicio de Registro e Inicio de
// Sesion construido en GA7-220501096-AA5-EV01 y le agrega los
// servicios que representan caracteristicas reales del
// proyecto FactureAI (no ya un caso de estudio generico):
//
//   - Modulo de Proyectos (CRUD completo)
//   - Modulo de Facturas (consulta + ingreso manual)
//
// Se mantiene la misma arquitectura ya justificada en AA5-EV01:
// Firebase Cloud Functions + Express, conectado a Firestore.
// No se agrega tecnologia nueva, se extiende la misma base.
// ==========================================================

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const express = require("express");
const bcrypt = require("bcryptjs");

admin.initializeApp();
const db = getFirestore();

const app = express();
app.use(express.json());

const usersCollection = db.collection("usuarios");
const proyectosCollection = db.collection("proyectos");
const facturasCollection = db.collection("facturas");

// ==========================================================
// Servicios de Registro e Inicio de Sesion (GA7-220501096-AA5-EV01)
// Se conservan sin cambios: ya fueron probados en la evidencia
// GA7-220501096-AA5-EV02.
// ==========================================================

app.post("/register", async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({
        estado: "error",
        mensaje: "Usuario y contrasena son obligatorios.",
      });
    }

    const existingUser = await usersCollection.doc(usuario).get();
    if (existingUser.exists) {
      return res.status(409).json({
        estado: "error",
        mensaje: "El usuario ya esta registrado.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await usersCollection.doc(usuario).set({
      usuario,
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
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({
        estado: "error",
        mensaje: "Usuario y contrasena son obligatorios.",
      });
    }

    const userDoc = await usersCollection.doc(usuario).get();

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
// Modulo de Proyectos (GA7-220501096-AA5-EV03)
// CRUD completo. Un "proyecto" es la unidad a la que se
// asocian las facturas (tal como se definio desde el informe
// tecnico GA7-220501096-AA1-EV01 y el mapa de navegacion
// GA6-220501096-AA3-EV02).
// ==========================================================

// POST /proyectos - Crear un proyecto nuevo
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

// GET /proyectos - Listar todos los proyectos
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

// GET /proyectos/:id - Ver el detalle de un proyecto
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

// PUT /proyectos/:id - Editar un proyecto existente
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

// DELETE /proyectos/:id - Eliminar un proyecto
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
// Modulo de Facturas (GA7-220501096-AA5-EV03)
// En el MVP real las facturas llegan de forma automatica por
// WhatsApp (Evolution API + n8n + Groq/Gemini), fuera del
// alcance de este servicio Express. Aqui se exponen los
// servicios que si corresponden a este backend:
//   - Consulta/listado de facturas ya almacenadas en Firestore
//   - Ingreso manual de facturas (RF08 del documento
//     GA6-220501096-AA3-EV02: "Permitir el ingreso manual de
//     facturas o recibos"), que ademas sirve para probar este
//     modulo sin depender de que n8n este corriendo.
// ==========================================================

// POST /facturas - Ingreso manual de una factura
app.post("/facturas", async (req, res) => {
  try {
    const { proveedor, numero, monto, fecha, proyectoId } = req.body;

    if (!proveedor || !numero || !monto || !proyectoId) {
      return res.status(400).json({
        estado: "error",
        mensaje: "proveedor, numero, monto y proyectoId son obligatorios.",
      });
    }

    // Verificamos que el proyecto asociado exista.
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
      origen: "manual", // distingue de las que llegaran por WhatsApp/n8n
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

// GET /facturas - Listar todas las facturas
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

// GET /facturas/:id - Ver el detalle de una factura
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

// GET /proyectos/:id/facturas - Facturas de un proyecto especifico
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
// Exponemos la app de Express como una unica Cloud Function.
// Misma funcion "api" de AA5-EV01, ahora con mas endpoints.
// ----------------------------------------------------------
exports.api = functions.https.onRequest(app);
