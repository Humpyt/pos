# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server on http://localhost:3006 (or available port)
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint code quality checks

### Database Operations (SQLite)
- `npm run db:init` - Initialize database with schema and sample data (creates tables, imports products, creates default branches and admin user)
- `npm run db:push` - Push schema changes to SQLite database without migrations
- `npm run db:migrate` - Create and run database migrations
- `npm run db:studio` - Open Prisma Studio for database management
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed database with sample data

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM (migrated from PostgreSQL for simplicity)
- **UI**: Radix UI components, Lucide icons, Recharts for charts
- **Forms**: React Hook Form with Zod validation
- **Database Driver**: better-sqlite3 for optimal performance

### Application Structure
This is a comprehensive Point of Sale (POS) system for retail stores with multi-branch support.

**Core Business Domains:**
- **Sales Management**: POS interface, multiple payment methods, receipt generation
- **Inventory Management**: Product catalog, batch tracking, stock monitoring, multi-branch control
- **Analytics & Reporting**: Sales trends, branch comparison, financial reports
- **Customer Management**: CRM with purchase history
- **Accounting**: Expense tracking, revenue analysis

### Key Database Relationships
- **Multi-Branch Architecture**: Branches have separate inventory, staff, and sales records
- **Product Variations**: Products can have multiple variations (sizes, packaging) with different prices
- **Batch Tracking**: Products tracked by batch numbers with expiry dates
- **Inventory Management**: Real-time stock levels per branch with low stock alerts

### Important Implementation Details

**Database Schema:**
- Uses SQLite with Prisma ORM (migrated from PostgreSQL for zero-configuration setup)
- Supports product variations and batch tracking
- Multi-branch inventory with unique constraints on [branchId, productId, variationId, batchId]
- Comprehensive sales and payment tracking
- Database file location: `prisma/dev.db` (single file database)
- Type-safe data handling with proper SQLite compatibility

**Authentication & Users:**
- Role-based access: ADMIN, MANAGER, CASHIER, INVENTORY_MANAGER
- Users assigned to specific branches
- Default admin credentials: admin@pos-store.com / admin123

**Product Management:**
- Products organized by categories
- Support for multiple variations (e.g., 500ml, 1L, 2L)
- Barcode support for quick POS scanning
- Batch tracking with expiry dates

**Sample Data:**
The system comes pre-configured with:
- 3 branches (Nairobi, Mombasa, Kisumu)
- 59 products across categories (Beverages, Water, Energy Drinks, Juices, Dairy)
- Realistic Kenyan market pricing (KES)
- Default admin user: admin@pos-store.com
- Product variations and inventory records for each branch
- Complete category hierarchy

### File Organization
- `src/app/` - Next.js App Router pages (each major feature has its own page)
- `src/components/` - React components organized by feature domain
- `src/lib/` - Utility functions, Prisma client, and configurations
- `prisma/schema.prisma` - Complete database schema (SQLite configuration)
- `prisma/dev.db` - SQLite database file (auto-created)
- `scripts/init-db.ts` - Database initialization script
- `products.csv` - Sample product data for seeding

### Development Notes
- **No external database required** - SQLite file-based database
- **Zero configuration setup** - Database created automatically on first run
- **Portable database** - Single file backup/restore (copy `prisma/dev.db`)
- **Server runs on available port** - Typically http://localhost:3006
- All major features are fully functional including responsive mobile design
- Uses TypeScript throughout for type safety
- Navigation enhanced with debug logging for development
- Database compatibility: All data types properly handled for SQLite
- Environment variables: NEXTAUTH_URL, NEXTAUTH_SECRET (DATABASE_URL no longer needed)

## Recent Improvements & Status

### ✅ Navigation System Enhancements
- **Fixed sidebar navigation** - All menu items are now fully clickable and functional
- **Enhanced cursor styling** - Added visual feedback for better user experience
- **Debug logging added** - Console logs for navigation debugging in development
- **Verified all routes** - All 9 navigation items confirmed working (Dashboard, POS, Products, Inventory, Customers, Sales, Analytics, Accounting, Settings)

### ✅ Database Migration (PostgreSQL → SQLite)
- **Zero-configuration setup** - No external database server required
- **Single file database** - `prisma/dev.db` for easy backup/portability
- **Better performance** - Optimized for single-store POS operations
- **Full compatibility** - All existing features preserved
- **Type-safe data handling** - Proper SQLite data type conversions

### ✅ Data Import Success
- **59 products imported** across 5 categories
- **3 branches created** with complete inventory setup
- **Product variations** with pricing and stock management
- **Default user setup** - admin@pos-store.com ready for testing

## Quick Start Guide

### 1. Start Development Server
```bash
cd pos-system
npm run dev
```
Server will start on an available port (typically http://localhost:3006)

### 2. Initialize Database (if needed)
```bash
npm run db:init
```
This creates the database and imports sample data

### 3. Access the Application
- Open browser to the development server URL
- No login required for initial testing
- All navigation items should work properly

### Testing the System
After setup, test the following features:
1. **Navigation** - Click all sidebar menu items to verify proper routing
2. **POS checkout process** - Test with different payment methods
3. **Product management** - Browse and search products
4. **Inventory management** - Check stock levels and variations
5. **Multi-branch operations** - Switch between branch views
6. **Analytics and reporting** - View sales trends and reports
7. **Customer management** - Test customer creation and history
8. **Accounting features** - Explore expense tracking