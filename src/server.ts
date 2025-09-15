import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import s3Routes from "./routes/s3Routes"; 
import dotenv from "dotenv";
dotenv.config();
const app = express();
const PORT = 3000;


const localUpload = multer({ dest: "uploads/" });


app.get("/local/archivos", (req, res) => {
  const dir = path.join(__dirname, "uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const files = fs.readdirSync(dir);
  res.json({ archivos: files });
});


app.post("/local/archivos", localUpload.single("archivo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Archivo faltante" });
  res.status(201).json({ mensaje: "Archivo subido localmente", archivo: req.file.filename });
});


app.get("/local/archivos/:nombre", (req, res) => {
  const { nombre } = req.params;
  const filePath = path.join(__dirname, "uploads", nombre);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Archivo no encontrado" });
  res.download(filePath);
});



app.use(express.json());
app.use("/object-storage", s3Routes);


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});
