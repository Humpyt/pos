'use client'

import { updateManager } from './update-manager'

export type NotificationType = 'success' | 'info' | 'warning' | 'error'

interface NotificationOptions {
  type: NotificationType
  title: string
  message: string
  duration?: number
}

// Global notification functions that will be available system-wide
let globalListeners: Array<(notification: NotificationOptions) => void> = []

export function subscribe(listener: (notification: NotificationOptions) => void) {
  globalListeners.push(listener)
  return () => {
    globalListeners = globalListeners.filter(l => l !== listener)
  }
}

export function showNotification(options: NotificationOptions) {
  globalListeners.forEach(listener => listener(options))
}

export const notifications = {
  subscribe,
  show: showNotification,
  success: (title: string, message: string) => showNotification({ type: 'success', title, message }),
  info: (title: string, message: string) => showNotification({ type: 'info', title, message }),
  warning: (title: string, message: string) => showNotification({ type: 'warning', title, message }),
  error: (title: string, message: string) => showNotification({ type: 'error', title, message })
}

// Global event-based notifications
if (typeof window !== 'undefined') {
  // Create custom event for notifications
  const event = new CustomEvent('notification', {
    detail: {
      addNotification: (options: NotificationOptions) => {
        showNotification(options)
      }
    }
  })

  // Dispatch event to initialize notification system
  window.dispatchEvent(event)
}