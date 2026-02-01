"use client"

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { Label } from '@open-mercato/ui/primitives/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@open-mercato/ui/primitives/card'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { FeatureGuard } from '@open-mercato/core/modules/feature_toggles/components/FeatureGuard'
import { Trash2, Plus, RefreshCw } from 'lucide-react'

type MockItem = {
  id: string
  subject: string
  senderName: string
  senderEmail: string
  postedDate: string
  createdAt?: string
}

export default function EDoreczeniaMockPage() {
  const t = useT()
  const [mockItems, setMockItems] = React.useState<MockItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [newItem, setNewItem] = React.useState({
    subject: '',
    senderName: '',
    senderEmail: '',
    postedDate: new Date().toISOString().split('T')[0],
  })

  // Load items on mount and set up polling
  React.useEffect(() => {
    loadItems()
    
    // Poll for new items every 5 seconds
    const interval = setInterval(loadItems, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadItems = async () => {
    try {
      const response = await apiCall<{ items: MockItem[]; total: number }>('/api/correspondence-sources/mock-items')
      if (response.ok && response.result) {
        setMockItems(response.result.items)
      }
    } catch (error) {
      // Silently fail for polling - only show error on user actions
    }
  }

  const handleAddItem = async () => {
    if (!newItem.subject || !newItem.senderName || !newItem.senderEmail) {
      flash(t('correspondenceSources.mock.error.add', 'Please fill all fields'), 'error')
      return
    }

    setLoading(true)
    try {
      const response = await apiCall('/api/correspondence-sources/mock-items', {
        method: 'POST',
        body: JSON.stringify(newItem),
      })

      if (response.ok) {
        flash(t('correspondenceSources.mock.success.added', 'Mock item added successfully'), 'success')
        setNewItem({
          subject: '',
          senderName: '',
          senderEmail: '',
          postedDate: new Date().toISOString().split('T')[0],
        })
        await loadItems()
      } else {
        flash(t('correspondenceSources.mock.error.add', 'Failed to add mock item'), 'error')
      }
    } catch (error) {
      flash(t('correspondenceSources.mock.error.add', 'Failed to add mock item'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClearItems = async () => {
    if (mockItems.length === 0) return
    
    const confirmed = window.confirm('Are you sure you want to clear all mock items?')
    if (!confirmed) return

    setLoading(true)
    try {
      const response = await apiCall('/api/correspondence-sources/mock-items', {
        method: 'DELETE',
      })

      if (response.ok) {
        flash(t('correspondenceSources.mock.success.cleared', 'Mock items cleared successfully'), 'success')
        setMockItems([])
      } else {
        flash(t('correspondenceSources.mock.error.clear', 'Failed to clear mock items'), 'error')
      }
    } catch (error) {
      flash(t('correspondenceSources.mock.error.clear', 'Failed to clear mock items'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    setLoading(true)
    try {
      const response = await apiCall(`/api/correspondence-sources/mock-items?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMockItems(mockItems.filter(item => item.id !== id))
      } else {
        flash(t('correspondenceSources.mock.error.delete', 'Failed to delete mock item'), 'error')
      }
    } catch (error) {
      flash(t('correspondenceSources.mock.error.delete', 'Failed to delete mock item'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FeatureGuard id="correspondence_sources_mock_ui">
      <Page>
        <PageBody>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">
                {t('correspondenceSources.mock.page.title', 'eDoreczenia Mock UI')}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t('correspondenceSources.mock.page.description', 'Test correspondence sync with mock data')}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t('correspondenceSources.mock.action.addItem', 'Add Mock Item')}
                </CardTitle>
                <CardDescription>
                  Create a mock correspondence item for testing sync functionality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="subject">
                      {t('correspondenceSources.mock.field.subject', 'Subject')}
                    </Label>
                    <Input
                      id="subject"
                      value={newItem.subject}
                      onChange={(e) => setNewItem({ ...newItem, subject: e.target.value })}
                      placeholder="e.g., Application for service"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="senderName">
                        {t('correspondenceSources.mock.field.senderName', 'Sender Name')}
                      </Label>
                      <Input
                        id="senderName"
                        value={newItem.senderName}
                        onChange={(e) => setNewItem({ ...newItem, senderName: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="senderEmail">
                        {t('correspondenceSources.mock.field.senderEmail', 'Sender Email')}
                      </Label>
                      <Input
                        id="senderEmail"
                        type="email"
                        value={newItem.senderEmail}
                        onChange={(e) => setNewItem({ ...newItem, senderEmail: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="postedDate">
                      {t('correspondenceSources.mock.field.postedDate', 'Posted Date')}
                    </Label>
                    <Input
                      id="postedDate"
                      type="date"
                      value={newItem.postedDate}
                      onChange={(e) => setNewItem({ ...newItem, postedDate: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddItem} className="w-full" disabled={loading}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('correspondenceSources.mock.action.addItem', 'Add Mock Item')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mock Correspondence Items</CardTitle>
                    <CardDescription>
                      {mockItems.length} items ready to be fetched during sync (auto-refreshes every 5 seconds)
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadItems} disabled={loading}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                    {mockItems.length > 0 && (
                      <Button variant="destructive" size="sm" onClick={handleClearItems} disabled={loading}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('correspondenceSources.mock.action.clearItems', 'Clear All')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {mockItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No mock items. Add items above to test sync functionality.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mockItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="space-y-1 flex-1">
                          <p className="font-medium">{item.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            From: {item.senderName} ({item.senderEmail})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Date: {new Date(item.postedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How to Test</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Add mock correspondence items using the form above</li>
                  <li>Create or edit a correspondence source with type "eDoreczenia (Mock)"</li>
                  <li>Click "Sync Now" on the source to fetch the mock items</li>
                  <li>Check the sync logs to see the results</li>
                  <li>View the created incoming shipments in the Records module</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </PageBody>
      </Page>
    </FeatureGuard>
  )
}

