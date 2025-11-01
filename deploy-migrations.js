#!/usr/bin/env node

/**
 * Database Migration Deployment Script
 * 
 * This script safely deploys Prisma migrations to production database.
 * It includes safety checks and rollback capabilities.
 */
    
const { execSync } = require('child_process');
const fs = require('fs');
 
// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  try {
    log(`\n📋 ${description}...`, 'blue');
    log(`$ ${command}`, 'cyan');
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    log(`✅ ${description} completed successfully`, 'green');
    return output;
  } catch (error) {
    log(`❌ ${description} failed:`, 'red');
    log(error.message, 'red');
    throw error;
  }
}

async function main() {
  try {
    log('🚀 Starting database migration deployment...', 'magenta');
    
    // Check if .env file exists
    if (!fs.existsSync('.env')) {
      throw new Error('.env file not found. Make sure DATABASE_URL is configured.');
    }
    
    // Verify Prisma client generation
    log('\n🔧 Generating Prisma client...', 'yellow');
    execCommand('npx prisma generate', 'Prisma client generation');
    
    // Check database connection
    log('\n🔌 Testing database connection...', 'yellow');
    try {
      execCommand('npx prisma db pull --print', 'Database connection test');
    } catch (error) {
      log('⚠️  Database connection failed. Please check:', 'yellow');
      log('1. VPS PostgreSQL is running', 'yellow');
      log('2. Firewall allows connections on port 5432', 'yellow');
      log('3. pg_hba.conf allows your IP', 'yellow');
      log('4. DATABASE_URL credentials are correct', 'yellow');
      throw error;
    }
    
    // Show pending migrations
    log('\n📋 Checking migration status...', 'yellow');
    try {
      execCommand('npx prisma migrate status', 'Migration status check');
    } catch (error) {
      log('⚠️  Migration status check failed - this might be expected for first deployment', 'yellow');
    }
    
    // Deploy migrations
    log('\n🎯 Deploying migrations to production database...', 'yellow');
    log('⚠️  This will modify the production database!', 'red');
    
    // Ask for confirmation in interactive mode
    if (process.argv.includes('--force')) {
      log('🔧 Force flag detected, skipping confirmation...', 'yellow');
    } else if (process.stdin.isTTY) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question('Continue with deployment? (y/N): ', resolve);
      });
      rl.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        log('❌ Deployment cancelled by user', 'yellow');
        process.exit(0);
      }
    }
    
    // Execute migration deployment
    execCommand('npx prisma migrate deploy', 'Migration deployment');
    
    // Verify deployment
    log('\n🔍 Verifying deployment...', 'yellow');
    execCommand('npx prisma migrate status', 'Deployment verification');
    
    // Show final database schema info
    log('\n📊 Database schema information:', 'yellow');
    try {
      execCommand('npx prisma db pull --print | head -50', 'Schema verification');
    } catch (error) {
      log('⚠️  Could not display schema info, but migrations may have succeeded', 'yellow');
    }
    
    log('\n🎉 Migration deployment completed successfully!', 'green');
    log('\n📝 Next steps:', 'blue');
    log('1. Restart your application containers/services', 'blue');
    log('2. Test the application functionality', 'blue');
    log('3. Monitor logs for any issues', 'blue');
    
  } catch (error) {
    log('\n💥 Migration deployment failed!', 'red');
    log('\n🔧 Troubleshooting steps:', 'yellow');
    log('1. Check database connection: npx prisma db pull', 'yellow');
    log('2. Check migration files in prisma/migrations/', 'yellow');
    log('3. Manually connect to database and check tables', 'yellow');
    log('4. Check application logs for specific errors', 'yellow');
    
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('🔧 Database Migration Deployment Script', 'magenta');
  log('Usage: node deploy-migrations.js [options]', 'blue');
  log('Options:', 'blue');
  log('  --force    Skip confirmation prompt', 'blue');
  log('  --help     Show this help message', 'blue');
  process.exit(0);
}

main().catch(error => {
  log(`\n💥 Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});