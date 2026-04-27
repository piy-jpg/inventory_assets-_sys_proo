const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

// Import routes
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/users');
const inventoryRoutes = require('../routes/inventory');
const assetRoutes = require('../routes/assets');
const transactionRoutes = require('../routes/transactions');
const supplierRoutes = require('../routes/suppliers');
const customerRoutes = require('../routes/customers');
const alertRoutes = require('../routes/alerts');
const expenseRoutes = require('../routes/expenses');
const purchaseRoutes = require('../routes/purchases');
const salesRoutes = require('../routes/sales');
const stockAdjustmentRoutes = require('../routes/stockAdjustments');
const stockTransferRoutes = require('../routes/stockTransfers');
const warehouseRoutes = require('../routes/warehouses');
const metadataRoutes = require('../routes/metadata');
const paymentAccountRoutes = require('../routes/paymentAccounts');
const analyticsRoutes = require('../routes/analytics');
const aiRoutes = require('../routes/ai');
const demoRoutes = require('../routes/demo');

const connectDB = require('../config/database');
const errorHandler = require('../middleware/errorHandler');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://smart-inventory-system-ten.vercel.app',
  'https://smart-inventory-system.vercel.app',
  'https://smart-inventory-frontend.vercel.app',
  'http://localhost:3000',
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.vercel.app') && hostname.startsWith('smart-inventory-system');
  } catch (error) {
    return false;
  }
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

// Socket.IO setup
const io = new Server(server, {
  cors: {
    ...corsOptions,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Serve static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/stock-adjustments', stockAdjustmentRoutes);
app.use('/api/stock-transfers', stockTransferRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/metadata', metadataRoutes);
app.use('/api/payment-accounts', paymentAccountRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/demo', demoRoutes);

const apiStatusPayload = () => ({
  success: true,
  message: 'Smart Inventory Management System API',
  version: '1.0.0',
  status: 'running',
  timestamp: new Date().toISOString(),
});

app.get('/', (req, res) => {
  res.status(200).json(apiStatusPayload());
});

app.get('/api', (req, res) => {
  res.status(200).json(apiStatusPayload());
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room: ${room}`);
  });

  socket.on('leave-room', (room) => {
    socket.leave(room);
    console.log(`Client ${socket.id} left room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.set('io', io);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

let databaseReady = false;

const ensureDatabase = async () => {
  if (!databaseReady) {
    await connectDB();
    databaseReady = true;
  }
};

// Export for Vercel
module.exports = async (req, res) => {
  await ensureDatabase();
  app(req, res);
};

// For local development
if (require.main === module) {
  ensureDatabase().then(() => {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}
