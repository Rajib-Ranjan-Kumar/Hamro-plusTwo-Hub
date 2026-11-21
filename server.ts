import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import firebaseConfig from "./firebase-applet-config.json";

dotenv.config();

interface AdminAuthResult {
  authorized: boolean;
  statusCode: number;
  error?: string;
  uid?: string;
  email?: string;
}

async function verifyAdminAuthorization(authHeader: unknown): Promise<AdminAuthResult> {
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      statusCode: 401,
      error: 'Unauthorized: Missing or invalid Authorization Bearer header.'
    };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return {
      authorized: false,
      statusCode: 401,
      error: 'Unauthorized: Bearer token is empty.'
    };
  }

  const apiKey = process.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  const firestoreDbId = firebaseConfig.firestoreDatabaseId || '(default)';

  try {
    const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token })
    });

    if (!verifyRes.ok) {
      return {
        authorized: false,
        statusCode: 401,
        error: 'Unauthorized: Invalid or expired Firebase authentication token.'
      };
    }

    const verifyData = await verifyRes.json();
    const userRecord = verifyData.users?.[0];
    if (!userRecord || !userRecord.localId) {
      return {
        authorized: false,
        statusCode: 401,
        error: 'Unauthorized: Authenticated user not found.'
      };
    }

    const uid = userRecord.localId;
    const email = (userRecord.email || '').toLowerCase();

    // 1. Primary admin email check
    if (email === 'jaiswalrajib98192@gmail.com') {
      return { authorized: true, statusCode: 200, uid, email };
    }

    // 2. Query user role from Firestore REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDbId}/documents/users/${uid}`;
    const docRes = await fetch(firestoreUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (docRes.ok) {
      const docData = await docRes.json();
      const role = docData.fields?.role?.stringValue;
      if (role === 'admin') {
        return { authorized: true, statusCode: 200, uid, email };
      }
    }

    return {
      authorized: false,
      statusCode: 403,
      error: 'Forbidden: Requester does not have administrator privileges.'
    };
  } catch (err) {
    console.error('Error during admin authorization verification:', err);
    return {
      authorized: false,
      statusCode: 500,
      error: 'Internal authentication verification error.'
    };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Generate a signature for direct upload to Cloudinary (supports dynamic folder)
  app.get("/api/upload-signature", (req, res) => {
    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        return res.status(500).json({
          error: "Cloudinary storage credentials are not properly configured on the server."
        });
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });

      const folder = (req.query?.folder as string) || (req.body?.folder as string);
      const publicId = (req.query?.public_id as string) || (req.body?.public_id as string);
      const timestamp = Math.round(new Date().getTime() / 1000);

      const paramsToSign: Record<string, any> = {
        timestamp: timestamp,
      };

      if (folder && typeof folder === 'string') {
        paramsToSign.folder = folder;
      }

      if (publicId && typeof publicId === 'string') {
        paramsToSign.public_id = publicId;
      }

      const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

      res.json({
        timestamp,
        signature,
        cloudName,
        apiKey,
        folder: folder || null,
        publicId: publicId || null,
      });
    } catch (error: any) {
      console.error("Error generating Cloudinary signature:", error?.message || "Unknown error");
      res.status(500).json({ error: "Failed to generate upload signature" });
    }
  });

  // Delete an asset from Cloudinary (Protected: Requires Authenticated Admin)
  app.post("/api/delete-asset", async (req, res) => {
    try {
      // 1. Enforce Administrator Authorization
      const authHeader = req.headers?.authorization || req.headers?.Authorization;
      const authCheck = await verifyAdminAuthorization(authHeader);
      if (!authCheck.authorized) {
        return res.status(authCheck.statusCode).json({ error: authCheck.error });
      }

      // 2. Validate Request Body and publicId
      const { publicId, resourceType = 'image' } = req.body || {};
      if (!publicId || typeof publicId !== 'string' || !publicId.trim()) {
        return res.status(400).json({ error: "Missing or empty publicId in request body." });
      }

      const cleanPublicId = publicId.trim();

      // Validate format to prevent directory traversal
      if (cleanPublicId.includes('..') || !/^[a-zA-Z0-9_\-\.\/]+$/.test(cleanPublicId)) {
        return res.status(400).json({ error: "Invalid publicId format provided." });
      }

      const safeResourceType = resourceType === 'raw' ? 'raw' : 'image';

      // 3. Load Cloudinary Credentials Exclusively from Environment Variables (NO Hardcoded Fallbacks)
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        return res.status(500).json({
          error: "Cloudinary storage credentials are not properly configured on the server."
        });
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });

      let result = await cloudinary.uploader.destroy(cleanPublicId, { resource_type: safeResourceType });
      if (result.result !== 'ok') {
        result = await cloudinary.uploader.destroy(cleanPublicId, { resource_type: 'raw' });
      }
      if (result.result !== 'ok' && !cleanPublicId.endsWith('.pdf')) {
        const rawRes = await cloudinary.uploader.destroy(`${cleanPublicId}.pdf`, { resource_type: 'raw' });
        if (rawRes.result === 'ok') result = rawRes;
      }
      if (result.result !== 'ok' && cleanPublicId.endsWith('.pdf')) {
        const strippedId = cleanPublicId.replace(/\.pdf$/, '');
        const imgRes = await cloudinary.uploader.destroy(strippedId, { resource_type: 'image' });
        if (imgRes.result === 'ok') result = imgRes;
      }

      res.json({ success: true, result });
    } catch (error: any) {
      console.error("Error deleting Cloudinary asset:", error?.message || "Unknown error");
      res.status(500).json({ error: "Failed to delete asset from storage." });
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
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
