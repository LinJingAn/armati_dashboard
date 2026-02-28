import { checkDatabaseStatus } from '../config/database.js';
import prisma from '../config/database.js';

async function main(): Promise<void> {
  console.log('\n========================================');
  console.log('  DATABASE STATUS CHECK');
  console.log('========================================\n');

  console.log(`DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':****@') ?? '(not set)'}`);
  console.log();

  const status = await checkDatabaseStatus();

  if (status.connected) {
    console.log(`Status    : CONNECTED`);
    console.log(`Latency   : ${status.latencyMs}ms`);
    console.log(`Tables    : ${status.tables?.length ?? 0} found`);

    if (status.tables && status.tables.length > 0) {
      status.tables.forEach((t) => console.log(`            - ${t}`));
    } else {
      console.log('\nNo tables found. Run migrations: npm run db:migrate');
    }

    const expectedTables = ['companies', 'users', 'employees', 'frames', 'orders', 'support_tickets'];
    const missing = expectedTables.filter((t) => !status.tables?.includes(t));

    if (missing.length > 0) {
      console.log(`\nMissing tables: ${missing.join(', ')}`);
      console.log('Run: npm run db:migrate');
    } else {
      console.log('\nAll required tables are present.');
    }
  } else {
    console.log(`Status    : DISCONNECTED`);
    console.log(`Error     : ${status.error}`);
    console.log(`\nHint      : ${status.hint}`);
  }

  console.log('\n========================================\n');

  await prisma.$disconnect();
  process.exit(status.connected ? 0 : 1);
}

main();
