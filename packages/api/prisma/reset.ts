#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

/**
 * Database Reset Script
 * 
 * This script performs a complete database reset including:
 * 1. Dropping all data and schema
 * 2. Re-running all migrations
 * 3. Seeding with initial data
 * 
 * WARNING: This will permanently delete all data in the database!
 */

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🔄 Starting database reset...');
  console.log('⚠️  WARNING: This will permanently delete ALL data!');
  
  try {
    // Step 1: Drop all tables (manual cleanup)
    console.log('🗑️  Dropping all existing tables...');
    await dropAllTables();
    
    // Step 2: Push schema to recreate database structure
    console.log('📊 Pushing schema to recreate database structure...');
    execSync('npx prisma db push --force-reset', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Step 3: Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Step 4: Seed database
    console.log('🌱 Seeding database with initial data...');
    execSync('npm run prisma:seed', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Database reset completed successfully!');
    console.log('📈 Database is now ready with fresh schema and seed data.');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function dropAllTables() {
  try {
    // Get all table names
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE '_prisma%'
    `;
    
    // Get all custom types (enums)
    const types = await prisma.$queryRaw<Array<{ typname: string }>>`
      SELECT typname FROM pg_type 
      WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND typtype = 'e'
    `;
    
    console.log(`📝 Found ${tables.length} tables and ${types.length} custom types to drop.`);
    
    // Disable foreign key checks temporarily
    await prisma.$executeRawUnsafe('SET session_replication_role = replica;');
    
    // Drop all tables
    if (tables.length > 0) {
      for (const table of tables) {
        console.log(`  ↳ Dropping table: ${table.tablename}`);
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE;`);
      }
    }
    
    // Drop all custom types (enums)
    if (types.length > 0) {
      for (const type of types) {
        console.log(`  ↳ Dropping type: ${type.typname}`);
        await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "${type.typname}" CASCADE;`);
      }
    }
    
    // Re-enable foreign key checks
    await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
    
    // Drop Prisma migration table to force fresh migrations
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;');
    
    console.log('✅ All tables and types dropped successfully.');
    
  } catch (error) {
    console.error('❌ Error dropping tables and types:', error);
    throw error;
  }
}

// Run the reset if this script is executed directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('🎉 Reset operation finished.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error during reset:', error);
      process.exit(1);
    });
}

export { resetDatabase };