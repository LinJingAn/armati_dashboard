import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export interface DatabaseStatus {
  connected: boolean;
  latencyMs?: number;
  tables?: string[];
  error?: string;
  hint?: string;
}

export async function checkDatabaseStatus(): Promise<DatabaseStatus> {
  const start = Date.now();
  try {
    const result = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    const latencyMs = Date.now() - start;
    const tables = result.map((r) => r.tablename);
    return { connected: true, latencyMs, tables };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    let hint = 'Check your DATABASE_URL in .env';

    if (message.includes('ECONNREFUSED') || message.includes('connect')) {
      hint = 'PostgreSQL is not running. Start it with: pg_ctl start  (or via Services)';
    } else if (message.includes('password') || message.includes('authentication')) {
      hint = 'Invalid credentials. Check DB username/password in DATABASE_URL';
    } else if (message.includes('does not exist') || message.includes('database')) {
      hint = `Database not found. Create it with: createdb safetyglasses`;
    } else if (message.includes('migration')) {
      hint = 'Schema not applied. Run: npm run db:migrate';
    }

    return { connected: false, error: message, hint };
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;
