import { v2 as cloudinary } from 'cloudinary';

export default async function handler(req: any, res: any) {
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { publicId, resourceType = 'image' } = req.body || {};

    if (!publicId) {
      return res.status(400).json({ error: 'Missing publicId in request body.' });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'zob9phdy';
    const apiKey = process.env.CLOUDINARY_API_KEY || '194297374744823';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'fGLjz4G4eVKmSX7oZ5wHPvTDdPQ';

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    // Cloudinary can categorize PDFs as 'image' or 'raw' depending on the upload mode
    let result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    if (result.result !== 'ok' && resourceType !== 'raw') {
      result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }

    return res.status(200).json({ success: true, result });
  } catch (error: any) {
    console.error('Error deleting Cloudinary asset:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete asset from Cloudinary' });
  }
}
