import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Generate a signature for direct upload to Cloudinary (supports dynamic folder)
  app.get("/api/upload-signature", (req, res) => {
    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'zob9phdy';
      const apiKey = process.env.CLOUDINARY_API_KEY || '194297374744823';
      const apiSecret = process.env.CLOUDINARY_API_SECRET || 'fGLjz4G4eVKmSX7oZ5wHPvTDdPQ';

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });

      const folder = (req.query?.folder as string) || (req.body?.folder as string);
      const timestamp = Math.round(new Date().getTime() / 1000);

      const paramsToSign: Record<string, any> = {
        timestamp: timestamp,
      };

      if (folder) {
        paramsToSign.folder = folder;
      }

      const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

      res.json({
        timestamp,
        signature,
        cloudName,
        apiKey,
        folder: folder || null,
      });
    } catch (error: any) {
      console.error("Error generating Cloudinary signature:", error);
      res.status(500).json({ error: error.message || "Failed to generate upload signature" });
    }
  });

  // Delete an asset from Cloudinary
  app.post("/api/delete-asset", async (req, res) => {
    try {
      const { publicId, resourceType = 'image' } = req.body || {};
      if (!publicId) {
        return res.status(400).json({ error: "Missing publicId in request body." });
      }

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'zob9phdy';
      const apiKey = process.env.CLOUDINARY_API_KEY || '194297374744823';
      const apiSecret = process.env.CLOUDINARY_API_SECRET || 'fGLjz4G4eVKmSX7oZ5wHPvTDdPQ';

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });

      let result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      if (result.result !== 'ok') {
        result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      }
      if (result.result !== 'ok' && !publicId.endsWith('.pdf')) {
        const rawRes = await cloudinary.uploader.destroy(`${publicId}.pdf`, { resource_type: 'raw' });
        if (rawRes.result === 'ok') result = rawRes;
      }
      if (result.result !== 'ok' && publicId.endsWith('.pdf')) {
        const strippedId = publicId.replace(/\.pdf$/, '');
        const imgRes = await cloudinary.uploader.destroy(strippedId, { resource_type: 'image' });
        if (imgRes.result === 'ok') result = imgRes;
      }

      res.json({ success: true, result });
    } catch (error: any) {
      console.error("Error deleting Cloudinary asset:", error);
      res.status(500).json({ error: error.message || "Failed to delete asset from Cloudinary" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
