import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

// Ensure local uploads directory exists as fallback when Cloudinary is not configured
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer memory storage (allows streaming to Cloudinary or writing to local disk)
const storage = multer.memoryStorage();

// Allowed file types: JPEG, PNG, WebP
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

const router = express.Router();

// Helper to upload buffer to Cloudinary using official SDK
const uploadToCloudinary = (buffer, filename) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { v2: cloudinary } = await import('cloudinary');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'campusexchange/products',
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      uploadStream.end(buffer);
    } catch (err) {
      reject(err);
    }
  });
};

router.post('/', protect, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Image size exceeds the 5MB limit. Please upload a smaller image.',
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please select a JPEG, PNG, or WebP image.',
      });
    }

    try {
      const isCloudinaryConfigured = Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      );

      if (isCloudinaryConfigured) {
        // Official Cloudinary Upload
        const cloudResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);
        return res.status(200).json({
          success: true,
          message: 'Image uploaded to Cloudinary successfully.',
          imageUrl: cloudResult.secure_url,
          publicId: cloudResult.public_id,
        });
      } else {
        // Local Fallback Storage for Development
        const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const filename = `product-${uniqueSuffix}${ext}`;
        const filePath = path.join(uploadsDir, filename);

        await fs.promises.writeFile(filePath, req.file.buffer);

        // Build server-hosted URL
        const protocol = req.protocol;
        const host = req.get('host');
        const imageUrl = `${protocol}://${host}/uploads/${filename}`;

        return res.status(200).json({
          success: true,
          message: 'Image uploaded successfully (local development storage).',
          imageUrl,
          publicId: filename,
        });
      }
    } catch (uploadError) {
      console.error('Image Upload Error:', uploadError);
      return res.status(500).json({
        success: false,
        message: `Failed to upload image: ${uploadError.message}`,
      });
    }
  });
});

export default router;
