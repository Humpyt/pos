'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Store,
  Printer,
  Mail,
  Share2,
  Eye,
  ChevronDown,
  Search,
  RefreshCw
} from 'lucide-react'
import { PageHeader, StatCard, LoadingState, DataTable, StatusBadge } from '@/components/shared/DesignSystem'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { updateManager } from '@/lib/update-manager'

interface Report {
  id: string
  name: string
  type: 'sales' | 'inventory' | 'financial' | 'customer' | 'tax'
  description: string
  generatedAt: string
  period: string
  status: 'completed' | 'generating' | 'failed'
  fileSize: string
  downloadUrl?: string
}

interface ReportStats {
  totalReports: number
  generatedToday: number
  scheduledReports: number
  failedReports: number
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedType, setSelectedType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState('month')

  useEffect(() => {
    // Simulate fetching reports data
    setTimeout(() => {
      setReports([
        {
          id: '1',
          name: 'Monthly Sales Report',
          type: 'sales',
          description: 'Comprehensive sales analysis for October 2024',
          generatedAt: '2024-10-14T10:30:00Z',
          period: 'October 2024',
          status: 'completed',
          fileSize: '2.4 MB',
          downloadUrl: '/reports/monthly-sales-oct2024.pdf'
        },
        {
          id: '2',
          name: 'Inventory Status Report',
          type: 'inventory',
          description: 'Current inventory levels across all branches',
          generatedAt: '2024-10-14T09:15:00Z',
          period: 'As of today',
          status: 'completed',
          fileSize: '1.8 MB'
        },
        {
          id: '3',
          name: 'Financial Summary Q3 2024',
          type: 'financial',
          description: 'Quarterly financial performance and analysis',
          generatedAt: '2024-10-01T14:20:00Z',
          period: 'Q3 2024',
          status: 'completed',
          fileSize: '3.2 MB'
        },
        {
          id: '4',
          name: 'Customer Analytics Report',
          type: 'customer',
          description: 'Customer behavior and purchase patterns',
          generatedAt: '2024-10-13T16:45:00Z',
          period: 'Last 30 days',
          status: 'completed',
          fileSize: '1.5 MB'
        },
        {
          id: '5',
          name: 'Daily Sales Summary',
          type: 'sales',
          description: 'Daily sales performance and trends',
          generatedAt: '2024-10-14T08:00:00Z',
          period: 'October 14, 2024',
          status: 'completed',
          fileSize: '890 KB'
        }
      ])
      setIsLoading(false)
    }, 800)
  }, [])

  // Listen for real-time updates (new sales might trigger report updates)
  useEffect(() => {
    const unsubscribe = updateManager.subscribe('sale_completed', (event) => {
      console.log('Reports page: Sale completed, checking if reports need updating', event.data)
      // In a real implementation, this might trigger report generation
    })

    return unsubscribe
  }, [])

  const filteredReports = reports.filter(report => {
    const matchesType = selectedType === 'all' || report.type === selectedType
    const matchesSearch =
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesType && matchesSearch
  })

