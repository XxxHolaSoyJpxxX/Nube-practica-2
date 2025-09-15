import { Router } from "express";
import multer from "multer";
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import stream from "stream";

const router = Router();
const BUCKET_NAME = "practica-2-123456";
const s3Client = new S3Client({ region: "us-east-1" });
const upload = multer({ storage: multer.memoryStorage() });

// Listar archivos
router.get("/archivos", async (req, res) => {
  try {
    const data = await s3Client.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME }));
    const archivos = data.Contents?.map(f => f.Key) || [];
    res.json({ archivos });
  } catch (err) { res.status(500).json({ error: err }); }
});

// Subir archivo
router.post("/archivos", upload.single("archivo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Archivo faltante" });

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: req.file.originalname,
      Body: req.file.buffer,
      Metadata: { "x-amz-meta-expediente": "745730" }
    }));

    res.status(201).json({ mensaje: "Archivo subido", archivo: req.file.originalname });
  } catch (err) { res.status(500).json({ error: err }); }
});

// Descargar archivo
router.get("/archivos/:nombre", async (req, res) => {
  const { nombre } = req.params;
  try {
    const data = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: nombre }));
    (data.Body as stream.Readable).pipe(res);
  } catch (err) { res.status(404).json({ error: "Archivo no encontrado" }); }
});

// Eliminar archivo
router.delete("/archivos/:nombre", async (req, res) => {
  const { nombre } = req.params;
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: nombre }));
    res.json({ mensaje: "Archivo eliminado", archivo: nombre });
  } catch (err) { res.status(500).json({ error: err }); }
});

export default router;
