const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Route handlers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const institutionRoutes = require('./routes/institutionRoutes');
const studentRoutes = require('./routes/studentRoutes');
const importRoutes = require('./routes/importRoutes');
const validationRoutes = require('./routes/validationRoutes');
const duplicateRoutes = require('./routes/duplicateRoutes');
const capacityRoutes = require('./routes/capacityRoutes');
const caseRoutes = require('./routes/caseRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const copilotRoutes = require('./routes/copilotRoutes');

const verificationController = require('./controllers/verificationController');

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Permit flexibility for frontend consumption & QR renders
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'https://edutrace.vercel.app',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true); // Allow during hackathon dev/demo
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later', code: 'RATE_LIMIT_EXCEEDED' },
});
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EduTrace Backend API',
    version: '1.0.0',
    mode: process.env.INTEGRATION_MODE || 'SIMULATED',
    timestamp: new Date().toISOString(),
  });
});

// Public verification endpoint (accessible by anyone scanning QR code)
app.get('/api/verify/:tokenRef', verificationController.verifyToken);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/import-jobs', importRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/duplicates', duplicateRoutes);
app.use('/api/capacity', capacityRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/verification-tokens', verificationRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/copilot', copilotRoutes);

// Catch-all 404 handler
app.use(notFoundHandler);

// Central error handler
app.use(errorHandler);

module.exports = app;
