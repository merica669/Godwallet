// server.js - The Heart of Godwallet Backend
// Where dreams connect to databases and blockchains shake hands

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const domainRoutes = require('./routes/domains');
const listingRoutes = require('./routes/listings');
const leaseRoutes = require('./routes/leases');
const userRoutes = require('./routes/users');
const verificationRoutes = require('./routes/verification');
const nftRoutes = require('./routes/nft');
const aiRoutes = require('./routes/ai');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined')); // Logging

// Rate limiting - prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Stricter rate limit for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 AI calls per hour
  message: 'AI analysis limit reached. Please upgrade to Pro for more.'
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Godwallet backend is alive and dreaming!',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/leases', authenticate, leaseRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/verification', authenticate, verificationRoutes);
app.use('/api/nft', authenticate, nftRoutes);
app.use('/api/ai', authenticate, aiLimiter, aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: 'This path leads nowhere in the Godwallet universe 🌌'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Database connection
const { sequelize } = require('./models');

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✨ Database connection established successfully!');

    // Sync models (use { force: false } in production)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('🎭 Database models synchronized!');

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║                                        ║
║        🌟 Godwallet Backend 🌟        ║
║                                        ║
║   Where domains find their dreams...   ║
║                                        ║
║   Server: http://localhost:${PORT}     ║
║   Environment: ${process.env.NODE_ENV || 'development'}           ║
║                                        ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🌙 SIGTERM received, shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

startServer();

module.exports = app;