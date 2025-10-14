'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  Store,
  Calculator,
  FileText,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import { UserButtonComponent } from "@/components/auth/UserButton"
import { SignInButtonComponent } from "@/components/auth/SignInButton"
import { useAuth } from "@/lib/use-auth"
import { AuthGuard } from "@/components/auth/AuthGuard"
import NotificationSystem from "@/components/notifications/NotificationSystem"

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Point of Sale', href: '/pos', icon: ShoppingCart },
  { name: 'Inventory', href: '/inventory', icon: Store },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Sales', href: '/sales', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Accounting', href: '/accounting', icon: Calculator },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()
  const { userName, userEmail } = useAuth()

  // Debug: Log current pathname
  console.log('Current pathname:', pathname)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-surface lg:flex">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
        )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 bg-card shadow-xl border-r border-border transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0",
        sidebarCollapsed ? "w-16" : "w-64",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className={cn(
          "flex items-center border-b border-border transition-all duration-300",
          sidebarCollapsed ? "justify-center px-4" : "justify-between px-4"
        )}>
          <h1 className={cn(
            "text-xl font-bold text-primary flex items-center transition-all duration-300",
            sidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"
          )}>
            <Store className="h-6 w-6 mr-2 text-primary" />
            POS System
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="lg:flex items-center justify-center w-8 h-8 rounded-md text-secondary hover:text-primary hover:bg-surface transition-all duration-300"
              title={sidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "p-2 rounded-md text-secondary hover:text-primary hover:bg-surface transition-colors",
                sidebarCollapsed ? "hidden" : "lg:hidden"
              )}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <nav className="mt-8 flex-1 flex flex-col justify-between overflow-hidden">
          <div className="px-2 space-y-2 overflow-y-auto overflow-x-hidden flex-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all group cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-secondary hover:bg-surface hover:text-primary",
                    sidebarCollapsed ? "justify-center" : "justify-start"
                  )}
                  title={sidebarCollapsed ? item.name : undefined}
                  onClick={() => console.log(`Navigating to: ${item.name} (${item.href})`)}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-all duration-300",
                    sidebarCollapsed ? "mr-0" : "mr-3"
                  )} />
                  <span className={cn(
                    "transition-all duration-300",
                    sidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                  )}>
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-card shadow-sm border-b border-border">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-secondary hover:text-primary hover:bg-surface transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-secondary">
                <Store className="h-4 w-4" />
                <span>Branch:</span>
                <span className="font-medium text-primary">Main Store</span>
              </div>

              <SignedIn>
                <div className="flex items-center space-x-2 text-sm text-secondary">
                  <Users className="h-4 w-4" />
                  <span>User:</span>
                  <span className="font-medium text-primary">{userName || 'Loading...'}</span>
                </div>
              </SignedIn>

              <div className="flex items-center space-x-2 text-sm text-muted">
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                  🇺🇬 Uganda
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <SignedOut>
                  <SignInButtonComponent />
                </SignedOut>
                <SignedIn>
                  <UserButtonComponent />
                </SignedIn>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Notification System */}
      <NotificationSystem />
    </div>
    </AuthGuard>
  )
}