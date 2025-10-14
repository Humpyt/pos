'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { CheckCircle, AlertCircle, TrendingUp, Package, DollarSign, X } from 'lucide-react'
import { updateManager } from '@/lib/update-manager'
import { formatCurrency } from '@/lib/utils'

export type NotificationType = 'success' | 'info' | 'warning' | 'error'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
}

interface NotificationOptions {
  type: NotificationType
  title: string
  message: string
  duration?: number
}

// Create a notification context
const NotificationContext = createContext<{
  addNotification: (options: NotificationOptions) => void;
}>({
  addNotification: () => {}
})

export const useNotifications = () => useContext(NotificationContext)

interface NotificationItemProps {
  notification: Notification
  onClose: () => void
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />
    }
  }

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className={`${getBgColor()} border rounded-lg p-4 mb-2 relative`}>
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>

        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{notification.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-400 mt-2">
            {notification.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  )
}

export const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isVisible, setIsVisible] = useState(false)

  const addNotification = (notification: NotificationOptions) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    }

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]) // Keep max 10 notifications
    setIsVisible(true)

    // Auto-hide after 5 seconds
    setTimeout(() => {
      removeNotification(newNotification.id)
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (notifications.length <= 1) {
      setIsVisible(false)
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const clearAll = () => {
    setNotifications([])
    setIsVisible(false)
  }

  // Listen for real-time updates and show notifications
  useEffect(() => {
    const unsubscribeSale = updateManager.subscribe('sale_completed', (event) => {
      const saleData = event.data
      addNotification({
        type: 'success',
        title: 'Sale Completed',
        message: `Sale #${saleData.saleNumber} - ${formatCurrency(saleData.totalAmount)} processed successfully`
      })
    })

    const unsubscribeInventory = updateManager.subscribe('inventory_updated', (event) => {
      const data = event.data
      if (data.items && data.items.length > 0) {
        const totalItems = data.items.reduce((sum: number, item: any) => sum + item.quantitySold, 0)
        addNotification({
          type: 'info',
          title: 'Inventory Updated',
          message: `${totalItems} items sold and inventory levels updated`
        })
      }
    })

    const unsubscribeLowStock = updateManager.subscribe('low_stock_alert', (event) => {
      addNotification({
        type: 'warning',
        title: 'Low Stock Alert',
        message: event.data.productName ? `${event.data.productName} is running low on stock` : 'Some products are running low on stock'
      })
    })

    return () => {
      unsubscribeSale()
      unsubscribeInventory()
      unsubscribeLowStock()
    }
  }, [])

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {renderNotifications()}
    </NotificationContext.Provider>
  )
}

const renderNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isVisible, setIsVisible] = useState(false)

  // This is a workaround to make the context available globally
  useEffect(() => {
    // Make addNotification globally available
    (window as any).addNotification = (options: NotificationOptions) => {
      const newNotification: Notification = {
        ...options,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        read: false
      }

      setNotifications(prev => [newNotification, ...prev.slice(0, 9)])
      setIsVisible(true)

      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
        if (notifications.length <= 1) {
          setIsVisible(false)
        }
      }, 5000)
    }
  }, [notifications.length])

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (notifications.length <= 1) {
      setIsVisible(false)
    }
  }

  const clearAll = () => {
    setNotifications([])
    setIsVisible(false)
  }

  if (notifications.length === 0 || !isVisible) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-h-96 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Notifications</h3>
          <button
            onClick={clearAll}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear All
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default NotificationSystem