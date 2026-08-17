import { QualityRepository as Repo }       from '../repositories/quality.repository.js'
import { FinishedGoodsRepository as FgRepo } from '../repositories/finishedGoods.repository.js'
import { ScrapRepository as ScrapRepo }      from '../repositories/scrap.repository.js'
import { InventoryRepository as InvRepo }    from '../repositories/inventory.repository.js'
import { AppError }   from '../utils/AppError.js'
import { logger }     from '../config/logger.js'
import { supabaseAdmin } from '../config/supabase.js'
import { INSPECTION_STATUS } from '../constants/inventoryTypes.js'
import { FG_MOVEMENT_TYPE }  from '../constants/inventoryTypes.js'

/**
 * QualityService
 *
 * Responsibilities:
 *  1. CRUD for quality_checks (inspection records)
 *  2. Submitting an inspection result (pass/reject/partial)
 *     — approved qty → moves to Finished Goods inventory
 *     — rejected qty → creates scrap_records automatically
 *  3. Batch completion logic
 *     — calculates yield, rejection, scrap, utilisation KPIs
 *     — writes batch_completion_summary
 *     — can trigger batch → completed transition
 */
export class QualityService {

  // ── Queries ───────────────────────────────────────────────────
  static list(query)          { return Repo.findAll(query) }
  static getById(id)          { return Repo.findById(id) }
  static getByBatch(batchId)  { return Repo.findByBatchId(batchId) }

  // ── Create inspection record ──────────────────────────────────
  static async create(payload, actor) {
    // Validate batch exists and is in the right state
    const batch = await QualityService._loadBatch(payload.batch_id)
    if (batch.status === 'closed') {
      throw new AppError('Cannot create a quality check for a closed batch.', 422, 'INVALID_STATUS')
    }

    const checkNumber = await Repo.getNextCheckNumber(payload.batch_id)

    const insertPayload = {
      batch_id:          payload.batch_id,
      check_number:      checkNumber,
      inspector_name:    payload.inspector_name    || null,
      inspection_date:   payload.inspection_date   || new Date().toISOString().slice(0, 10),
      inspection_start_at: payload.inspection_start_at || null,
      inspection_end_at:   payload.inspection_end_at   || null,
      qty_inspected:     Number(payload.qty_inspected ?? 0),
      qty_passed:        0,
      qty_rejected:      0,
      qty_on_hold:       0,
      uom:               payload.uom || 'pcs',
      rejection_reasons: payload.rejection_reasons || null,
      rejection_notes:   payload.rejection_notes   || null,
      parameters:        payload.parameters        || null,
      report_reference:  payload.report_reference  || null,
      notes:             payload.notes             || null,
      status:            INSPECTION_STATUS.PENDING,
      created_by:        actor?.id ?? null,
    }

    const qc = await Repo.create(insertPayload)
    logger.info(`Quality check #${checkNumber} created for batch ${batch.batch_number}`)
    return Repo.findById(qc.id)
  }

  // ── Update check details (only while pending / in_progress) ──
  static async update(id, payload, actor) {
    const qc = await Repo.findById(id)
    if (qc.status === INSPECTION_STATUS.PASSED ||
        qc.status === INSPECTION_STATUS.FAILED  ||
        qc.status === INSPECTION_STATUS.PARTIALLY_PASSED) {
      throw new AppError(
        'Cannot edit a quality check that has already been submitted.',
        422, 'INVALID_STATUS'
      )
    }
    return Repo.update(id, payload)
  }

  // ── Delete (only pending checks) ──────────────────────────────
  static async delete(id) {
    const qc = await Repo.findById(id)
    if (qc.status !== INSPECTION_STATUS.PENDING) {
      throw new AppError('Only pending quality checks can be deleted.', 422, 'INVALID_STATUS')
    }
    return Repo.delete(id)
  }

