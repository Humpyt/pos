# POS System Deployment & Setup Guide

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database server
- Git
- Modern web browser

### Step 1: Database Setup

1. **Install PostgreSQL** (if not already installed)
   - Windows: Download from [postgresql.org](https://postgresql.org/download/windows/)
   - Ubuntu: `sudo apt-get install postgresql postgresql-contrib`
   - macOS: `brew install postgresql`

2. **Create Database**
   ```sql
   -- Open PostgreSQL shell (psql)
   CREATE DATABASE pos_system;
   CREATE USER pos_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE pos_system TO pos_user;
   ```

### Step 2: Install Dependencies

1. **Navigate to project directory**
   ```bash
   cd pos-system
   ```

2. **Install missing dependencies**
   ```bash
   npm install
   npx npm install next@latest react@latest react-dom@latest
   npx npm install @types/node@latest @types/react@latest @types/react-dom@latest
   ```

3. **Install additional dependencies**
   ```bash
   npm install class-variance-authority @radix-ui/react-slot clsx tailwind-merge
   ```

### Step 3: Environment Configuration

1. **Copy environment file**
   ```bash
   copy .env.example .env
   ```

2. **Update database configuration**
   ```env
   DATABASE_URL="postgresql://pos_user:your_secure_password@localhost:5432/pos_system"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
   NODE_ENV="development"
   ```

### Step 4: Database Initialization

1. **Initialize Prisma**
   ```bash
   npx prisma generate
   ```

2. **Push database schema**
   ```bash
   npx prisma db push
   ```

3. **Initialize database with sample data**
   ```bash
   npm run db:seed
   ```

### Step 5: Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

## 🔐 Default Credentials

- **Email**: admin@pos-store.com
- **Password**: admin123

## 📱 Mobile Responsiveness

The POS system is fully responsive and works on:
- Desktop computers
- Tablets (iPad, Android tablets)
- Mobile phones (iOS, Android)

## 🏪 Pre-configured Data

### Branches
- Main Store - Nairobi
- Branch 2 - Mombasa
- Branch 3 - Kisumu

### Product Categories
- Beverages (Coca-Cola, Fanta, Sprite, etc.)
- Water (Aquafina, purified water)
- Energy Drinks (Mountain Dew, Red Bull)
- Juices (Fresh apple, orange, pineapple juice)
- Dairy (Milk, yogurt)

### Sample Products
- 67 pre-loaded products with realistic pricing
- Multiple variations (500ml, 1L, 2L bottles)
- Kenyan market context (KES pricing)
- Barcode support

## 🛠️ Troubleshooting

### Common Issues

1. **"next is not recognized" error**
   ```bash
   npm install next@latest --save-dev
   ```

2. **Database connection errors**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Ensure database exists: `createdb pos_system`

3. **Missing dependencies**
   ```bash
   npm install --force
   ```

4. **Port 3000 already in use**
   ```bash
   # Kill existing process
   npx kill-port 3000
   # Or use different port
   npm run dev -- -p 3001
   ```

5. **Prisma errors**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Browser Issues
- Use Chrome, Firefox, Safari, or Edge
- Clear browser cache if needed
- Disable any aggressive ad-blockers

## 📊 Key Features Overview

### ✅ Completed Features
1. **Dashboard** - Business metrics and quick actions
2. **Point of Sale** - Complete checkout interface
3. **Product Management** - Catalog with variations
4. **Inventory Tracking** - Stock levels and batch tracking
5. **Customer Management** - CRM with purchase history
6. **Sales History** - Transaction records and reporting
7. **Analytics Dashboard** - Business insights and charts
8. **Accounting** - Expense tracking and financial reports
9. **Settings** - System configuration
10. **Multi-branch Support** - Multiple store locations

### 🔄 Real-time Features
- Live inventory updates
- Real-time sales tracking
- Multi-branch synchronization
- Customer purchase history

### 📱 Responsive Design
- Mobile-friendly interface
- Touch-screen support for tablets
- Adaptive layouts for all screen sizes

## 🚀 Production Deployment

### Environment Setup
1. Set production environment variables
2. Configure PostgreSQL for production
3. Set up SSL certificates
4. Configure reverse proxy (nginx/Apache)

### Build Process
```bash
npm run build
npm start
```

### Database Production
```bash
npx prisma migrate deploy
npx prisma db seed
```

## 📞 Support

### Documentation
- README.md - Full system documentation
- prisma/schema.prisma - Database structure
- src/types/index.ts - TypeScript interfaces

### Getting Help
1. Check this deployment guide
2. Review the main README.md
3. Check database connection
4. Verify environment variables

## 🎯 System Requirements

### Minimum Requirements
- **RAM**: 4GB
- **Storage**: 10GB available space
- **OS**: Windows 10, macOS 10.15, Ubuntu 18.04+
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+

### Recommended Requirements
- **RAM**: 8GB+
- **Storage**: 20GB+ SSD
- **CPU**: Multi-core processor
- **Network**: Stable internet connection

## 🔒 Security Notes

- Change default admin password immediately
- Use strong database passwords
- Enable HTTPS in production
- Regular database backups
- Update dependencies regularly

## 📈 Performance Tips

1. **Database Optimization**
   - Regular maintenance
   - Index optimization
   - Connection pooling

2. **Application Performance**
   - Enable caching
   - Use CDN for static assets
   - Monitor memory usage

3. **Network Performance**
   - Fast hosting provider
   - Geographically distributed servers
   - Load balancing for high traffic

---

## 🎉 Ready to Go!

Your Store POS System is now ready for use! The system includes:

- **Complete frontend interface** with all pages functional
- **Database schema** with proper relationships
- **Sample data** for immediate testing
- **Mobile responsive** design
- **Multi-branch** capabilities
- **Comprehensive documentation**

Start by logging in with the default credentials and explore all the features. The system is designed to be intuitive and user-friendly for retail operations.