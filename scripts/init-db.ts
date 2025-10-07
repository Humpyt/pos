#!/usr/bin/env tsx

import { ProductImportService } from '../src/lib/import'
import { prisma } from '../src/lib/prisma'

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...')

    // Check if database is accessible
    console.log('📊 Checking database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Push schema to database
    console.log('🏗️  Creating database tables...')
    // Note: In production, you should use migrations instead of db push
    // For this demo, we'll use db push for simplicity
    const { execSync } = require('child_process')
    execSync('npx prisma db push', { stdio: 'inherit' })
    console.log('✅ Database tables created')

    // Initialize data
    console.log('📦 Importing initial data...')
    const result = await ProductImportService.initializeDatabase()

    console.log('🎉 Database initialization completed successfully!')
    console.log('\n📈 Initialization Summary:')
    console.log(`   - Branches created: ${result.branches}`)
    console.log(`   - Default user: ${result.user}`)
    console.log(`   - Products imported: ${result.products.success}`)
    console.log(`   - Import errors: ${result.products.errors}`)

    if (result.products.errorMessages.length > 0) {
      console.log('\n⚠️  Import warnings/errors:')
      result.products.errorMessages.forEach(msg => console.log(`   - ${msg}`))
    }

  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this script is executed directly
if (require.main === module) {
  initializeDatabase()
}

export { initializeDatabase }