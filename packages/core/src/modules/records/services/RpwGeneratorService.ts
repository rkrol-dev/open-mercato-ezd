import type { EntityManager } from '@mikro-orm/postgresql'

export interface RpwGenerationResult {
  rpwNumber: string
  rpwSequence: number
}

export class RpwGeneratorService {
  constructor(private readonly em: EntityManager) {}

  async generateRpwNumber(
    organizationId: string,
    tenantId: string,
    receivingOrgUnitId: string,
    receivingOrgUnitSymbol: string,
    year: number
  ): Promise<RpwGenerationResult> {
    const knex = this.em.getKnex()

    const result = await knex.raw(
      `
      INSERT INTO records_rpw_sequences (organization_id, tenant_id, receiving_org_unit_id, year, current_value)
      VALUES (?, ?, ?, ?, 1)
      ON CONFLICT (organization_id, tenant_id, receiving_org_unit_id, year)
      DO UPDATE SET current_value = records_rpw_sequences.current_value + 1
      RETURNING current_value
      `,
      [organizationId, tenantId, receivingOrgUnitId, year]
    )

    const currentValue = result.rows[0]?.current_value as number

    if (!currentValue) {
      throw new Error('Failed to generate RPW sequence number')
    }

    const paddedSequence = String(currentValue).padStart(5, '0')
    const rpwNumber = `RPW/${receivingOrgUnitSymbol}/${paddedSequence}/${year}`

    return {
      rpwNumber,
      rpwSequence: currentValue,
    }
  }
}
