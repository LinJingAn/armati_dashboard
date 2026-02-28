import { execSync } from 'child_process';
import { checkDatabaseStatus } from '../config/database.js';
import prisma from '../config/database.js';

const args = process.argv.slice(2);
const withSeed = args.includes('--seed');
const force = args.includes('--force');

async function resetDatabase(): Promise<void> {
  console.log('\n========================================');
  console.log('  DATABASE RESET');
  console.log('========================================\n');

  if (!force) {
    console.log('WARNING: This will drop all tables and re-apply migrations.');
    console.log('Run with --force to skip this prompt.\n');
    process.exit(0);
  }

  console.log('Checking database connection...');
  const status = await checkDatabaseStatus();

  if (!status.connected) {
    console.error(`\nCannot connect to database: ${status.error}`);
    console.error(`Hint: ${status.hint}\n`);
    process.exit(1);
  }

  console.log(`Connected  (${status.latencyMs}ms)\n`);

  try {
    console.log('Dropping all application tables...');
    await prisma.$executeRawUnsafe(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT tablename FROM pg_tables
          WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
        ) LOOP
          EXECUTE 'DROP TABLE IF EXISTS "' || r.tablename || '" CASCADE';
        END LOOP;
      END $$;
    `);
    console.log('All tables dropped.\n');

    console.log('Dropping all custom enum types...');
    await prisma.$executeRawUnsafe(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT t.typname
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typtype = 'e' AND n.nspname = 'public'
        ) LOOP
          EXECUTE 'DROP TYPE IF EXISTS "' || r.typname || '" CASCADE';
        END LOOP;
      END $$;
    `);
    console.log('All enum types dropped.\n');

    console.log('Deleting migration history...');
    await prisma.$executeRawUnsafe(`DELETE FROM "_prisma_migrations"`);
    console.log('Migration history cleared.\n');

    await prisma.$disconnect();

    console.log('Applying migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('\nMigrations applied.\n');

    if (withSeed) {
      console.log('Seeding database...');
      execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
      console.log('\nDatabase seeded.\n');
    }

    console.log('========================================');
    console.log('  Database reset complete!');
    console.log('========================================\n');
  } catch (err) {
    console.error('\nReset failed:', err instanceof Error ? err.message : err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

resetDatabase();
