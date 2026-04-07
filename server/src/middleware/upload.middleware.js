/**
 * Middleware d'upload de fichiers avec Multer + Cloudinary
 * Stockage direct dans Cloudinary (pas de fichier local)
 */
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Stockage Cloudinary pour les avatars utilisateurs
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'buildmarket/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
});

// Stockage Cloudinary pour les médias produits (images + PDFs + vidéos)
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let resourceType = 'image';
    let folder       = 'buildmarket/products/images';

    if (file.mimetype === 'application/pdf') {
      resourceType = 'raw';
      folder       = 'buildmarket/products/pdfs';
    } else if (file.mimetype.startsWith('video/')) {
      resourceType = 'video';
      folder       = 'buildmarket/products/videos';
    }

    return { folder, resource_type: resourceType };
  },
});

// Stockage pour les pièces jointes des devis (plans, photos)
const quoteStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'buildmarket/quotes',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type:   'auto',
  },
});

// Filtre global : taille max 20MB
const fileSizeLimit = 20 * 1024 * 1024;

export const uploadAvatar   = multer({ storage: avatarStorage,  limits: { fileSize: 5 * 1024 * 1024 } });
export const uploadProduct  = multer({ storage: productStorage, limits: { fileSize: fileSizeLimit } });
export const uploadQuote    = multer({ storage: quoteStorage,   limits: { fileSize: fileSizeLimit } });
