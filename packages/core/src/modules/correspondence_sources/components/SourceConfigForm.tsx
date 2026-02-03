"use client"

import * as React from 'react'
import type { CrudField } from '@open-mercato/ui/backend/CrudForm'
import { useT } from '@open-mercato/shared/lib/i18n/context'

interface SourceConfigFormProps {
  sourceType: 'edoreczenia-mock' | 'epuap' | 'email'
}

export function getConfigFields(sourceType: string, t: (key: string, fallback: string) => string): CrudField[] {
  switch (sourceType) {
    case 'edoreczenia-mock':
      return [
        {
          id: 'config.mockEndpoint',
          label: t('correspondenceSources.sources.config.mockEndpoint', 'Mock Endpoint'),
          type: 'text',
          layout: 'full',
          placeholder: 'http://localhost:3000/api/mock/edoreczenia',
        },
        {
          id: 'config.autoFetchEnabled',
          label: t('correspondenceSources.sources.config.autoFetchEnabled', 'Auto Fetch Enabled'),
          type: 'checkbox',
          layout: 'half',
        },
        {
          id: 'config.fetchIntervalMinutes',
          label: t('correspondenceSources.sources.config.fetchIntervalMinutes', 'Fetch Interval (Minutes)'),
          type: 'number',
          layout: 'half',
          placeholder: '15',
        },
      ]
    
    case 'epuap':
      return [
        {
          id: 'config.endpointUrl',
          label: t('correspondenceSources.sources.config.endpointUrl', 'Endpoint URL'),
          type: 'text',
          required: true,
          layout: 'full',
          placeholder: 'https://epuap.gov.pl/...',
        },
        {
          id: 'config.clientId',
          label: t('correspondenceSources.sources.config.clientId', 'Client ID'),
          type: 'text',
          required: true,
          layout: 'half',
        },
        {
          id: 'config.clientSecret',
          label: t('correspondenceSources.sources.config.clientSecret', 'Client Secret'),
          type: 'text',
          required: true,
          layout: 'half',
        },
        {
          id: 'config.certificatePath',
          label: t('correspondenceSources.sources.config.certificatePath', 'Certificate Path'),
          type: 'text',
          layout: 'full',
          placeholder: '/path/to/certificate.pem',
        },
      ]
    
    case 'email':
      return [
        {
          id: 'config.imapHost',
          label: t('correspondenceSources.sources.config.imapHost', 'IMAP Host'),
          type: 'text',
          required: true,
          layout: 'half',
          placeholder: 'imap.example.com',
        },
        {
          id: 'config.imapPort',
          label: t('correspondenceSources.sources.config.imapPort', 'IMAP Port'),
          type: 'number',
          required: true,
          layout: 'half',
          placeholder: '993',
        },
        {
          id: 'config.imapUsername',
          label: t('correspondenceSources.sources.config.imapUsername', 'IMAP Username'),
          type: 'text',
          required: true,
          layout: 'half',
        },
        {
          id: 'config.imapPassword',
          label: t('correspondenceSources.sources.config.imapPassword', 'IMAP Password'),
          type: 'text',
          required: true,
          layout: 'half',
        },
        {
          id: 'config.imapSecure',
          label: t('correspondenceSources.sources.config.imapSecure', 'IMAP Secure (SSL/TLS)'),
          type: 'checkbox',
          layout: 'half',
        },
        {
          id: 'config.folderName',
          label: t('correspondenceSources.sources.config.folderName', 'Folder Name'),
          type: 'text',
          layout: 'half',
          placeholder: 'INBOX',
        },
      ]
    
    default:
      return []
  }
}
