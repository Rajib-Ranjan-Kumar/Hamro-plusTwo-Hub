import firebaseConfig from '../firebase-applet-config.json';

interface UserAuthResult {
  authorized: boolean;
  statusCode: number;
  error?: string;
  uid?: string;
  email?: string;
  name?: string;
  role?: string;
}

async function verifyUserAuthorization(authHeader: unknown): Promise<UserAuthResult> {
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

    // Optional admin check
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

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed. Only GET is supported.' });
  }

  try {
    // 1. Verify User Authentication (Enforces Student or Admin role)
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const authCheck = await verifyUserAuthorization(authHeader);
    if (!authCheck.authorized) {
      return res.status(authCheck.statusCode).json({ error: authCheck.error });
    }

    const { id, url } = req.query || {};
    if (!id && !url) {
      return res.status(400).json({ error: 'Missing required parameter: id or url must be provided.' });
    }

    let targetPdfUrl = '';
    let isDocPremiumOnly = false;

    // If document ID is provided, securely resolve its storage URL via Firestore REST API
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

    // Fallback to validated direct URL if provided
    if (!targetPdfUrl && url && typeof url === 'string') {
      targetPdfUrl = decodeURIComponent(url);
    }

    if (!targetPdfUrl) {
      return res.status(404).json({ error: 'Requested document not found or lacks a valid PDF file reference.' });
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

    // SSRF Protection: restrict target origin to authorized Cloudinary or Firebase Storage domains
    const isCloudinary = targetPdfUrl.startsWith('https://res.cloudinary.com/');
    const isFirebaseStorage = targetPdfUrl.startsWith('https://firebasestorage.googleapis.com/');

    if (!isCloudinary && !isFirebaseStorage) {
      return res.status(400).json({ error: 'Invalid document domain origin. Access restricted to Hamro +2 Hub storage.' });
    }

    // Fetch PDF binary buffer on the server
    const pdfResponse = await fetch(targetPdfUrl);
    if (!pdfResponse.ok) {
      return res.status(502).json({ error: 'Failed to retrieve document stream from storage backend.' });
    }

    const arrayBuffer = await pdfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Serve with anti-caching & secure inline presentation headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="hamroplus2_preview.pdf"');
    res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Length', buffer.length.toString());

    return res.status(200).send(buffer);
  } catch (error: any) {
    console.error('Error streaming secure PDF:', error?.message || error);
    return res.status(500).json({ error: 'Internal server error while retrieving protected document.' });
  }
}