  /**
   * Submit an inspection result.
   *
   * Side-effects:
   *  1. qty_passed → moved to Finished Goods (FG inventory + ledger)
   *  2. qty_rejected → scrap_record created + WIP adjusted
   *  3. Quality check status updated
   *  4. batch.actual_qty_produced / actual_qty_scrapped refreshed
   *  5. batch_completion_summary upserted
   *
   * @param {string} id              quality_check id
   * @param {object} payload         { qty_passed, qty_rejected, qty_on_hold,
   *                                   rejection_reasons, rejection_notes,
   *                                   parameters, report_reference,
   *                                   inspection_end_at, notes,
   *                                   scrap_category, scrap_description }
   * @param {object} actor           req.user
   */
  static async submitResult(id, payload, actor) {
    const qc    = await Repo.findById(id)
    const batch = await QualityService._loadBatch(qc.batch_id)

    if (qc.status === INSPECTION_STATUS.PASSED ||
        qc.status === INSPECTION_STATUS.FAILED  ||
        qc.status === INSPECTION_STATUS.PARTIALLY_PASSED) {
      throw new AppError('This inspection has already been submitted.', 422, 'ALREADY_SUBMITTED')
    }

    const qtyPassed   = Number(payload.qty_passed   ?? 0)
    const qtyRejected = Number(payload.qty_rejected  ?? 0)
    const qtyOnHold   = Number(payload.qty_on_hold   ?? 0)
    const qtyInspected = Number(qc.qty_inspected ?? (qtyPassed + qtyRejected + qtyOnHold))

    if (qtyPassed < 0 || qtyRejected < 0 || qtyOnHold < 0) {
      throw new AppError('Quantities cannot be negative.', 422, 'INVALID_QTY')
    }

    // Determine status
    let newStatus
    if (qtyPassed > 0 && qtyRejected === 0 && qtyOnHold === 0) {
      newStatus = INSPECTION_STATUS.PASSED
    } else if (qtyPassed === 0 && qtyRejected > 0) {
      newStatus = INSPECTION_STATUS.FAILED
    } else if (qtyOnHold > 0 && qtyPassed === 0 && qtyRejected === 0) {
      newStatus = INSPECTION_STATUS.ON_HOLD
    } else {
      newStatus = INSPECTION_STATUS.PARTIALLY_PASSED
    }

    // ── 1. Move passed qty → Finished Goods ───────────────────
    if (qtyPassed > 0) {
      await QualityService._moveToFinishedGoods({
        batch,
        qcId:        id,
        qtyPassed,
        warehouseId: batch.warehouse_id,
        actor,
      })
    }

    // ── 2. Create scrap record for rejected qty ────────────────
    if (qtyRejected > 0) {
      const unitCost = Number(batch.product?.unit_cost ?? 0)
      await ScrapRepo.create({
        batch_id:         qc.batch_id,
        quality_check_id: id,
        scrap_date:       payload.inspection_end_at
                            ? new Date(payload.inspection_end_at).toISOString().slice(0, 10)
                            : new Date().toISOString().slice(0, 10),
        scrap_category:   payload.scrap_category   || 'other',
        description:      payload.scrap_description ||
                            (payload.rejection_notes ? payload.rejection_notes.substring(0, 255) : null),
        qty_scrapped:     qtyRejected,
        uom:              qc.uom || 'pcs',
        unit_cost:        unitCost,
        total_scrap_cost: Number((unitCost * qtyRejected).toFixed(4)),
        created_by:       actor?.id ?? null,
      })
    }

    // ── 3. Update the quality check record ────────────────────
    await Repo.update(id, {
      qty_passed:           qtyPassed,
      qty_rejected:         qtyRejected,
      qty_on_hold:          qtyOnHold,
      qty_inspected:        qtyInspected,
      status:               newStatus,
      inspection_end_at:    payload.inspection_end_at || new Date().toISOString(),
      rejection_reasons:    payload.rejection_reasons || qc.rejection_reasons,
      rejection_notes:      payload.rejection_notes   || null,
      parameters:           payload.parameters        || qc.parameters,
      report_reference:     payload.report_reference  || qc.report_reference,
      notes:                payload.notes             || qc.notes,
    })

    // ── 4. Sync batch actuals + build completion summary ──────
    await QualityService._syncBatchActuals(qc.batch_id)
    await QualityService._upsertCompletionSummary(qc.batch_id)

    logger.info(`Quality check ${id} submitted: passed=${qtyPassed}, rejected=${qtyRejected}, status=${newStatus}`)
    return Repo.findById(id)
  }

  // ── Completion summary ────────────────────────────────────────
  static getCompletionSummary(batchId) {
    return Repo.findCompletionByBatchId(batchId)
  }

  // ── Private: move passed qty to Finished Goods ────────────────
  static async _moveToFinishedGoods({ batch, qcId, qtyPassed, warehouseId, actor }) {
    const productId = batch.product_id
    const unitCost  = Number(batch.estimated_material_cost ?? 0) /
                      Math.max(Number(batch.planned_qty ?? 1), 1)

    const { balanceBefore, balanceAfter } = await FgRepo.addFgStock(
      productId, warehouseId ?? null, qtyPassed, unitCost
    )

    await FgRepo.insertTransaction({
      product_id:       productId,
      warehouse_id:     warehouseId || null,
      batch_id:         batch.id,
      quality_check_id: qcId,
      movement_type:    FG_MOVEMENT_TYPE.PRODUCTION_RECEIPT,
      quantity:         qtyPassed,
      uom:              'pcs',
      balance_before:   balanceBefore,
      balance_after:    balanceAfter,
      unit_cost:        Number(unitCost.toFixed(4)),
      total_cost:       Number((unitCost * qtyPassed).toFixed(4)),
      actor_id:         actor?.id    ?? null,
      actor_email:      actor?.email ?? null,
      notes:            `Received from batch ${batch.batch_number} QC check`,
    })

    logger.info(`FG: moved ${qtyPassed} pcs of product ${productId} from batch ${batch.batch_number}`)
  }

