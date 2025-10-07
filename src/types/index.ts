// Core Types
export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  barcode?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
  variations?: ProductVariation[];
  inventory?: Inventory[];
}

export interface ProductVariation {
  id: string;
  productId: string;
  name: string;
  unitPrice: number;
  costPrice: number;
  weight?: number;
  volume?: number;
  piecesPerCarton?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  product?: Product;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  products?: Product[];
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  id: string;
  branchId: string;
  productId: string;
  variationId?: string;
  batchId?: string;
  quantity: number;
  minStock: number;
  maxStock?: number;
  reorderPoint: number;
  lastUpdated: Date;
  branch?: Branch;
  product?: Product;
  variation?: ProductVariation;
}

export interface Sale {
  id: string;
  saleNumber: string;
  branchId: string;
  userId: string;
  customerId?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: SaleStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: SaleItem[];
  payments?: Payment[];
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  variationId?: string;
  batchId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costPrice: number;
  profit: number;
  createdAt: Date;
  product?: Product;
  variation?: ProductVariation;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  customerType: CustomerType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  saleId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductBatch {
  id: string;
  productId: string;
  variationId?: string;
  batchNumber: string;
  quantity: number;
  expiryDate?: Date;
  manufactureDate?: Date;
  costPrice: number;
  supplier?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  branchId: string;
  category: string;
  description: string;
  amount: number;
  date: Date;
  receiptNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  MOBILE_MONEY = 'MOBILE_MONEY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT = 'CREDIT'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

export enum SaleStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum CustomerType {
  WALK_IN = 'WALK_IN',
  REGULAR = 'REGULAR',
  WHOLESALE = 'WHOLESALE',
  CORPORATE = 'CORPORATE'
}

// UI/Component Types
export interface CartItem {
  id: string;
  product: Product;
  variation?: ProductVariation;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

export interface SaleFormData {
  customerId?: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  discount: number;
  notes?: string;
}

// Analytics Types
export interface SalesAnalytics {
  dailySales: DailySales[];
  weeklySales: WeeklySales[];
  monthlySales: MonthlySales[];
  topProducts: TopProduct[];
  branchComparison: BranchSales[];
}

export interface DailySales {
  date: string;
  sales: number;
  revenue: number;
  profit: number;
}

export interface WeeklySales {
  week: string;
  startDate: string;
  endDate: string;
  sales: number;
  revenue: number;
  profit: number;
}

export interface MonthlySales {
  month: string;
  sales: number;
  revenue: number;
  profit: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface BranchSales {
  branchId: string;
  branchName: string;
  sales: number;
  revenue: number;
  profit: number;
}

// Report Types
export interface SalesReport {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  totalItemsSold: number;
  sales: Sale[];
}

export interface InventoryReport {
  branchId?: string;
  lowStockItems: Inventory[];
  outOfStockItems: Inventory[];
  expiringItems: ProductBatch[];
  totalValue: number;
}

export interface CustomerReport {
  customerType: CustomerType;
  totalCustomers: number;
  totalRevenue: number;
  averageOrderValue: number;
  topCustomers: Customer[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface ProductFormData {
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  barcode?: string;
  image?: string;
  variations: ProductVariationFormData[];
}

export interface ProductVariationFormData {
  name: string;
  unitPrice: number;
  costPrice: number;
  weight?: number;
  volume?: number;
  piecesPerCarton?: number;
}

export interface BranchFormData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  customerType: CustomerType;
}