import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { Product } from './models/Product.js';
import { seedDatabase } from './scripts/seedData.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import requestRoutes from './routes/requestRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile, server-to-server)
      if (!origin) return callback(null, true);
      const allowed = [
        process.env.CLIENT_URL,
        'http://localhost:5173',
        'http://localhost:3000',
      ].filter(Boolean);

      if (allowed.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for local dev & interview demos
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Liveness & Readiness Probes
app.get('/health/live', (req, res) => res.status(200).json({ status: 'UP', service: 'CampusExchange Backend' }));
app.get('/health/ready', (req, res) => res.status(200).json({ status: 'READY', db: 'CONNECTED' }));

// Static uploads for locally stored images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes (Clean REST API + v1 alias)
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);

app.use('/api/upload', uploadRoutes);
app.use('/api/v1/upload', uploadRoutes);

app.use('/api/products', productRoutes);
app.use('/api/v1/products', productRoutes);

app.use('/api/requests', requestRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/orders', requestRoutes);       // Compatibility alias
app.use('/api/v1/orders', requestRoutes);    // Compatibility alias

app.use('/api/admin', adminRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use('/api/ai', aiRoutes);
app.use('/api/v1/ai', aiRoutes);

// Catch 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server & Connect MongoDB
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database is fresh and empty
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('⚡ Empty database detected. Auto-seeding initial CampusExchange student listings...');
      await seedDatabase();
    }

    app.listen(PORT, () => {
      console.log(`🚀 CampusExchange Backend Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      console.log(`📡 API Endpoints available at: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Fatal Server Initialization Error:', error);
    process.exit(1);
  }
};

startServer();
