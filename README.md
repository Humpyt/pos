# Store POS System

A comprehensive Point of Sale (POS) system for managing product sales, inventory, and accounting across multiple branches. Built with Next.js, TypeScript, and PostgreSQL.

## Features

### 🛍️ Sales Management
- Point of Sale (POS) interface for cashiers
- Multiple payment methods (Cash, Card, Mobile Money, Bank Transfer, Credit)
- Real-time sales tracking
- Customer management
- Receipt generation

### 📦 Inventory Management
- Product catalog with variations and multiple prices
- Batch tracking with expiry dates
- Real-time stock monitoring
- Low stock alerts
- Multi-branch inventory control
- Stock transfer between branches

### 📊 Analytics & Reporting
- Daily, weekly, monthly, and quarterly reports
- Sales trends and graphs
- Branch comparison analytics
- Top products analysis
- Customer insights
- Export functionality (PDF, Excel)

### 🏪 Multi-Branch Support
- Manage multiple store locations
- Individual and consolidated reporting
- Branch-specific inventory
- Staff management per branch

### 💰 Accounting Features
- Expense tracking
- Revenue and profit analysis
- Tax calculations
- Financial reporting

## Technology Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **UI Components**: Radix UI, Lucide Icons
- **Charts**: Recharts
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pos-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your database configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/pos_system"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   NODE_ENV="development"
   ```

4. **Set up the database**
   ```bash
   # Create the database in PostgreSQL
   createdb pos_system

   # Run database initialization
   npm run db:init
   ```

   This will:
   - Create all necessary tables
   - Import products from `products.csv`
   - Create default branches (Nairobi, Mombasa, Kisumu)
   - Create admin user (admin@pos-store.com / admin123)

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Scripts

```bash
# Initialize database with sample data
npm run db:init

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Open Prisma Studio for database management
npm run db:studio

# Generate Prisma client
npm run db:generate

# Seed database with sample data
npm run db:seed
```

## Project Structure

```
pos-system/
├── src/
│   ├── app/                    # Next.js app router pages
│   ├── components/             # React components
│   │   ├── layout/            # Layout components
│   │   ├── ui/                # Reusable UI components
│   │   ├── cashier/           # POS/Cashier components
│   │   ├── products/          # Product management
│   │   ├── inventory/         # Inventory management
│   │   ├── reports/           # Reporting components
│   │   └── analytics/         # Analytics dashboards
│   ├── lib/                   # Utility functions and configurations
│   │   ├── prisma.ts         # Prisma client setup
│   │   ├── utils.ts          # Helper functions
│   │   └── import.ts         # Data import utilities
│   ├── types/                 # TypeScript type definitions
│   └── hooks/                 # Custom React hooks
├── prisma/
│   └── schema.prisma          # Database schema
├── scripts/
│   └── init-db.ts            # Database initialization script
├── products.csv              # Sample product data
└── public/                   # Static assets
```

## Default Credentials

- **Admin User**: `admin@pos-store.com` / `admin123`

## Product Categories

The system comes pre-configured with these main categories:

- **Beverages**: Soft drinks, juices, energy drinks
- **Water**: Mineral water, purified water
- **Energy Drinks**: Functional beverages
- **Juices**: Fresh and packaged juices
- **Dairy**: Milk, yogurt, dairy alternatives

## Key Features Explained

### Product Management
- **Variations**: Products can have multiple variations (e.g., 500ml, 1L, 2L)
- **Pricing**: Different prices for different variations
- **Batch Tracking**: Track products by batch numbers and expiry dates
- **Categories**: Dynamic product categorization

### Inventory Control
- **Real-time Stock**: Live inventory updates
- **Low Stock Alerts**: Automatic notifications when stock is low
- **Expiry Tracking**: Monitor products approaching expiry
- **Multi-branch**: Separate inventory per branch

### Sales Processing
- **Quick Checkout**: Fast POS interface for cashiers
- **Multiple Payments**: Support for various payment methods
- **Customer Management**: Add and manage customers
- **Receipt Generation**: Digital and printed receipts

### Reporting & Analytics
- **Sales Reports**: Daily, weekly, monthly reports
- **Product Performance**: Top-selling products analysis
- **Branch Comparison**: Compare performance across branches
- **Financial Reports**: Revenue, profit, and expense tracking

## Development

### Adding New Features

1. **Database Changes**: Update `prisma/schema.prisma`
2. **Run Migration**: `npm run db:migrate`
3. **Create Components**: Add to appropriate folder in `src/components/`
4. **Update Types**: Add new types to `src/types/index.ts`
5. **Add API Routes**: Create endpoints in `src/app/api/`

### Code Style

- Uses TypeScript for type safety
- Tailwind CSS for styling
- ESLint for code quality
- Conventional commits for git messages

## Deployment

### Environment Setup

1. Set production environment variables
2. Configure PostgreSQL database
3. Build the application: `npm run build`
4. Start production server: `npm start`

### Database Setup in Production

1. Create production database
2. Run migrations: `npx prisma migrate deploy`
3. Seed initial data if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support and questions:
- Check the documentation
- Review the code comments
- Create an issue for bugs or feature requests

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This is a comprehensive POS system designed for retail stores. Ensure you have the proper database setup and configuration before running the application.