  // ── Private: sync batch actual qty fields from QC + ops totals ─
  static async _syncBatchActuals(batchId) {
    const qcTotals    = await Repo.getQcTotalsForBatch(batchId)
    const scrapTotals = await ScrapRepo.getTotalsForBatch(batchId)

    const update = {}
    if (qcTotals.qty_passed > 0 || qcTotals.qty_rejected > 0) {
      update.actual_qty_produced = Number((qcTotals.qty_passed + qcTotals.qty_rejected).toFixed(4))
      update.actual_qty_scrapped = Number(scrapTotals.total_qty.toFixed(4))
    }

    if (Object.keys(update).length) {
      const { error } = await supabaseAdmin
        .from('production_batches')
        .update(update)
        .eq('id', batchId)
      if (error) logger.warn(`Failed to sync batch actuals: ${error.message}`)
    }
  }

  // ── Private: upsert batch_completion_summary ──────────────────
  static async _upsertCompletionSummary(batchId) {
    const batch = await QualityService._loadBatch(batchId)
    const qcTotals    = await Repo.getQcTotalsForBatch(batchId)
    const scrapTotals = await ScrapRepo.getTotalsForBatch(batchId)

    // Material issued = sum of wip_inventory qty_issued for this batch
    const { data: wipData } = await supabaseAdmin
      .from('wip_inventory')
      .select('qty_issued')
      .eq('batch_id', batchId)
    const totalMaterialIssued = (wipData ?? []).reduce((s, w) => s + Number(w.qty_issued ?? 0), 0)

    const qtyProduced  = Number(batch.actual_qty_produced ?? 0)
    const qtyPassedQc  = qcTotals.qty_passed
    const qtyRejectedQc = qcTotals.qty_rejected
    const qtyScrapped  = scrapTotals.total_qty
    const plannedQty   = Number(batch.planned_qty ?? 1)

    // FG moves for this batch
    const { data: fgData } = await supabaseAdmin
      .from('finished_goods_transactions')
      .select('quantity')
      .eq('batch_id', batchId)
      .eq('movement_type', 'production_receipt')
    const qtyMovedToFg = (fgData ?? []).reduce((s, t) => s + Number(t.quantity ?? 0), 0)

    // Cycle time
    const actualStartAt    = batch.actual_start_at  ? new Date(batch.actual_start_at)  : null
    const actualEndAt      = batch.actual_end_at    ? new Date(batch.actual_end_at)    : null
    const actualCycleMin   = (actualStartAt && actualEndAt)
      ? Number(((actualEndAt - actualStartAt) / 60000).toFixed(2))
      : null
    const plannedCycleMin  = Number(batch.estimated_total_time_min ?? 0) || null
    const timeEffPct       = (actualCycleMin && plannedCycleMin && plannedCycleMin > 0)
      ? Number(((plannedCycleMin / actualCycleMin) * 100).toFixed(3))
      : null

    const summary = {
      batch_id:                batchId,
      planned_qty:             plannedQty,
      total_material_issued:   Number(totalMaterialIssued.toFixed(4)),
      qty_produced:            Number(qtyProduced.toFixed(4)),
      qty_passed_qc:           Number(qtyPassedQc.toFixed(4)),
      qty_rejected_qc:         Number(qtyRejectedQc.toFixed(4)),
      qty_scrapped:            Number(qtyScrapped.toFixed(4)),
      qty_rework:              0,   // rework tracked in ops — placeholder
      qty_moved_to_fg:         Number(qtyMovedToFg.toFixed(4)),
      yield_pct:               plannedQty > 0
                                 ? Number(((qtyPassedQc / plannedQty) * 100).toFixed(3))
                                 : null,
      rejection_pct:           qtyProduced > 0
                                 ? Number(((qtyRejectedQc / qtyProduced) * 100).toFixed(3))
                                 : null,
      scrap_pct:               qtyProduced > 0
                                 ? Number(((qtyScrapped / qtyProduced) * 100).toFixed(3))
                                 : null,
      material_utilization_pct: totalMaterialIssued > 0
                                 ? Number(((qtyProduced / totalMaterialIssued) * 100).toFixed(3))
                                 : null,
      actual_cycle_time_min:   actualCycleMin,
      planned_cycle_time_min:  plannedCycleMin,
      time_efficiency_pct:     timeEffPct,
      completed_at:            batch.actual_end_at || null,
    }

    return Repo.upsertCompletion(summary)
  }

  // ── Private: load batch with product ─────────────────────────
  static async _loadBatch(batchId) {
    const { data, error } = await supabaseAdmin
      .from('production_batches')
      .select('*, product:products ( id, code, name, unit_cost )')
      .eq('id', batchId)
      .single()
    if (error) throw new AppError('Production batch not found.', 404, 'NOT_FOUND')
    return data
  }
}
