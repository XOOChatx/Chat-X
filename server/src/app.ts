import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cookieParser from 'cookie-parser';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync } from 'fs';
import { executablePath as getChromeExec } from 'puppeteer';
import { config } from './config/env';
import { corsOptions, ALLOWED_ORIGINS } from './config/cors.config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initializeNodePersistStorage } from './utils/node-persist-init';
import { initDb } from './database/initDb.service';
import { seedSuperAdmin } from './database/seed';
import { autoReconnectOnStartup } from './services/startup-reconnect.service';
import { websocketService } from './services/websocket.service';
import { getHealthStatus, startHealthChecks } from './services/health.service';

// Routes
import waRoutes from './routes/wa';
import waSessionRoutes from './routes/wa-sessions';
import tgRoutes from './routes/tg';
import sessionsRoutes from './routes/sessions';
import accountManagementRoutes from './routes/account-management-temp';
import chatsRoutes from './routes/chats';
import uploadRoutes from './routes/upload';
import waMessageMonitorRoutes from './routes/wa-message-monitor';
import waMessageOptimizerRoutes from './routes/wa-message-optimizer';
import waSessionMonitorRoutes from './routes/wa-session-monitor';
import debugClientsRoutes from './routes/debug-clients';
import websocketDebugRoutes from './routes/websocket-debug';
import authRoutes from './routes/auth';
import planRoutes from './routes/plan';
import userRoutes from './routes/user';
import workspaceRoutes from './routes/workspace';

// ====================================================
// 🧩 Chrome Path Setup (for Puppeteer / OpenWA)
// ====================================================
if (!process.env.CHROME_PATH) {
  try {
    if (process.env.PUPPETEER_EXECUTABLE_PATH && existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
      process.env.CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH;
      console.log('✅ Using Railway Chrome path:', process.env.CHROME_PATH);
    } else {
      const chromePath = getChromeExec();
      if (existsSync(chromePath)) {
        process.env.CHROME_PATH = chromePath;
        console.log('✅ CHROME_PATH set:', chromePath);
      } else {
        console.warn('⚠️ Chrome not found — using Puppeteer default');
      }
    }
  } catch (e) {
    console.warn('⚠️ Chrome path detection failed:', e);
  }
}

// ====================================================
// 🚀 Express App Setup
// ====================================================
const app = express();
app.use(cookieParser());

// ✅ Global CORS — handles ALL routes, all origins safely
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ✅ Always attach a request ID header
app.use((req, res, next) => {
  (req as any).requestId = uuidv4();
  res.setHeader('X-Request-Id', (req as any).requestId);
  next();
});

// ✅ Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Serve static files with CORS enabled
const mediaDir = path.join(process.cwd(), 'public', 'media');
app.use('/media', cors(corsOptions), express.static(mediaDir));
app.use('/api/media', cors(corsOptions), express.static(mediaDir));

// ====================================================
// 🔌 Socket.IO Setup (shared CORS config)
// ====================================================
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed = ALLOWED_ORIGINS.includes(origin);
      console.log('🔌 WebSocket CORS check:', origin, '=>', allowed);
      cb(null, allowed);
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  path: '/socket.io',
  allowEIO3: true,
});

io.on('connection', (socket) => {
  console.log('⚡ WebSocket connected:', socket.id);
  socket.on('disconnect', (reason) => console.log('❌ WS disconnected:', socket.id, reason));
  socket.on('error', (err) => console.error('⚠️ WS error:', err));
});
app.set('io', io);
websocketService.setSocketIO(io);

// ====================================================
// 🧠 Init Services
// ====================================================
(async () => {
  try {
    console.log('🔄 Initializing storage & DB...');
    await initializeNodePersistStorage({ verbose: true });
    await initDb();
    await seedSuperAdmin();
    startHealthChecks();
    console.log('✅ Startup initialization complete');
  } catch (e) {
    console.error('❌ Startup error:', e);
  }
})();

// ====================================================
// 🩺 Health Endpoint
// ====================================================
app.get('/health', (req, res) => {
  res.json(getHealthStatus());
});

// ====================================================
// 🧩 API Routes
// ====================================================
app.use('/workspace', workspaceRoutes);
app.use('/user', userRoutes);
app.use('/plan', planRoutes);
app.use('/auth', authRoutes);
app.use('/wa', waRoutes);
app.use('/wa', waSessionRoutes);
app.use('/tg', tgRoutes);
app.use('/sessions', sessionsRoutes);
app.use('/account-management', accountManagementRoutes);
app.use('/chats', chatsRoutes);
app.use('/upload', uploadRoutes);
app.use('/wa/message-monitor', waMessageMonitorRoutes);
app.use('/wa/message-optimizer', waMessageOptimizerRoutes);
app.use('/wa/session-monitor', waSessionMonitorRoutes);
app.use('/debug/clients', debugClientsRoutes);
app.use('/debug/websocket', websocketDebugRoutes);

// ====================================================
// 🧱 Error Handling
// ====================================================
app.use(notFoundHandler);
app.use(errorHandler);

// ====================================================
// 🚀 Start Server
// ====================================================
server.listen(config.PORT, async () => {
  console.log(`🚀 Backend running on port ${config.PORT}`);
  console.log(`🌍 Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`🔌 WebSocket path: /socket.io`);
  console.log(`🔐 Admin token: ${config.ADMIN_TOKEN?.substring(0, 8)}...`);
  console.log(`📊 Health: /health`);

  // Auto-reconnect saved WhatsApp sessions
  setTimeout(async () => {
    try {
      console.log('🔁 Auto reconnecting WhatsApp sessions...');
      await autoReconnectOnStartup();
      console.log('✅ Auto reconnect complete');
    } catch (err) {
      console.error('❌ Auto reconnect failed:', err);
    }
  }, 3000);
});

// ====================================================
// 🧹 Graceful Shutdown
// ====================================================
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection:', reason);
  process.exit(1);
});

export default app;
