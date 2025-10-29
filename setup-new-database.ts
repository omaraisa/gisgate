import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// New database configuration
const NEW_DB_CONFIG = {
  host: '204.12.205.110',
  port: 5432,
  user: 'postgres',
  password: 'dkj87232!$JF*#JVNa#$#*432kv',
  database: 'gisgate'
};

// Create DATABASE_URL for new server
const newDatabaseUrl = `postgresql://${NEW_DB_CONFIG.user}:${encodeURIComponent(NEW_DB_CONFIG.password)}@${NEW_DB_CONFIG.host}:${NEW_DB_CONFIG.port}/${NEW_DB_CONFIG.database}`;

console.log('🚀 Setting up database on new server...');
console.log(`📍 Server: ${NEW_DB_CONFIG.host}:${NEW_DB_CONFIG.port}`);
console.log(`📊 Database: ${NEW_DB_CONFIG.database}`);
console.log('');

async function setupDatabase() {
  try {
    // Step 1: Create database if it doesn't exist
    console.log('📦 Step 1: Creating database...');
    const createDbCommand = `psql -h ${NEW_DB_CONFIG.host} -p ${NEW_DB_CONFIG.port} -U ${NEW_DB_CONFIG.user} -c "CREATE DATABASE ${NEW_DB_CONFIG.database} WITH OWNER = ${NEW_DB_CONFIG.user} ENCODING = 'UTF8';"`;

    try {
      execSync(createDbCommand, {
        env: { ...process.env, PGPASSWORD: NEW_DB_CONFIG.password },
        stdio: 'inherit'
      });
      console.log(`✅ Database '${NEW_DB_CONFIG.database}' created successfully`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log(`ℹ️  Database '${NEW_DB_CONFIG.database}' already exists`);
      } else {
        throw error;
      }
    }

    // Step 2: Temporarily update DATABASE_URL
    console.log('\n🔧 Step 2: Setting up database connection...');
    const envPath = path.join(process.cwd(), '.env');
    const envBackupPath = path.join(process.cwd(), '.env.backup');

    // Backup current .env
    if (fs.existsSync(envPath)) {
      fs.copyFileSync(envPath, envBackupPath);
      console.log('📋 Backed up current .env file');
    }

    // Read current .env content
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Update DATABASE_URL
    const databaseUrlRegex = /^DATABASE_URL=.*$/m;
    let newEnvContent = envContent.replace(databaseUrlRegex, `DATABASE_URL="${newDatabaseUrl}"`);

    // If DATABASE_URL doesn't exist, add it
    if (!databaseUrlRegex.test(envContent)) {
      newEnvContent = envContent + `\nDATABASE_URL="${newDatabaseUrl}"\n`;
    }

    fs.writeFileSync(envPath, newEnvContent);
    console.log('✅ Updated DATABASE_URL for new server');

    // Step 3: Run Prisma migrations
    console.log('\n🗃️  Step 3: Applying database schema...');
    try {
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Database schema applied successfully');
    } catch {
      console.log('⚠️  Migrations failed, trying to push schema directly...');
      execSync('npx prisma db push', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Database schema pushed successfully');
    }

    // Step 4: Generate Prisma client
    console.log('\n🔧 Step 4: Generating Prisma client...');
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Prisma client generated');

    // Step 5: Restore original .env
    console.log('\n🔄 Step 5: Restoring original configuration...');
    if (fs.existsSync(envBackupPath)) {
      fs.copyFileSync(envBackupPath, envPath);
      fs.unlinkSync(envBackupPath);
      console.log('✅ Restored original .env file');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log(`📍 New database is ready at: ${NEW_DB_CONFIG.host}:${NEW_DB_CONFIG.port}/${NEW_DB_CONFIG.database}`);

  } catch (error) {
    console.error('❌ Database setup failed:', error);

    // Restore .env on error
    const envBackupPath = path.join(process.cwd(), '.env.backup');
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envBackupPath)) {
      fs.copyFileSync(envBackupPath, envPath);
      fs.unlinkSync(envBackupPath);
      console.log('🔄 Restored original .env file after error');
    }

    process.exit(1);
  }
}

// Run the setup
setupDatabase();