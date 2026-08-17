import { ScrapRepository as Repo } from '../repositories/scrap.repository.js'
import { AppError }  from '../utils/AppError.js'
import { logger }    from '../config/logger.js'
import { supabaseAdmin } from '../config/supabase.js'

/**
 * ScrapService
 *
 * Manages scrap_records independently of Quality.
 * Quality service auto-creates scrap on inspection rejection,
 * but Admin can also log scrap directly (e.g. shop-floor scrap
 * identified before formal QC, or material waste during machining).
 */
export class ScrapService {

  // ── Queries ───────────────────────────────────────────────────
  static list(query)         { return Repo.findAll(query) }
  static getById(id)         { return Repo.findById(id) }
  static getByBatch(batchId) { return Repo.findByBatchId(batchId) }
  static getSummaryByCategory(query) { return Repo.getSummaryByCategory(query) }

  // ── Create ────────────────────────────────────────────────────
  static async create(payload, actor) {
    // Validate the batch exists
    await ScrapService._loadBatch(payload.batch_id)

    const qty      = Number(payload.qty_scrapped)
    const unitCost = Number(payload.unit_cost ?? 0)

    const insertPayload = {
      batch_id:           payload.batch_id,
      quality_check_id:   payload.quality_check_id    || null,
      batch_operation_id: payload.batch_operation_id  || null,
      scrap_date:         payload.scrap_date           || new Date().toISOString().slice(0, 10),
      scrap_category:     payload.scrap_category       || 'other',
      description:        payload.description          || null,
      qty_scrapped:       qty,
      weight_kg:          payload.weight_kg            ? Number(payload.weight_kg) : null,
      uom:                payload.uom                  || 'pcs',
      machine_id:         payload.machine_id           || null,
      department:         payload.department           || null,
      operator_name:      payload.operator_name        || null,
      unit_cost:          unitCost,
      total_scrap_cost:   Number((unitCost * qty).toFixed(4)),
      disposal_method:    payload.disposal_method      || null,
      disposal_notes:     payload.disposal_notes       || null,
      disposed_at:        payload.disposed_at          || null,
      notes:              payload.notes                || null,
      created_by:         actor?.id ?? null,
    }

    const record = await Repo.create(insertPayload)
    logger.info(`Scrap: ${qty} ${insertPayload.uom} recorded for batch ${payload.batch_id} — ${insertPayload.scrap_category}`)
    return record
  }

  // ── Update ────────────────────────────────────────────────────
  static async update(id, payload, actor) {
    const existing = await Repo.findById(id)

    // Recalculate total_scrap_cost if qty or unit_cost changed
    const qty      = Number(payload.qty_scrapped ?? existing.qty_scrapped)
    const unitCost = Number(payload.unit_cost    ?? existing.unit_cost ?? 0)

    const updatePayload = {
      ...payload,
      total_scrap_cost: Number((unitCost * qty).toFixed(4)),
    }

    return Repo.update(id, updatePayload)
  }

  // ── Delete ────────────────────────────────────────────────────
  static async delete(id) {
    return Repo.delete(id)
  }

  // ── Mark as disposed ──────────────────────────────────────────
  static async markDisposed(id, payload) {
    await Repo.findById(id)
    return Repo.update(id, {
      disposal_method: payload.disposal_method || null,
      disposal_notes:  payload.disposal_notes  || null,
      disposed_at:     payload.disposed_at     || new Date().toISOString(),
    })
  }

  // ── Totals for a batch ────────────────────────────────────────
  static getTotalsForBatch(batchId) {
    return Repo.getTotalsForBatch(batchId)
  }

  // ── Private helpers ───────────────────────────────────────────
  static async _loadBatch(batchId) {
    const { data, error } = await supabaseAdmin
      .from('production_batches')
      .select('id, batch_number, status')
      .eq('id', batchId)
      .single()
    if (error) throw new AppError('Production batch not found.', 404, 'NOT_FOUND')
    if (data.status === 'closed') {
      throw new AppError('Cannot record scrap for a closed batch.', 422, 'INVALID_STATUS')
    }
    return data
  }
}
