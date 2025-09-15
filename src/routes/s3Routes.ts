import { Router } from "express";
import { S3Client, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import * as fs from "fs";
import multer from "multer";

const router = Router();
const upload = multer({ dest: "uploads/" });

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN!,
  },
});

const BUCKET_NAME = process.env.BUCKET_NAME!;

// ✅ Listar archivos
router.get("/archivos", async (req, res) => {
  try {
    const command = new ListObjectsV2Command({ Bucket: BUCKET_NAME });
    const response = await s3Client.send(command);
    const files = response.Contents?.map((f) => f.Key) || [];
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// ✅ Descargar archivo
router.get("/archivos/:nombreArchivo", async (req, res) => {
  const { nombreArchivo } = req.params;
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: nombreArchivo });
    const response = await s3Client.send(command);

    if (response.Body) {
      res.setHeader("Content-Disposition", `attachment; filename="${nombreArchivo}"`);
      (response.Body as NodeJS.ReadableStream).pipe(res);
    } else {
      res.status(404).send("Archivo no encontrado");
    }
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// ✅ Subir archivo
router.post("/archivos", upload.single("archivo"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send("No se envió archivo");

  try {
    const fileStream = fs.createReadStream(file.path);
    const uploader = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: file.originalname,
        Body: fileStream,
      },
    });
    await uploader.done();
    fs.unlinkSync(file.path); // borrar temporal
    res.send("Archivo subido a S3");
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// ✅ Borrar archivo
router.delete("/archivos/:nombreArchivo", async (req, res) => {
  const { nombreArchivo } = req.params;
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: nombreArchivo }));
    res.send("Archivo eliminado de S3");
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

export default router;
