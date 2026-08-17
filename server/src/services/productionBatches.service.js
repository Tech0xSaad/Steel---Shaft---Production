import { ProductionBatchesRepository as Repo } from '../repositories/productionBatches.repository.js'
import { BomRepository }    from '../repositories/bom.repository.js'
import { AppError }         from '../utils/AppError.js'
import { isValidTransition, BATCH_STATUS } from '../constants/batchStatus.js'
import { logger }           from '../config/logger.js'

export class ProductionBatchesService {

  // ── List ──────────────────────────────────────────────────────
  static list(query) { return Repo.findAll(query) }

  // ── Get full detail ───────────────────────────────────────────
  static getById(id) { return Repo.findById(id) }

  // ── Create batch ──────────────────────────────────────────────
  static async create(payload, actor) {
    // 1. Load the BOM with items to run calculations
    const bom = await BomRepository.findById(payload.bom_id)
    if (!bom.is_active) throw new AppError('Selected BOM is not active.', 422, 'INACTIVE_BOM')
    if (bom.product_id !== payload.product_id) {
      throw new AppError('BOM does not belong to the selected product.', 422, 'BOM_PRODUCT_MISMATCH')
    }

    const product     = bom.product
    const plannedQty  = Number(payload.planned_qty)
    const scrapPct    = Number(product.expected_scrap_pct ?? 0)

    // 2. Auto-calculate
    const expectedYieldQty        = plannedQty * (1 - scrapPct / 100)
    const expectedScrapQty        = plannedQty * (scrapPct / 100)
    const estimatedSetupMin       = Number(product.setup_time_minutes  ?? 0)
    const estimatedCycleMin       = Number(product.cycle_time_minutes  ?? 0) * plannedQty
    const estimatedTotalTimeMin   = estimatedSetupMin + estimatedCycleMin

    // Material cost = Σ (item.quantity_required × plannedQty × (1 + scrap%) × unit_cost)
    const estimatedMaterialCost = (bom.items ?? []).reduce((sum, item) => {
      const unitCost = Number(item.raw_material?.unit_cost ?? 0)
      const reqQty   = Number(item.quantity_required)
      const itemScrap = Number(item.scrap_allowance_pct ?? 0) / 100
      return sum + unitCost * reqQty * plannedQty * (1 + itemScrap)
    }, 0)

    const batchPayload = {
      ...payload,
      batch_number:             payload.batch_number || null,  // trigger fills if null
      machine_id:               payload.machine_id   || null,
      warehouse_id:             payload.warehouse_id || null,
      expected_yield_qty:       Number(expectedYieldQty.toFixed(4)),
      expected_scrap_qty:       Number(expectedScrapQty.toFixed(4)),
      estimated_setup_time_min: Number(estimatedSetupMin.toFixed(2)),
      estimated_cycle_time_min: Number(estimatedCycleMin.toFixed(2)),
      estimated_total_time_min: Number(estimatedTotalTimeMin.toFixed(2)),
      estimated_material_cost:  Number(estimatedMaterialCost.toFixed(4)),
      status:                   BATCH_STATUS.CREATED,
      created_by:               actor?.id ?? null,
    }

    const batch = await Repo.create(batchPayload)

    // 3. Log creation
    await Repo.addLifecycleLog({
      batch_id:    batch.id,
      from_status: null,
      to_status:   BATCH_STATUS.CREATED,
      actor_id:    actor?.id   ?? null,
      actor_email: actor?.email ?? null,
      notes:       'Batch created.',
      metadata:    { planned_qty: plannedQty },
    })

    logger.info(`Batch ${batch.batch_number} created.`)
    return Repo.findById(batch.id)
  }

  // ── Update planning fields (only while status = 'created') ───
  static async update(id, payload, actor) {
    const batch = await Repo.findById(id)
    if (batch.status !== BATCH_STATUS.CREATED) {
      throw new AppError(
        'Planning fields can only be edited while the batch is in "created" status.',
        422, 'INVALID_STATUS'
      )
    }

    // Recalculate if planned_qty changed
    let extra = {}
    if (payload.planned_qty !== undefined) {
      const bom      = await BomRepository.findById(batch.bom_id)
      const product  = bom.product
      const plannedQty = Number(payload.planned_qty)
      const scrapPct   = Number(product.expected_scrap_pct ?? 0)

      extra = {
        expected_yield_qty:       Number((plannedQty * (1 - scrapPct / 100)).toFixed(4)),
        expected_scrap_qty:       Number((plannedQty * (scrapPct / 100)).toFixed(4)),
        estimated_setup_time_min: Number(product.setup_time_minutes ?? 0),
        estimated_cycle_time_min: Number(((product.cycle_time_minutes ?? 0) * plannedQty).toFixed(2)),
        estimated_total_time_min: Number(((product.setup_time_minutes ?? 0) + (product.cycle_time_minutes ?? 0) * plannedQty).toFixed(2)),
        estimated_material_cost:  Number(((bom.items ?? []).reduce((sum, item) => {
          return sum + Number(item.raw_material?.unit_cost ?? 0)
            * Number(item.quantity_required)
            * plannedQty
            * (1 + Number(item.scrap_allowance_pct ?? 0) / 100)
        }, 0)).toFixed(4)),
      }
    }

    return Repo.update(id, { ...payload, ...extra })
  }

