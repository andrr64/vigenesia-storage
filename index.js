import express from 'express';
import multer from 'multer';
import path from 'path';
import os from 'os';
import fs from 'fs'; // Untuk membaca file
import { fileURLToPath } from 'url';

// Buat __dirname manual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Fungsi untuk mendapatkan IP lokal
const getLocalIp = () => {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    for (const details of networkInterfaces[interfaceName]) {
      if (details.family === 'IPv4' && !details.internal) {
        return details.address;
      }
    }
  }
  return "127.0.0.1"; // Default ke localhost jika tidak ditemukan
};

// Middleware untuk menambahkan log dengan IP
app.use((req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress; // Mendapatkan IP client
  console.log(`Request from IP: ${clientIp} | Method: ${req.method} | URL: ${req.originalUrl}`);
  next(); // Lanjutkan ke middleware atau route berikutnya
});

// Konfigurasi Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(`Destination folder: uploads/`);
    cb(null, "uploads/"); // Folder penyimpanan file
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    console.log(`File name: ${uniqueSuffix}-${file.originalname}`);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Middleware untuk folder statis
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route untuk unggah file
app.post("/upload", upload.single("file"), (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  console.log(`File upload request from IP: ${clientIp}`);

  if (!req.file) {
    console.log("No file uploaded.");
    return res.status(400).json({ message: "No file uploaded!" });
  }

  console.log("File uploaded successfully:", req.file.filename);
  res.status(200).json({
    message: "File uploaded successfully!",
    filePath: `/uploads/${req.file.filename}`,
    fileName: req.file.filename
  });
});

// Getter file: Mengambil detail file dari folder uploads
app.get("/file/:fileName", (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, "uploads", fileName);

  console.log(`Request from IP: ${clientIp} to fetch file: ${fileName}`);

  // Periksa apakah file ada
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return res.status(404).json({ message: "File not found!" });
  }

  // Kirim file ke klien
  console.log(`Sending file: ${filePath}`);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).json({ message: "Error sending file!" });
    }
  });
});

// Jalankan server
app.listen(PORT, () => {
  const localIp = getLocalIp();
  console.log(`Server is running on http://${localIp}:${PORT}`);
});
