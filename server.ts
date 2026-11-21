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

async function verifyUserAuthorization(authHeader: unknown): Promise<{
  authorized: boolean;
  statusCode: number;
  error?: string;
  uid?: string;
  email?: string;
  name?: string;
  role?: string;
}> {
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
    const name = userRecord.displayName || 'Student';

    let role = 'student';
    if (email === 'jaiswalrajib98192@gmail.com') {
      role = 'admin';
    } else {
      try {
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDbId}/documents/users/${uid}`;
        const docRes = await fetch(firestoreUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (docRes.ok) {
          const docData = await docRes.json();
          if (docData.fields?.role?.stringValue === 'admin') {
            role = 'admin';
          }
        }
      } catch {
        // Fallback role is student
      }
    }

    return { authorized: true, statusCode: 200, uid, email, name, role };
  } catch (err) {
    console.error('Error during user authorization verification:', err);
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

  // Secure Authenticated PDF Streaming (Enforces authentication & suppresses direct URLs)
  app.get("/api/secure-pdf-stream", async (req, res) => {
    try {
      // 1. Verify User Authentication (Students or Admins)
      const authHeader = req.headers?.authorization || req.headers?.Authorization;
      const authCheck = await verifyUserAuthorization(authHeader);
      if (!authCheck.authorized) {
        return res.status(authCheck.statusCode).json({ error: authCheck.error });
      }

      const { id, url } = req.query as { id?: string; url?: string };
      if (!id && !url) {
        return res.status(400).json({ error: "Missing required parameter: id or url must be provided." });
      }

      let targetPdfUrl = '';
      let isDocPremiumOnly = false;

      // If document ID is provided, look up the document in Firestore
      if (id && typeof id === 'string') {
        const projectId = process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
        const firestoreDbId = firebaseConfig.firestoreDatabaseId || '(default)';
        const token = (authHeader as string).substring(7).trim();

        // Check academic_resources first
        let docRes = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDbId}/documents/academic_resources/${encodeURIComponent(id)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!docRes.ok) {
          // Fallback to contributions
          docRes = await fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDbId}/documents/contributions/${encodeURIComponent(id)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        if (docRes.ok) {
          const docData = await docRes.json();
          const fields = docData.fields || {};
          targetPdfUrl =
            fields.cloudinary_secure_url?.stringValue ||
            fields.file_url?.stringValue ||
            fields.solution_url?.stringValue ||
            '';

          const docStatus = fields.status?.stringValue || '';
          const docAccess = fields.access_level?.stringValue || '';
          if (docStatus === 'premium_only' || docAccess === 'premium') {
            isDocPremiumOnly = true;
          }
        }
      }

      // If ID didn't resolve or URL was directly passed, validate URL
      if (!targetPdfUrl && url && typeof url === 'string') {
        targetPdfUrl = decodeURIComponent(url);
      }

      if (!targetPdfUrl) {
        return res.status(404).json({ error: "Requested document not found or lacks a valid PDF file reference." });
      }

      // Enforce Premium Access Policy on the Backend
      if (authCheck.role !== 'admin') {
        const projectId = process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
        const firestoreDbId = firebaseConfig.firestoreDatabaseId || '(default)';
        const token = (authHeader as string).substring(7).trim();

        // Check platform Global Premium mode (settings/global_settings)
        let isGlobalPremiumOn = true;
        try {
          const settingsRes = await fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDbId}/documents/settings/global_settings`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            if (settingsData.fields?.premium_only_mode?.booleanValue !== undefined) {
              isGlobalPremiumOn = settingsData.fields.premium_only_mode.booleanValue;
            }
          }
        } catch {
          // Defaults to true on error
        }

        // Check if student has active premium status in users/${authCheck.uid}
        let userHasActivePremium = false;
        try {
          const userDocRes = await fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDbId}/documents/users/${authCheck.uid}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (userDocRes.ok) {
            const userDocData = await userDocRes.json();
            const uFields = userDocData.fields || {};
            const isPrem = uFields.is_premium?.booleanValue === true;
            const subExpiry = uFields.subscription_expiry_date?.stringValue;
            if (isPrem) {
              userHasActivePremium = true;
            } else if (subExpiry) {
              const exp = new Date(subExpiry).getTime();
              if (Date.now() <= exp + 3 * 86400000) {
                userHasActivePremium = true;
              }
            }
          }
        } catch (err) {
          console.warn("Could not check user premium status:", err);
        }

        // Rule 1: If document is specifically marked 'Visible to Premium Students Only', student MUST have premium
        if (isDocPremiumOnly && !userHasActivePremium) {
          return res.status(403).json({
            error: "Premium Required: This resource is designated for Premium Students Only. Please upgrade your subscription to access."
          });
        }

        // Rule 2: When Premium is ON (Global Premium Mode), only premium users can view materials
        if (isGlobalPremiumOn && !userHasActivePremium) {
          return res.status(403).json({
            error: "Premium Required: Premium Mode is active. Upgrade to access full study materials."
          });
        }

        // Rule 3: When Premium is OFF (Global Bypass), every registered student can view!
      }

      // SSRF Protection: ensure the target URL is from authorized domains
      const isCloudinary = targetPdfUrl.startsWith('https://res.cloudinary.com/');
      const isFirebaseStorage = targetPdfUrl.startsWith('https://firebasestorage.googleapis.com/');

      if (!isCloudinary && !isFirebaseStorage) {
        return res.status(400).json({ error: "Invalid document domain origin. Access restricted to Hamro +2 Hub storage." });
      }

      // Stream the PDF from upstream
      const pdfResponse = await fetch(targetPdfUrl);
      if (!pdfResponse.ok) {
        return res.status(502).json({ error: "Failed to retrieve document stream from storage backend." });
      }

      const arrayBuffer = await pdfResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Security headers: No caching, inline presentation, prevent sniffing
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=\"hamroplus2_preview.pdf\"");
      res.setHeader("Cache-Control", "private, no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Length", buffer.length.toString());

      return res.status(200).send(buffer);
    } catch (error: any) {
      console.error("Error streaming secure PDF:", error?.message || error);
      return res.status(500).json({ error: "Internal server error while retrieving protected document." });
    }
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
