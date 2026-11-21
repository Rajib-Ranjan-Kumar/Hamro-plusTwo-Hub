import { v2 as cloudinary } from 'cloudinary';

export default function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Read credentials exclusively from environment variables (NO Fallback Secrets)
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({
      error: 'Cloudinary storage credentials are not properly configured on the server.'
    });
  }

  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const folder = req.query?.folder || req.body?.folder;
    const publicId = req.query?.public_id || req.body?.public_id;
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

    return res.status(200).json({
      timestamp,
      signature,
      cloudName,
      apiKey,
      folder: folder || null,
      publicId: publicId || null,
    });
  } catch (error: any) {
    console.error('Error generating Cloudinary signature:', error?.message || 'Unknown error');
    return res.status(500).json({ error: 'Failed to generate upload signature.' });
  }
}