  // ── Delete (only from 'created') ─────────────────────────────
  static async remove(id) {
    const batch = await Repo.findById(id)
    if (batch.status !== BATCH_STATUS.CREATED) {
      throw new AppError('Only batches in "created" status can be deleted.', 422, 'INVALID_STATUS')
    }
    return Repo.delete(id)
  }

  // ── Lifecycle transition (state machine) ──────────────────────
  static async transition(id, toStatus, notes, actuals = {}, actor) {
    const batch = await Repo.findById(id)

    if (!isValidTransition(batch.status, toStatus)) {
      throw new AppError(
        `Cannot transition from "${batch.status}" to "${toStatus}".`,
        422, 'INVALID_TRANSITION'
      )
    }

    let extraUpdates = {}

    // ── Status-specific side-effects ──────────────────────────
    switch (toStatus) {

      case BATCH_STATUS.RESERVED:
        await ProductionBatchesService._reserveMaterials(batch, actor)
        break

      case BATCH_STATUS.CREATED: {
        // Un-reserve: return previously reserved stock
        if (batch.status === BATCH_STATUS.RESERVED) {
          await ProductionBatchesService._releaseReservations(batch, actor)
        }
        break
      }

      case BATCH_STATUS.ISSUED:
        // Mark all reservations as 'issued'
        await Repo.updateReservationStatus(id, 'issued', { issued_at: new Date().toISOString() })
        break

      case BATCH_STATUS.PRODUCTION_STARTED:
        extraUpdates.actual_start_at = new Date().toISOString()
        break

      case BATCH_STATUS.COMPLETED:
        extraUpdates.actual_end_at = new Date().toISOString()
        if (actuals.actual_qty_produced != null) extraUpdates.actual_qty_produced = actuals.actual_qty_produced
        if (actuals.actual_qty_scrapped  != null) extraUpdates.actual_qty_scrapped  = actuals.actual_qty_scrapped
        break

      case BATCH_STATUS.CLOSED:
        // If moving from reserved, release stock first
        if (batch.status === BATCH_STATUS.RESERVED) {
          await ProductionBatchesService._releaseReservations(batch, actor)
        }
        // Cancel any remaining open reservations
        await Repo.cancelReservations(id)
        if (actuals.actual_qty_produced != null) extraUpdates.actual_qty_produced = actuals.actual_qty_produced
        if (actuals.actual_qty_scrapped  != null) extraUpdates.actual_qty_scrapped  = actuals.actual_qty_scrapped
        break
    }

    // Update batch status + any extras
    await Repo.updateStatus(id, toStatus, extraUpdates)

    // Log the transition
    await Repo.addLifecycleLog({
      batch_id:    id,
      from_status: batch.status,
      to_status:   toStatus,
      actor_id:    actor?.id    ?? null,
      actor_email: actor?.email ?? null,
      notes:       notes ?? null,
      metadata:    Object.keys(actuals).length ? actuals : null,
    })

    logger.info(`Batch ${batch.batch_number}: ${batch.status} → ${toStatus}`)
    return Repo.findById(id)
  }

  // ── Private: reserve materials ────────────────────────────────
  static async _reserveMaterials(batch, actor) {
    const bom = await BomRepository.findById(batch.bom_id)
    const plannedQty = Number(batch.planned_qty)
    const errors = []

    // Validate all materials have enough stock before touching anything
    for (const item of bom.items ?? []) {
      const needed = Number(item.quantity_required) * plannedQty * (1 + Number(item.scrap_allowance_pct ?? 0) / 100)
      const available = Number(item.raw_material?.current_stock_qty ?? 0)
      if (available < needed) {
        errors.push(
          `${item.raw_material?.code ?? 'Unknown'} — needs ${needed.toFixed(3)} ${item.uom}, ` +
          `available ${available.toFixed(3)} ${item.uom}`
        )
      }
    }

    if (errors.length) {
      throw new AppError(
        `Insufficient stock for reservation:\n${errors.join('\n')}`,
        422, 'INSUFFICIENT_STOCK'
      )
    }

    // All clear — deduct stock and create reservation rows
    const reservationRows = []
    for (const item of bom.items ?? []) {
      const needed = Number(item.quantity_required) * plannedQty * (1 + Number(item.scrap_allowance_pct ?? 0) / 100)
      await Repo.deductReservedStock(item.raw_material_id, needed)
      reservationRows.push({
        batch_id:        batch.id,
        raw_material_id: item.raw_material_id,
        bom_item_id:     item.id,
        required_qty:    Number((Number(item.quantity_required) * plannedQty).toFixed(4)),
        reserved_qty:    Number(needed.toFixed(4)),
        uom:             item.uom,
        status:          'reserved',
        reserved_at:     new Date().toISOString(),
      })
    }

    await Repo.createReservations(reservationRows)
    logger.info(`Batch ${batch.batch_number}: ${reservationRows.length} material lines reserved.`)
  }

  // ── Private: release reservations (return stock) ──────────────
  static async _releaseReservations(batch, actor) {
    // Get current reservation rows to know how much to return
    const full = await Repo.findById(batch.id)
    for (const r of full.reservations ?? []) {
      if (r.status === 'reserved') {
        await Repo.returnStockQty(r.raw_material_id, Number(r.reserved_qty))
      }
    }
    await Repo.cancelReservations(batch.id)
    logger.info(`Batch ${batch.batch_number}: reservations released, stock returned.`)
  }
}
