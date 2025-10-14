// Simple notification utility that works with the NotificationSystem
export type NotificationType = 'success' | 'info' | 'warning' | 'error'

interface NotificationOptions {
  type: NotificationType
  title: string
  message: string
  duration?: number
}

declare global {
  interface Window {
    addNotification?: (options: NotificationOptions) => void
  }
}

export const notifications = {
  success: (title: string, message: string) => {
    if (typeof window !== 'undefined' && window.addNotification) {
      window.addNotification({ type: 'success', title, message })
    }
  },
  info: (title: string, message: string) => {
    if (typeof window !== 'undefined' && window.addNotification) {
      window.addNotification({ type: 'info', title, message })
    }
  },
  warning: (title: string, message: string) => {
    if (typeof window !== 'undefined' && window.addNotification) {
      window.addNotification({ type: 'warning', title, message })
    }
  },
  error: (title: string, message: string) => {
    if (typeof window !== 'undefined' && window.addNotification) {
      window.addNotification({ type: 'error', title, message })
    }
  },
  show: (options: NotificationOptions) => {
    if (typeof window !== 'undefined' && window.addNotification) {
      window.addNotification(options)
    }
  }
}