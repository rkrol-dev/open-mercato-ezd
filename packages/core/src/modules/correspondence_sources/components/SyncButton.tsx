"use client"

import * as React from 'react'
import { Button } from '@open-mercato/ui/primitives/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@open-mercato/ui/primitives/dialog'
import { Loader2 } from 'lucide-react'
import { apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useT } from '@open-mercato/shared/lib/i18n/context'

interface SyncButtonProps {
  sourceId: string
  sourceName: string
  onSyncComplete?: () => void
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
}

interface SyncResult {
  syncLogId: string
  itemsFetched: number
  itemsCreated: number
  itemsFailed: number
  status: string
}

export function SyncButton({ 
  sourceId, 
  sourceName,
  onSyncComplete,
  variant = 'default',
  size = 'default'
}: SyncButtonProps) {
  const t = useT()
  const [syncing, setSyncing] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [showResult, setShowResult] = React.useState(false)
  const [result, setResult] = React.useState<SyncResult | null>(null)

  const handleSync = async () => {
    setShowConfirm(false)
    setSyncing(true)
    
    try {
      const response = await apiCallOrThrow<SyncResult>(`/api/correspondence-sources/sources/${sourceId}/sync`, {
        method: 'POST',
      })
      
      setResult(response as SyncResult)
      setShowResult(true)
      flash(t('correspondenceSources.sources.success.synced', 'Sync completed successfully'), 'success')
      
      if (onSyncComplete) {
        onSyncComplete()
      }
    } catch (error) {
      flash(t('correspondenceSources.sources.error.sync', 'Failed to sync source'), 'error')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowConfirm(true)}
        disabled={syncing}
      >
        {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t('correspondenceSources.sources.action.sync', 'Sync Now')}
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('correspondenceSources.sources.confirm.sync', 'Are you sure you want to sync this source?')}
            </DialogTitle>
            <DialogDescription>
              This will fetch new correspondence items from {sourceName}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSync}>
              {t('common.continue', 'Continue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('correspondenceSources.sync.modal.title', 'Sync Results')}
            </DialogTitle>
            <DialogDescription>
              Synchronization completed for {sourceName}
            </DialogDescription>
          </DialogHeader>
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('correspondenceSources.sync.modal.itemsFetched', 'Items Fetched')}
                  </p>
                  <p className="text-2xl font-bold">{result.itemsFetched}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('correspondenceSources.sync.modal.itemsCreated', 'Items Created')}
                  </p>
                  <p className="text-2xl font-bold text-green-600">{result.itemsCreated}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('correspondenceSources.sync.modal.itemsFailed', 'Items Failed')}
                  </p>
                  <p className="text-2xl font-bold text-red-600">{result.itemsFailed}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('correspondenceSources.sync.modal.status', 'Status')}
                  </p>
                  <p className="text-lg font-semibold">{result.status}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowResult(false)}>
              {t('correspondenceSources.sync.modal.close', 'Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
