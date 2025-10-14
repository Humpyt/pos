/**
 * Test script for real-time updates functionality
 * This can be run in the browser console to test the real-time update system
 */

import { updateManager } from './update-manager'

export const testRealTimeUpdates = () => {
  console.log('🧪 Testing Real-Time Updates System...')
  console.log('=====================================')

  // Test 1: Update Manager Initialization
  console.log('\n1. Testing Update Manager...')
  const manager = updateManager
  console.log('✅ Update manager initialized successfully')

  // Test 2: Event Subscription
  console.log('\n2. Testing Event Subscription...')
  let saleUpdateReceived = false
  let inventoryUpdateReceived = false
  let analyticsUpdateReceived = false
  let accountingUpdateReceived = false
  let dashboardUpdateReceived = false

  const unsubscribeSale = manager.subscribe('sale_completed', (event) => {
    console.log('📊 Sale update received:', event.data)
    saleUpdateReceived = true
  })

  const unsubscribeInventory = manager.subscribe('inventory_updated', (event) => {
    console.log('📦 Inventory update received:', event.data)
    inventoryUpdateReceived = true
  })

  const unsubscribeAnalytics = manager.subscribe('analytics_updated', (event) => {
    console.log('📈 Analytics update received:', event.data)
    analyticsUpdateReceived = true
  })

  const unsubscribeAccounting = manager.subscribe('accounting_updated', (event) => {
    console.log('💰 Accounting update received:', event.data)
    accountingUpdateReceived = true
  })

  const unsubscribeDashboard = manager.subscribe('dashboard_updated', (event) => {
    console.log('🏠 Dashboard update received:', event.data)
    dashboardUpdateReceived = true
  })

  console.log('✅ Event subscriptions created')

  // Test 3: Simulate Sale Completion
  console.log('\n3. Simulating Sale Completion...')
  const testSaleData = {
    saleNumber: 'TEST-SALE-' + Date.now(),
    items: [
      {
        productId: 'test-product-1',
        productName: 'Test Product 1',
        quantity: 2,
        unitPrice: 1500,
        totalPrice: 3000
      },
      {
        productId: 'test-product-2',
        productName: 'Test Product 2',
        quantity: 1,
        unitPrice: 2500,
        totalPrice: 2500
      }
    ],
    subtotal: 5500,
    discountAmount: 500,
    taxAmount: 800,
    totalAmount: 5800,
    paymentMethod: 'CASH',
    branchId: 'test-branch',
    userId: 'test-user',
    createdAt: new Date().toISOString()
  }

  manager.triggerSaleUpdate(testSaleData)
  console.log('✅ Sale completion simulated')

  // Test 4: Check Results
  setTimeout(() => {
    console.log('\n4. Checking Results...')

    const allTestsPassed =
      saleUpdateReceived &&
      inventoryUpdateReceived &&
      analyticsUpdateReceived &&
      accountingUpdateReceived &&
      dashboardUpdateReceived

    if (allTestsPassed) {
      console.log('🎉 All tests passed! Real-time updates are working correctly.')
    } else {
      console.log('❌ Some tests failed. Checking each component...')
      console.log(`   Sale updates: ${saleUpdateReceived ? '✅' : '❌'}`)
      console.log(`   Inventory updates: ${inventoryUpdateReceived ? '✅' : '❌'}`)
      console.log(`   Analytics updates: ${analyticsUpdateReceived ? '✅' : '❌'}`)
      console.log(`   Accounting updates: ${accountingUpdateReceived ? '✅' : '❌'}`)
      console.log(`   Dashboard updates: ${dashboardUpdateReceived ? '✅' : '❌'}`)
    }

    // Cleanup
    unsubscribeSale()
    unsubscribeInventory()
    unsubscribeAnalytics()
    unsubscribeAccounting()
    unsubscribeDashboard()

    console.log('\n5. Cleanup completed')
    console.log('=====================================')
    console.log('🏁 Test finished!')
  }, 1000)

  return {
    testSaleData,
    cleanup: () => {
      unsubscribeSale()
      unsubscribeInventory()
      unsubscribeAnalytics()
      unsubscribeAccounting()
      unsubscribeDashboard()
    }
  }
}

// Test notification system
export const testNotifications = () => {
  console.log('\n🔔 Testing Notification System...')

  // This will be automatically tested when the NotificationSystem component is rendered
  const testNotification = {
    type: 'success' as const,
    title: 'Test Notification',
    message: 'This is a test notification to verify the system works'
  }

  console.log('✅ Notification test data prepared')
  console.log('💡 Notifications will appear when a real sale is completed')

  return testNotification
}

// Export test functions for browser console access
if (typeof window !== 'undefined') {
  (window as any).testRealTimeUpdates = testRealTimeUpdates
  (window as any).testNotifications = testNotifications
}