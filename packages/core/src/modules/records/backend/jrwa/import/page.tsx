"use client"

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageHeader, PageBody } from '@open-mercato/ui/backend/Page'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { Label } from '@open-mercato/ui/primitives/label'
import { apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { FeatureGuard } from '@open-mercato/core/modules/feature_toggles/components/FeatureGuard'
import { Alert, AlertDescription, AlertTitle } from '@open-mercato/ui/primitives/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

type ValidationResult = {
  valid: boolean
  errors?: Array<{ line: number; message: string }>
  count?: number
}

type ImportResult = {
  success: boolean
  count?: number
  errors?: string[]
}

export default function ImportJrwaPage() {
  const t = useT()
  const router = useRouter()
  const [version, setVersion] = React.useState('')
  const [file, setFile] = React.useState<File | null>(null)
  const [validating, setValidating] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  const [validationResult, setValidationResult] = React.useState<ValidationResult | null>(null)
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setValidationResult(null)
      setImportResult(null)
    }
  }

  const handleValidate = async () => {
    if (!file || !version) {
      flash(t('validation.required', 'Please provide both version and file'), 'error')
      return
    }

    setValidating(true)
    setValidationResult(null)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('version', version)

      const response = await apiCallOrThrow<ValidationResult>('/api/records/jrwa-classes/validate-csv', {
        method: 'POST',
        body: formData,
      })

      setValidationResult(response.result!)
      
      if (response.result?.valid) {
        flash(t('records.jrwa.import.validation.valid', 'CSV is valid'), 'success')
      } else {
        flash(t('records.jrwa.import.validation.invalid', 'CSV has errors'), 'error')
      }
    } catch (error) {
      flash(t('records.jrwa.error.validate', 'Failed to validate CSV'), 'error')
    } finally {
      setValidating(false)
    }
  }

  const handleImport = async () => {
    if (!file || !version || !validationResult?.valid) return

    setImporting(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('version', version)

      const response = await apiCallOrThrow<ImportResult>('/api/records/jrwa-classes/import', {
        method: 'POST',
        body: formData,
      })

      setImportResult(response.result!)
      
      if (response.result?.success) {
        const count = response.result.count || 0
        flash(
          t('records.jrwa.success.imported', `Successfully imported ${count} classes`).replace('{count}', String(count)),
          'success'
        )
        
        setTimeout(() => {
          router.push('/backend/records/jrwa')
        }, 2000)
      } else {
        flash(t('records.jrwa.error.import', 'Failed to import JRWA classes'), 'error')
      }
    } catch (error) {
      flash(t('records.jrwa.error.import', 'Failed to import JRWA classes'), 'error')
    } finally {
      setImporting(false)
    }
  }

  return (
    <FeatureGuard id="records_jrwa_classes">
      <Page>
        <PageHeader
          title={t('records.jrwa.import.title', 'Import JRWA from CSV')}
          description={t('records.jrwa.import.description', 'Import JRWA classifications from CSV file')}
        />
        <PageBody>
          <div className="max-w-2xl space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="version">{t('records.jrwa.import.field.version', 'Version Number')}</Label>
                <Input
                  id="version"
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g., 2024"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="file">{t('records.jrwa.import.field.file', 'CSV File')}</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleValidate}
                  disabled={validating || !version || !file}
                  variant="outline"
                >
                  {validating 
                    ? t('common.loading', 'Loading...') 
                    : t('records.jrwa.action.validate', 'Validate CSV')
                  }
                </Button>

                <Button
                  onClick={handleImport}
                  disabled={importing || !validationResult?.valid}
                >
                  {importing 
                    ? t('common.loading', 'Loading...') 
                    : t('records.jrwa.action.import', 'Import')
                  }
                </Button>
              </div>
            </div>

            {validationResult && (
              <Alert variant={validationResult.valid ? 'default' : 'destructive'}>
                {validationResult.valid ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{t('records.jrwa.import.validation.title', 'Validation Results')}</AlertTitle>
                <AlertDescription>
                  {validationResult.valid ? (
                    <p>
                      {t('records.jrwa.import.validation.valid', 'CSV is valid').replace(
                        '{count}',
                        String(validationResult.count || 0)
                      )}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p>
                        {t('records.jrwa.import.validation.invalid', 'CSV has errors').replace(
                          '{count}',
                          String(validationResult.errors?.length || 0)
                        )}
                      </p>
                      {validationResult.errors && validationResult.errors.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {validationResult.errors.slice(0, 10).map((error, idx) => (
                            <li key={idx}>
                              Line {error.line}: {error.message}
                            </li>
                          ))}
                          {validationResult.errors.length > 10 && (
                            <li className="text-muted-foreground">
                              ... and {validationResult.errors.length - 10} more errors
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {importResult && (
              <Alert variant={importResult.success ? 'default' : 'destructive'}>
                {importResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{t('records.jrwa.import.results.title', 'Import Results')}</AlertTitle>
                <AlertDescription>
                  {importResult.success ? (
                    <p>
                      {t('records.jrwa.import.results.success', 'Successfully imported').replace(
                        '{count}',
                        String(importResult.count || 0)
                      )}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {importResult.errors?.map((error, idx) => (
                        <p key={idx} className="text-sm">{error}</p>
                      ))}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => router.push('/backend/records/jrwa')}>
                {t('common.back', 'Back')}
              </Button>
            </div>
          </div>
        </PageBody>
      </Page>
    </FeatureGuard>
  )
}

