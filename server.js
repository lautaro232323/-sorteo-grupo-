// Servidor del Sorteo del Grupo
// -------------------------------
// Guarda participantes y ganador en un archivo local (datos.json).
// Cualquiera que entre a la URL del servidor ve los mismos datos,
// desde cualquier navegador o dispositivo.

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "datos.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function cargarDatos() {
  if (!fs.existsSync(DATA_FILE)) {
    return { participantes: [], ganador: null };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function guardarDatos(datos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(datos, null, 2));
}

// Obtener el estado actual (participantes + ganador)
app.get("/api/estado", (req, res) => {
  res.json(cargarDatos());
});

// Agregar un participante
app.post("/api/participar", (req, res) => {
  const { nombre, telefono } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: "Falta el nombre." });
  }
  const datos = cargarDatos();
  datos.participantes.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    nombre: nombre.trim(),
    telefono: (telefono || "").trim(),
    ts: Date.now(),
  });
  guardarDatos(datos);
  res.json({ ok: true });
});

// Sortear un ganador entre los participantes actuales — requiere clave
app.post("/api/sortear", requiereClave, (req, res) => {
  const datos = cargarDatos();
  if (datos.participantes.length === 0) {
    return res.status(400).json({ error: "No hay participantes." });
  }
  const idx = Math.floor(Math.random() * datos.participantes.length);
  datos.ganador = datos.participantes[idx];
  guardarDatos(datos);
  res.json({ ganador: datos.ganador });
});

// Clave secreta para poder ejecutar acciones de administrador.
const ADMIN_KEY = process.env.ADMIN_KEY || "7562";

function requiereClave(req, res, next) {
  if (req.body.clave !== ADMIN_KEY) {
    return res.status(403).json({ error: "Clave incorrecta." });
  }
  next();
}

// Reiniciar solo el ganador (los participantes quedan) — requiere clave
app.post("/api/reiniciar-ganador", requiereClave, (req, res) => {
  const datos = cargarDatos();
  datos.ganador = null;
  guardarDatos(datos);
  res.json({ ok: true });
});

// Vaciar todo (participantes + ganador) — requiere clave
app.post("/api/vaciar-todo", requiereClave, (req, res) => {
  guardarDatos({ participantes: [], ganador: null });
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Servidor del sorteo corriendo en http://localhost:${PORT}`);
});
