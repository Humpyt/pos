'use client'

import { useState } from 'react'
import {
  Settings,
  Store,
  Users,
  Database,
  Bell,
  Shield,
  CreditCard,
  Printer,
  Save
} from 'lucide-react'
import { PageHeader, LoadingState } from '@/components/shared/DesignSystem'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')

  const settingsTabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'store', label: 'Store', icon: Store },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'printer', label: 'Printer', icon: Printer }
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Settings"
        subtitle="Configure your POS system preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="bg-card rounded-xl border border-border p-4">
          <nav className="space-y-2">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-surface text-primary border-r-2 border-blue-600"
                    : "text-secondary hover:bg-surface hover:text-primary"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeTab === 'general' && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-primary mb-2">General Settings</h2>
              <p className="text-secondary mb-6">Basic system configuration</p>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Store Name</label>
                    <Input defaultValue="Main Store" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Currency</label>
                    <Input defaultValue="KES - Kenyan Shilling" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Timezone</label>
                  <Input defaultValue="Africa/Nairobi" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date Format</label>
                  <Input defaultValue="DD/MM/YYYY" />
                </div>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-primary mb-2">User Management</h2>
              <p className="text-secondary mb-6">Manage system users and permissions</p>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-primary">System Users</h3>
                    <p className="text-sm text-secondary">Manage user accounts and roles</p>
                  </div>
                  <Button>
                    <Users className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        A
                      </div>
                      <div>
                        <p className="font-medium text-primary">Admin User</p>
                        <p className="text-sm text-secondary">admin@pos-store.com</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">Administrator</Badge>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-primary mb-2">Payment Methods</h2>
              <p className="text-secondary mb-6">Configure accepted payment methods</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-primary">Cash</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <p className="text-sm text-secondary">Physical cash payments</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-primary">Card</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <p className="text-sm text-secondary">Credit/Debit cards</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-primary">Mobile Money</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <p className="text-sm text-secondary">M-Pesa, Airtel Money</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-primary">Bank Transfer</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <p className="text-sm text-secondary">Direct bank transfers</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'printer' && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-primary mb-2">Printer Settings</h2>
              <p className="text-secondary mb-6">Configure receipt printing options</p>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Default Printer</label>
                  <select className="w-full p-2 border border-border rounded-md bg-card">
                    <option>Thermal Printer - USB</option>
                    <option>Network Printer</option>
                    <option>Windows Default Printer</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Receipt Header</label>
                    <Input defaultValue="Your Store Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Receipt Footer</label>
                    <Input defaultValue="Thank you for shopping with us!" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Print receipt after each sale</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Include store logo on receipt</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span className="text-sm">Include QR code on receipt</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Default content for other tabs */}
          {['store', 'database', 'notifications', 'security'].includes(activeTab) && (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">
                {settingsTabs.find(t => t.id === activeTab)?.label} Settings
              </h3>
              <p className="text-secondary">This section is under development</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}