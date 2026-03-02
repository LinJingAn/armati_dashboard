import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import prisma, { checkDatabaseStatus } from './config/database.js';
import passport from './config/passport.js';

import authRoutes from './modules/auth/auth.routes.js';
import companyRoutes from './modules/company/company.routes.js';
import userRoutes from './modules/user/user.routes.js';
import employeeRoutes from './modules/employee/employee.routes.js';
import frameRoutes from './modules/frame/frame.routes.js';
import uploadRoutes from './modules/upload/upload.routes.js';
import orderRoutes from './modules/order/order.routes.js';
import supportTicketRoutes from './modules/support-ticket/supportTicket.routes.js';
import reviewRoutes from './modules/review/review.routes.js';
import userOrderRoutes from './modules/user-order/user-order.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));
app.use(compression());

const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use('/uploads', express.static(path.join(__dirname, '..', env.UPLOAD_DIR)));
app.use(express.static(path.join(__dirname, '..', env.FRONTEND_DIR)));

app.get('/health', async (_req, res) => {
  const db = await checkDatabaseStatus();
  res.status(db.connected ? 200 : 503).json({
    status: db.connected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: {
      connected: db.connected,
      latencyMs: db.latencyMs,
      tables: db.tables?.length,
      ...(db.error ? { error: db.error } : {}),
    },
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, '..', env.FRONTEND_DIR, 'index.html'));
})

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/frames', frameRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/support-tickets', supportTicketRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/user-orders', userOrderRoutes);

app.use(errorHandler);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const EXPECTED_TABLES = ['companies', 'users', 'employees', 'frames', 'orders', 'support_tickets', 'reviews', 'user_orders', 'user_order_items'];

function printDatabaseStatus(dbStatus: Awaited<ReturnType<typeof checkDatabaseStatus>>): void {
  const maskedUrl = (env.DATABASE_URL || '(not set)').replace(/:([^:@]+)@/, ':****@');

  console.log('\n  -- Database Status ---------------------------');
  console.log(`  URL        : ${maskedUrl}`);

  if (!dbStatus.connected) {
    console.log(`  Status     : DISCONNECTED`);
    console.log(`  Error      : ${dbStatus.error}`);
    console.log(`  Hint       : ${dbStatus.hint}`);
    console.log('  ----------------------------------------------');
    return;
  }

  console.log(`  Status     : CONNECTED`);
  console.log(`  Latency    : ${dbStatus.latencyMs}ms`);
  console.log(`  Tables     : ${dbStatus.tables?.length ?? 0} found`);
  console.log('');

  for (const table of EXPECTED_TABLES) {
    const exists = dbStatus.tables?.includes(table);
    console.log(`    ${exists ? '[OK]' : '[MISSING]'} ${table}`);
  }

  const extra = dbStatus.tables?.filter(
    (t) => !EXPECTED_TABLES.includes(t) && t !== '_prisma_migrations',
  ) ?? [];
  if (extra.length > 0) {
    console.log(`\n  Extra tables: ${extra.join(', ')}`);
  }

  console.log('  ----------------------------------------------');
}

const startServer = async () => {
  console.log('\n==============================================');
  console.log('       SAFETY GLASSES API - STARTING');
  console.log('==============================================');
  console.log(`  Node       : ${process.version}`);
  console.log(`  Env        : ${env.NODE_ENV}`);

  console.log('\n[1/2] Checking database...');
  const dbStatus = await checkDatabaseStatus();
  printDatabaseStatus(dbStatus);

  if (!dbStatus.connected) {
    console.error('\n  [FAIL] Cannot connect to database. Server will not start.');
    console.error('  Run "npm run db:check" for a full diagnosis.');
    console.error('  Run "npm run db:migrate" to apply schema migrations.\n');
    process.exit(1);
  }

  const missing = EXPECTED_TABLES.filter((t) => !dbStatus.tables?.includes(t));
  if (missing.length > 0) {
    console.error(`\n  [FAIL] Missing tables: ${missing.join(', ')}`);
    console.error('  Run "npm run db:migrate" to apply schema migrations.\n');
    process.exit(1);
  }

  console.log('\n[2/2] Starting HTTP server...');
  app.listen(env.PORT, () => {
    console.log(`  Listening  : http://localhost:${env.PORT}`);
    console.log(`  Health     : http://localhost:${env.PORT}/health`);
    console.log('\n==============================================\n');
  });
};

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
