import { v2 as cloudinary } from 'cloudinary';

export default function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'zob9phdy';
    const apiKey = process.env.CLOUDINARY_API_KEY || '194297374744823';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'fGLjz4G4eVKmSX7oZ5wHPvTDdPQ';

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const folder = req.query?.folder || req.body?.folder;
    const timestamp = Math.round(new Date().getTime() / 1000);

    const paramsToSign: Record<string, any> = {
      timestamp: timestamp,
    };

    if (folder) {
      paramsToSign.folder = folder;
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    res.status(200).json({
      timestamp,
      signature,
      cloudName,
      apiKey,
      folder: folder || null,
    });
  } catch (error: any) {
    console.error('Error generating Cloudinary signature:', error);
    res.status(500).json({ error: error.message || 'Failed to generate upload signature' });
  }
}
