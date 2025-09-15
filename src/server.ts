import express, { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;

// Carpeta para almacenar archivos localmente
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuración de multer (para subir archivos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// Endpoint 1: Listar archivos
app.get("/local/archivos", (req: Request, res: Response) => {
  const files = fs.readdirSync(uploadDir);
  res.json({ archivos: files });
});

// Endpoint 2: Descargar un archivo
app.get("/local/archivos/:nombre", (req: Request, res: Response) => {
  const filePath = path.join(uploadDir, req.params.nombre);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: "Archivo no encontrado" });
  }
});

// Endpoint 3: Subir un archivo
app.post("/local/archivos", upload.any(), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No se subió ningún archivo" });
  }
  res.status(201).json({
    mensaje: "Archivos subidos con éxito",
    archivos: (req.files as Express.Multer.File[]).map(f => f.originalname),
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
