'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// Design System Components for POS System

// Stat Card Component
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<any> | React.ReactElement
  description?: string
  color?: string
  change?: string
  changeType?: 'positive' | 'negative' | 'warning' | 'neutral'
  trend?: {
    value: 'positive' | 'negative' | 'warning' | 'neutral'
    label: string
  }
}

export function StatCard({ title, value, icon, description, color, change, changeType, trend }: StatCardProps) {
  let IconComponent;

  if (React.isValidElement(icon)) {
    // It's already a JSX element, just use it directly
    IconComponent = icon;
  } else if (typeof icon === 'function') {
    // It's a React component, create element
    IconComponent = React.createElement(icon as React.ComponentType<any>, { className: "h-6 w-6 text-white" });
  } else {
    // Fallback for invalid icon types
    IconComponent = <div className="h-6 w-6 bg-white/20 rounded" />;
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={cn("p-3 rounded-xl", color || "bg-blue-500")}>
            {IconComponent}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-secondary">{title}</p>
            <p className="text-2xl font-bold text-primary">{value}</p>
            {description && (
              <p className="text-xs text-muted mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>
      {(change || trend) && (
        <div className="mt-4">
          <div className="flex items-center text-sm">
            {(change || trend?.label) && (
              <span className={cn(
                "font-medium",
                changeType === 'positive' || trend?.value === 'positive' ? "text-emerald-600" :
                changeType === 'negative' || trend?.value === 'negative' ? "text-red-600" :
                changeType === 'warning' || trend?.value === 'warning' ? "text-orange-600" :
                "text-muted"
              )}>
                {change || trend?.label}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Page Header Component
interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: Array<{ label: string; href: string }>
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="px-6 py-4 bg-white border-b border-border">
      <div className="flex items-center justify-between">
        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex mb-2" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                {breadcrumbs.map((breadcrumb, index) => (
                  <li key={index} className="inline-flex items-center">
                    {index > 0 && (
                      <svg className="w-3 h-3 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <a
                      href={breadcrumb.href}
                      className="text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
                    >
                      {breadcrumb.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-secondary mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

// Action Card Component
interface ActionCardProps {
  title: string
  icon: React.ComponentType<any>
  color: string
  description?: string
  onClick?: () => void
}

export function ActionCard({ title, icon: Icon, color, description, onClick }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-6 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all"
    >
      <div className="flex items-center">
        <div className={cn("p-3 rounded-xl", color)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <h3 className="font-semibold text-primary">{title}</h3>
          {description && (
            <p className="text-sm text-muted mt-1">{description}</p>
          )}
        </div>
      </div>
    </button>
  )
}

// Quick Actions Grid Component
interface QuickActionProps {
  title: string
  icon: React.ComponentType<any>
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'warning'
}

export function QuickAction({ title, icon: Icon, onClick, variant = 'primary' }: QuickActionProps) {
  const variants = {
    primary: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
    secondary: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200',
    success: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200'
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center",
        variants[variant]
      )}
    >
      <Icon className="h-5 w-5 mr-3" />
      <span className="font-medium">{title}</span>
    </button>
  )
}

// Activity Item Component
interface ActivityItemProps {
  icon: React.ComponentType<any>
  iconColor: string
  title: string
  description: string
  timestamp: string
}

export function ActivityItem({ icon: Icon, iconColor, title, description, timestamp }: ActivityItemProps) {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <div className={cn("w-2 h-2 rounded-full mt-2", iconColor)}></div>
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-primary">{title}</p>
        <p className="text-sm text-secondary">{description}</p>
        <p className="text-xs text-muted">{timestamp}</p>
      </div>
    </div>
  )
}

// Empty State Component
interface EmptyStateProps {
  icon: React.ComponentType<any>
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Icon className="h-12 w-12 text-muted mx-auto mb-4" />
      <h3 className="text-lg font-medium text-primary mb-2">{title}</h3>
      <p className="text-muted mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary px-4 py-2 rounded-lg"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// Card Component
interface CardProps {
  title?: React.ReactNode
  content?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function Card({ title, content, children, className }: CardProps) {
  return (
    <div className={cn("bg-card rounded-xl shadow-sm border border-border", className)}>
      {title && (
        <div className="px-6 py-4 border-b border-border">
          {title}
        </div>
      )}
      <div className="px-6 py-4">
        {content || children}
      </div>
    </div>
  )
}

// Status Badge Component
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'warning' | 'error'
  children: React.ReactNode
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const statusStyles = {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-orange-100 text-orange-800 border-orange-200',
    error: 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      statusStyles[status]
    )}>
      {children}
    </span>
  )
}

// Data Table Component (Basic structure)
interface DataTableProps {
  columns: Array<{
    key: string
    label: string
    render?: (row: any) => React.ReactNode
  }>
  data: Array<Record<string, any>>
  empty?: {
    title: string
    description: string
  }
}

export function DataTable({ columns, data, empty }: DataTableProps) {
  if (data.length === 0 && empty) {
    return (
      <div className="bg-card rounded-xl border border-border p-8">
        <EmptyState
          icon={() => (
            <svg className="h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          title={empty.title}
          description={empty.description}
        />
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-surface transition-colors">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Loading State Component
export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

// Error State Component
interface ErrorStateProps {
  title: string
  description: string
  onRetry?: () => void
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-primary mb-2">{title}</h3>
      <p className="text-muted mb-6 max-w-md mx-auto">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary px-4 py-2 rounded-lg"
        >
          Try Again
        </button>
      )}
    </div>
  )
}