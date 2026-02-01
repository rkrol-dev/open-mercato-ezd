import type { EntityManager } from '@mikro-orm/postgresql'
import { parse as parseCsv } from 'csv-parse/sync'
import { RecordsJrwaClass } from '../data/entities'
import { jrwaImportCsvRowSchema } from '../data/validators'
import { CrudHttpError } from '@open-mercato/shared/lib/crud/errors'

export interface ParsedCsvRow {
  code: string
  name: string
  description?: string
  parentCode?: string
  retentionYears?: number | null
  retentionCategory?: 'A' | 'B' | 'BE' | 'Bc' | null
  archivalPackageVariant?: string | null
}

export interface CsvValidationResult {
  valid: boolean
  errors?: string[]
  rowCount?: number
  warnings?: string[]
}

export class JrwaImportService {
  constructor(private readonly em: EntityManager) {}

  private parseCsvToRecords(csvData: string): Record<string, string>[] {
    try {
      return parseCsv(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } catch (error) {
      throw new CrudHttpError(400, {
        error: `CSV parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  private transformRow(validated: any): ParsedCsvRow {
    const parsedRow: ParsedCsvRow = {
      code: validated.code,
      name: validated.name,
      description: validated.description,
      parentCode: validated.parentCode,
    }

    if (validated.retentionYears) {
      const years = parseInt(validated.retentionYears, 10)
      if (!isNaN(years) && years >= 0) {
        parsedRow.retentionYears = years
      }
    }

    if (validated.retentionCategory) {
      const category = validated.retentionCategory.trim()
      if (['A', 'B', 'BE', 'Bc'].includes(category)) {
        parsedRow.retentionCategory = category as 'A' | 'B' | 'BE' | 'Bc'
      }
    }

    if (validated.archivalPackageVariant) {
      parsedRow.archivalPackageVariant = validated.archivalPackageVariant
    }

    return parsedRow
  }

  parseAndValidateCsv(csvData: string): CsvValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    let records: Record<string, string>[]
    try {
      records = this.parseCsvToRecords(csvData)
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'CSV parse error'],
      }
    }

    if (!records.length) {
      return {
        valid: false,
        errors: ['CSV file is empty'],
      }
    }

    const validatedRows: ParsedCsvRow[] = []
    const codes = new Set<string>()

    records.forEach((row, index) => {
      const rowNum = index + 2

      try {
        const validated = jrwaImportCsvRowSchema.parse(row)

        if (codes.has(validated.code)) {
          errors.push(`Row ${rowNum}: Duplicate code "${validated.code}"`)
        } else {
          codes.add(validated.code)
        }

        const parsedRow = this.transformRow(validated)

        if (validated.retentionYears) {
          const years = parseInt(validated.retentionYears, 10)
          if (isNaN(years) || years < 0) {
            warnings.push(`Row ${rowNum}: Invalid retentionYears "${validated.retentionYears}", ignoring`)
          }
        }

        if (validated.retentionCategory) {
          const category = validated.retentionCategory.trim()
          if (!['A', 'B', 'BE', 'Bc'].includes(category)) {
            warnings.push(`Row ${rowNum}: Invalid retentionCategory "${category}", ignoring`)
          }
        }

        validatedRows.push(parsedRow)
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Validation error'}`)
      }
    })

    if (errors.length) {
      return {
        valid: false,
        errors,
        rowCount: records.length,
      }
    }

    return {
      valid: true,
      rowCount: validatedRows.length,
      warnings: warnings.length ? warnings : undefined,
    }
  }

  async importClasses(
    organizationId: string,
    tenantId: string,
    version: number,
    csvData: string
  ): Promise<{ imported: number; skipped: number }> {
    const validationResult = this.parseAndValidateCsv(csvData)

    if (!validationResult.valid) {
      throw new CrudHttpError(400, {
        error: 'CSV validation failed',
        details: validationResult.errors,
      })
    }

    const records = this.parseCsvToRecords(csvData)
    const parsedRows = records.map(row => {
      const validated = jrwaImportCsvRowSchema.parse(row)
      return this.transformRow(validated)
    })

    return this.em.transactional(async (em) => {
      const codeToIdMap = new Map<string, string>()
      let imported = 0

      for (const row of parsedRows) {
        let parentId: string | null = null

        if (row.parentCode) {
          parentId = codeToIdMap.get(row.parentCode) ?? null
          if (!parentId) {
            const parentEntity = await em.findOne(RecordsJrwaClass, {
              organizationId,
              tenantId,
              code: row.parentCode,
              version,
              deletedAt: null,
            })
            if (parentEntity) {
              parentId = parentEntity.id
              codeToIdMap.set(row.parentCode, parentId)
            }
          }
        }

        const jrwaClass = em.create(RecordsJrwaClass, {
          organizationId,
          tenantId,
          code: row.code,
          name: row.name,
          description: row.description || null,
          parentId,
          retentionYears: row.retentionYears ?? null,
          retentionCategory: row.retentionCategory ?? null,
          archivalPackageVariant: row.archivalPackageVariant ?? null,
          version,
          isActive: true,
        })

        await em.persist(jrwaClass)
        codeToIdMap.set(row.code, jrwaClass.id)
        imported++
      }

      await em.flush()

      return { imported, skipped: 0 }
    })
  }
}
