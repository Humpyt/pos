'use client'

import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, Database, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import { offlineManager } from '@/lib/offline-manager'

interface SyncStatus {
  isOnline: boolean
  lastOnlineTime: string
  pendingSales: number
  pendingInventoryChanges: number
  lastSyncTime?: string
  syncInProgress: boolean
  syncError?: string
}

export function OfflineStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    lastOnlineTime: new Date().toISOString(),
    pendingSales: 0,
    pendingInventoryChanges: 0,
    syncInProgress: false
  })

  const [isExpanded, setIsExpanded] = useState(false)
  const [storageUsage, setStorageUsage] = useState({ used: 0, available: 0, percentage: 0 })

  // Update status every second
  useEffect(() => {
    const updateStatus = () => {
      const status = offlineManager.getSyncStatus()
      setSyncStatus(status)

      // Update storage usage every 10 seconds
      if (Math.random() < 0.1) {
        const usage = offlineManager.getStorageUsage()
        setStorageUsage(usage)
      }
    }

    updateStatus() // Initial update
    const interval = setInterval(updateStatus, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleForceSync = async () => {
    await offlineManager.triggerSync()
  }

  const handleRefreshCache = async () => {
    // Get current branch from localStorage or default to first branch
    const currentBranchId = localStorage.getItem('currentBranchId') || '1'
    await offlineManager.refreshCache(currentBranchId)
  }

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    try {
      const now = new Date()
      const time = new Date(timestamp)
      const diffMs = now.getTime() - time.getTime()
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`

      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`

      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    } catch {
      return 'Unknown'
    }
  }

  const totalPending = syncStatus.pendingSales + syncStatus.pendingInventoryChanges

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Main Status Indicator */}
      <div
        className={`
          relative bg-white rounded-lg shadow-lg border-2 p-3 cursor-pointer transition-all
          ${syncStatus.isOnline
            ? 'border-green-200 hover:border-green-300'
            : 'border-red-200 hover:border-red-300'
          }
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Status Icon and Basic Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {syncStatus.isOnline ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            {syncStatus.syncInProgress && (
              <RefreshCw className="absolute -top-1 -right-1 h-3 w-3 text-blue-600 animate-spin" />
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {syncStatus.isOnline ? 'Online' : 'Offline Mode'}
            </span>
            {totalPending > 0 && (
              <span className="text-xs text-amber-600">
                {totalPending} pending sync
              </span>
            )}
          </div>

          {totalPending > 0 && (
            <div className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded-full">
              {totalPending}
            </div>
          )}
        </div>

        {/* Progress Bar when syncing */}
        {syncStatus.syncInProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
            <div className="h-full bg-blue-600 animate-pulse" style={{ width: '60%' }} />
          </div>
        )}
      </div>

      {/* Expanded Status Panel */}
      {isExpanded && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Connection Status</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(false)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>

          {/* Status Details */}
          <div className="p-4 space-y-3">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {syncStatus.isOnline ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {syncStatus.isOnline ? 'Connected' : 'Offline'}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {syncStatus.isOnline
                  ? syncStatus.lastSyncTime
                    ? `Synced ${formatTimeAgo(syncStatus.lastSyncTime)}`
                    : 'Ready'
                  : `Offline since ${formatTimeAgo(syncStatus.lastOnlineTime)}`
                }
              </span>
            </div>

            {/* Sync Status */}
            {syncStatus.syncInProgress && (
              <div className="flex items-center gap-2 text-blue-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Syncing data...</span>
              </div>
            )}

            {/* Sync Error */}
            {syncStatus.syncError && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 p-2 rounded">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="text-xs">{syncStatus.syncError}</span>
              </div>
            )}

            {/* Pending Items */}
            {(syncStatus.pendingSales > 0 || syncStatus.pendingInventoryChanges > 0) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Pending Sales:</span>
                  <span className="font-medium">{syncStatus.pendingSales}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Pending Inventory Changes:</span>
                  <span className="font-medium">{syncStatus.pendingInventoryChanges}</span>
                </div>
              </div>
            )}

            {/* Storage Usage */}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-1">
                  <Database className="h-4 w-4 text-gray-600" />
                  <span>Storage Usage</span>
                </div>
                <span className="text-xs text-gray-500">
                  {Math.round(storageUsage.used / 1024)}KB used
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-colors ${
                    storageUsage.percentage > 80
                      ? 'bg-red-600'
                      : storageUsage.percentage > 60
                        ? 'bg-amber-600'
                        : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {storageUsage.percentage.toFixed(1)}% used
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  await handleForceSync()
                }}
                disabled={!syncStatus.isOnline || syncStatus.syncInProgress}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {syncStatus.syncInProgress ? 'Syncing...' : 'Sync Now'}
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  await handleRefreshCache()
                }}
                disabled={!syncStatus.isOnline}
                className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Refresh Cache
              </button>
            </div>

            {/* Help Text */}
            <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-200">
              <div className="flex items-start gap-1">
                <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  {syncStatus.isOnline
                    ? 'Data syncs automatically every 2 minutes'
                    : 'Data will sync when connection is restored'
                  }
                </span>
              </div>
              {totalPending > 0 && (
                <div className="text-amber-600">
                  ⚠️ Unsynced data may be lost if browser cache is cleared
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close expanded panel */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  )
}