  const stats: ReportStats = {
    totalReports: reports.filter(r => r.status === 'completed').length,
    generatedToday: reports.filter(r =>
      r.status === 'completed' &&
      new Date(r.generatedAt).toDateString() === new Date().toDateString()
    ).length,
    scheduledReports: 3, // Mock data
    failedReports: reports.filter(r => r.status === 'failed').length
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'sales': <BarChart3 className="h-4 w-4" />,
      'inventory': <Package className="h-4 w-4" />,
      'financial': <DollarSign className="h-4 w-4" />,
      'customer': <Users className="h-4 w-4" />,
      'tax': <FileText className="h-4 w-4" />
    }
    return icons[type] || <FileText className="h-4 w-4" />
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'sales': 'text-blue-600',
      'inventory': 'text-green-600',
      'financial': 'text-purple-600',
      'customer': 'text-orange-600',
      'tax': 'text-red-600'
    }
    return colors[type] || 'text-gray-600'
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'destructive'> = {
      'completed': 'success',
      'generating': 'warning',
      'failed': 'destructive'
    }
    return variants[status] || 'warning'
  }

  const handleGenerateReport = (type: string) => {
    console.log(`Generating ${type} report...`)
    // In a real implementation, this would trigger report generation
  }

  const handleDownloadReport = (report: Report) => {
    if (report.downloadUrl) {
      console.log(`Downloading report: ${report.name}`)
      // In a real implementation, this would trigger file download
    }
  }

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Reports"
        subtitle="Generate and manage business reports"
      >
        <div className="flex space-x-3">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Reports"
          value={stats.totalReports}
          icon={FileText}
          color="bg-blue-500"
          change="All time"
          changeType="neutral"
        />
        <StatCard
          title="Generated Today"
          value={stats.generatedToday}
          icon={Calendar}
          color="bg-green-500"
          change="Today"
          changeType="positive"
        />
        <StatCard
          title="Scheduled"
          value={stats.scheduledReports}
          icon={RefreshCw}
          color="bg-purple-500"
          change="Auto-generated"
          changeType="neutral"
        />
        <StatCard
          title="Failed"
          value={stats.failedReports}
          icon={FileText}
          color="bg-red-500"
          change="Needs attention"
          changeType="negative"
        />
      </div>

      {/* Quick Report Generation */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Quick Report Generation</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { type: 'sales', label: 'Sales Report', icon: BarChart3 },
            { type: 'inventory', label: 'Inventory', icon: Package },
            { type: 'financial', label: 'Financial', icon: DollarSign },
            { type: 'customer', label: 'Customers', icon: Users },
            { type: 'tax', label: 'Tax Report', icon: FileText }
          ].map((reportType) => (
            <Button
              key={reportType.type}
              variant="outline"
              onClick={() => handleGenerateReport(reportType.type)}
              className="flex flex-col items-center h-20 space-y-2"
            >
              <reportType.icon className="h-5 w-5" />
              <span className="text-xs">{reportType.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Report Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search Reports</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 input rounded-lg border border-input-border focus:border-primary focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Report Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-card"
            >
              <option value="all">All Types</option>
              <option value="sales">Sales Reports</option>
              <option value="inventory">Inventory Reports</option>
              <option value="financial">Financial Reports</option>
              <option value="customer">Customer Reports</option>
              <option value="tax">Tax Reports</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-card"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-primary mb-2">Generated Reports</h2>
        <p className="text-secondary mb-6">View and download your business reports</p>

        <DataTable
          columns={[
            {
              key: 'name',
              label: 'Report Name',
              render: (report: Report) => (
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(report.type)} bg-opacity-10`}>
                    {getTypeIcon(report.type)}
                  </div>
                  <div>
                    <p className="font-medium text-primary">{report.name}</p>
                    <p className="text-sm text-secondary">{report.description}</p>
                  </div>
                </div>
              )
            },
            {
              key: 'type',
              label: 'Type',
              render: (report: Report) => (
                <Badge variant="outline" className={getTypeColor(report.type)}>
                  {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                </Badge>
              )
            },
            {
              key: 'period',
              label: 'Period',
              render: (report: Report) => (
                <span className="text-sm text-secondary">{report.period}</span>
              )
            },
            {
              key: 'generatedAt',
              label: 'Generated',
              render: (report: Report) => (
                <span className="text-sm text-secondary">{formatDate(report.generatedAt)}</span>
              )
            },
            {
              key: 'size',
              label: 'Size',
              render: (report: Report) => (
                <span className="text-sm text-secondary">{report.fileSize}</span>
              )
            },
            {
              key: 'status',
              label: 'Status',
              render: (report: Report) => (
                <StatusBadge
                  status={getStatusBadge(report.status)}
                >
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </StatusBadge>
              )
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (report: Report) => (
                <div className="flex justify-end space-x-2">
                  {report.status === 'completed' && (
                    <>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadReport(report)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              )
            }
          ]}
          data={filteredReports}
          empty={{
            title: "No reports found",
            description: searchTerm || selectedType !== 'all'
              ? 'Try adjusting your filters or search terms'
              : 'Get started by generating your first report',
            action: {
              label: "Generate Report",
              onClick: () => console.log('Generate Report clicked')
            }
          }}
        />
      </div>
    </div>
  )
}