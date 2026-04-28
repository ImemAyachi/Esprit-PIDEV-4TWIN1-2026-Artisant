import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';

function sanitizePublicIdSegment(s) {
  return String(s || '')
    .trim()
    .replace(/[^\w\-./]+/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 120);
}

function hasRealCloudinaryConfig() {
  const name = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const key = String(process.env.CLOUDINARY_API_KEY || '').trim();
  const secret = String(process.env.CLOUDINARY_API_SECRET || '').trim();
  if (!name || !key || !secret) return false;
  const bad = new Set(['your_api_key', 'your_cloud_name', 'your_api_secret', 'changeme', 'xxx']);
  if (bad.has(key) || bad.has(name) || bad.has(secret)) return false;
  return true;
}

function serverPublicUrl() {
  return String(process.env.SERVER_PUBLIC_URL || 'http://localhost:5000').trim().replace(/\/$/, '');
}

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {}
}

export async function uploadBufferToCloudinary(buffer, { folder, publicId, resourceType, format }) {
  if (!buffer || !(buffer instanceof Buffer) || buffer.length === 0) {
    const err = new Error('Buffer manquant pour upload Cloudinary');
    err.statusCode = 400;
    throw err;
  }

  // Fallback: store locally under /uploads when Cloudinary isn't configured.
  if (!hasRealCloudinaryConfig()) {
    const ext = format || 'bin';
    const safeName = sanitizePublicIdSegment(publicId || `asset_${Date.now()}.${ext}`).replace(/\//g, '_');
    const relDir = path.join('uploads', 'meshes');
    ensureDir(relDir);
    const relPath = path.join(relDir, safeName);
    fs.writeFileSync(relPath, buffer);
    const url = `${serverPublicUrl()}/${relPath.replace(/\\/g, '/')}`;
    return { secure_url: url, url };
  }

  const safeFolder = sanitizePublicIdSegment(folder || 'buildmarket/meshes');
  const safePublicId = sanitizePublicIdSegment(publicId || '');
  const rt = resourceType || 'raw';

  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: safeFolder,
        resource_type: rt,
        public_id: safePublicId || undefined,
        format: format || undefined,
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

