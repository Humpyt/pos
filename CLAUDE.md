# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint code quality checks

### Database Operations
- `npm run db:init` - Initialize database with schema and sample data (creates tables, imports products, creates default branches and admin user)
- `npm run db:push` - Push schema changes to database without migrations
- `npm run db:migrate` - Create and run database migrations
- `npm run db:studio` - Open Prisma Studio for database management
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed database with sample data

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **UI**: Radix UI components, Lucide icons, Recharts for charts
- **Forms**: React Hook Form with Zod validation

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
- Uses PostgreSQL with Prisma ORM
- Supports product variations and batch tracking
- Multi-branch inventory with unique constraints on [branchId, productId, variationId, batchId]
- Comprehensive sales and payment tracking

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
- 67 products across categories (Beverages, Water, Energy Drinks, Juices, Dairy)
- Realistic Kenyan market pricing (KES)

### File Organization
- `src/app/` - Next.js App Router pages (each major feature has its own page)
- `src/components/` - React components organized by feature domain
- `src/lib/` - Utility functions, Prisma client, and configurations
- `prisma/schema.prisma` - Complete database schema
- `scripts/init-db.ts` - Database initialization script
- `products.csv` - Sample product data for seeding

### Development Notes
- Environment variables required: DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET
- Database must be created before running `npm run db:init`
- All major features are fully functional including responsive mobile design
- Uses TypeScript throughout for type safety

### Testing the System
After setup, log in with default credentials and test:
1. POS checkout process with different payment methods
2. Product and inventory management
3. Multi-branch operations
4. Analytics and reporting features
5. Customer management and sales history