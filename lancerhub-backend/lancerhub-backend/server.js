const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const errorHandler = require('./middleware/errorHandler');

// ── Route imports ────────────────────────────
const authRoutes     = require('./routes/auth');
const userRoutes     = require('./routes/users');
const jobRoutes      = require('./routes/jobs');
const proposalRoutes = require('./routes/proposals');
const messageRoutes  = require('./routes/messages');
const invoiceRoutes  = require('./routes/invoices');
const reviewRoutes   = require('./routes/reviews');
const paymentRoutes  = require('./routes/payments');
const uploadRoutes   = require('./routes/uploads');

// ── Init ─────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] },
});

connectDB();
initSocket(io);

// ── Middleware ────────────────────────────────
app.use(cors({ origin: '*', credentials: false }));
app.use(morgan('dev'));

// Stripe webhook needs raw body — mount BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/jobs',      jobRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/messages',  messageRoutes);
app.use('/api/invoices',  invoiceRoutes);
app.use('/api/reviews',   reviewRoutes);
app.use('/api/payments',  paymentRoutes);
app.use('/api/uploads',   uploadRoutes);

// ── Health check ──────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LancerHub API is running 🚀' });
});

// ── 404 handler ───────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ──────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 LancerHub server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = { app, io };
