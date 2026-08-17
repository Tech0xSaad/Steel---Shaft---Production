import { ManufacturingRepository as Repo } from '../repositories/manufacturing.repository.js'
import { AppError }         from '../utils/AppError.js'
import { logger }           from '../config/logger.js'
import { isValidOpTransition, OP_STATUS } from '../constants/operationStatus.js'
import { supabaseAdmin }    from '../config/supabase.js'

export class ManufacturingService {

  // ── Operation Types ───────────────────────────────────────────
  static listOpTypes(activeOnly)   { return Repo.findAllOpTypes(activeOnly) }
  static getOpTypeById(id)         { return Repo.findOpTypeById(id) }
  static createOpType(payload)     { return Repo.createOpType(payload) }
  static updateOpType(id, payload) { return Repo.updateOpType(id, payload) }

  // ── Batch Operations ──────────────────────────────────────────
  static getOperationsByBatch(batchId) { return Repo.findOperationsByBatch(batchId) }
  static listOperations(query)         { return Repo.findAllOperations(query) }
  static getOperationById(id)          { return Repo.findOperationById(id) }

  /**
   * Add an operation to a batch.
   * Validates the batch is in a state that allows editing (not closed).
   */
  static async addOperation(batchId, payload, actor) {
    // Guard: batch must not be closed
    const { data: batch, error } = await supabaseAdmin
      .from('production_batches').select('id, status, batch_number, planned_qty').eq('id', batchId).single()
    if (error) throw new AppError('Batch not found.', 404, 'NOT_FOUND')
    if (batch.status === 'closed') throw new AppError('Cannot add operations to a closed batch.', 422, 'INVALID_STATUS')

    const opType = await Repo.findOpTypeById(payload.operation_type_id)

    const insertPayload = {
      batch_id:          batchId,
      operation_type_id: payload.operation_type_id,
      sequence_no:       payload.sequence_no ?? opType.sequence_no,
      machine_id:        payload.machine_id  || null,
      operator_name:     payload.operator_name || null,
      planned_qty:       payload.planned_qty  ?? batch.planned_qty,
      planned_start_at:  payload.planned_start_at || null,
      planned_end_at:    payload.planned_end_at   || null,
      notes:             payload.notes            || null,
      status:            OP_STATUS.PENDING,
      created_by:        actor?.id ?? null,
    }

    const op = await Repo.createOperation(insertPayload)
    logger.info(`Operation "${opType.name}" added to batch ${batch.batch_number}`)
    return op
  }

  /**
   * Update planning fields of a pending operation.
   */
  static async updateOperation(id, payload, actor) {
    const op = await Repo.findOperationById(id)
    if (op.status === OP_STATUS.COMPLETED || op.status === OP_STATUS.SKIPPED) {
      throw new AppError('Cannot edit a completed or skipped operation.', 422, 'INVALID_STATUS')
    }
    return Repo.updateOperation(id, { ...payload, updated_by: actor?.id ?? null })
  }

  /**
   * Delete an operation (only allowed while pending).
   */
  static async deleteOperation(id) {
    const op = await Repo.findOperationById(id)
    if (op.status !== OP_STATUS.PENDING) {
      throw new AppError('Only pending operations can be deleted.', 422, 'INVALID_STATUS')
    }
    return Repo.deleteOperation(id)
  }

  /**
   * Transition an operation's status.
   * Side-effects:
   *   in_progress  → record actual_start_at
   *   completed    → record actual_end_at, calc efficiency, push totals from entries
   *   rejected     → record actual_end_at + rejection_reason
   * After any transition, recalculate batch-level progress.
   */
  static async transitionOperation(id, payload, actor) {
    const op = await Repo.findOperationById(id)

    const { to_status, machine_id, operator_name, actual_start_at, actual_end_at,
            qty_output, qty_rejected, qty_rework, rejection_reason, notes } = payload

    if (!isValidOpTransition(op.status, to_status)) {
      throw new AppError(
        `Cannot transition operation from "${op.status}" to "${to_status}".`,
        422, 'INVALID_TRANSITION'
      )
    }

    const update = {
      status:     to_status,
      updated_by: actor?.id ?? null,
    }

    if (machine_id    !== undefined) update.machine_id    = machine_id    || null
    if (operator_name !== undefined) update.operator_name = operator_name || null
    if (notes         !== undefined) update.notes         = notes         || null

    if (to_status === OP_STATUS.IN_PROGRESS) {
      update.actual_start_at = actual_start_at || new Date().toISOString()
    }

    if (to_status === OP_STATUS.COMPLETED || to_status === OP_STATUS.REJECTED) {
      update.actual_end_at = actual_end_at || new Date().toISOString()

      if (to_status === OP_STATUS.REJECTED) {
        update.rejection_reason = rejection_reason || null
      }

      // If caller supplied explicit qty, use them; otherwise aggregate from entries
      if (qty_output !== undefined && qty_output !== null) {
        update.qty_output   = qty_output
        update.qty_rejected = qty_rejected ?? 0
        update.qty_rework   = qty_rework   ?? 0
      } else {
        const totals = await Repo.getOperationTotals(id)
        update.qty_output   = totals.qty_output
        update.qty_rejected = totals.qty_rejected
        update.qty_rework   = totals.qty_rework
      }

      // Derive efficiency and cycle time
      const qIn  = Number(op.qty_input ?? op.planned_qty ?? 0)
      const qOut = Number(update.qty_output ?? 0)
      if (qIn > 0) update.efficiency_pct = Number(((qOut / qIn) * 100).toFixed(2))

      // Cycle time: elapsed minutes / qty_output
      const startMs = new Date(update.actual_start_at ?? op.actual_start_at).getTime()
      const endMs   = new Date(update.actual_end_at).getTime()
      if (!isNaN(startMs) && !isNaN(endMs) && qOut > 0) {
        update.cycle_time_actual_min = Number(((endMs - startMs) / 60000 / qOut).toFixed(2))
      }
    }

    const result = await Repo.updateOperation(id, update)

    // Recalculate and push batch progress
    await ManufacturingService._syncBatchProgress(op.batch_id)

    logger.info(`Operation ${op.operation_type?.name} on batch ${op.batch_id}: ${op.status} → ${to_status}`)
    return result
  }

  // ── Production Entries ────────────────────────────────────────
  static getEntriesByOperation(opId, query) { return Repo.findEntriesByOperation(opId, query) }

  /**
   * Add a production entry to an operation.
   * Updates the operation's running qty totals.
   * Validates the operation is not yet completed/skipped.
   */
  static async addProductionEntry(batchOperationId, payload, actor) {
    const op = await Repo.findOperationById(batchOperationId)

    if (op.status === OP_STATUS.COMPLETED || op.status === OP_STATUS.SKIPPED) {
      throw new AppError('Cannot add entries to a completed or skipped operation.', 422, 'INVALID_STATUS')
    }

    // Auto-start operation if it was still pending
    if (op.status === OP_STATUS.PENDING) {
      await Repo.updateOperation(batchOperationId, {
        status:         OP_STATUS.IN_PROGRESS,
        actual_start_at: new Date().toISOString(),
        updated_by:     actor?.id ?? null,
      })
    }

    // Auto-calculate time taken from start/end if provided
    let timeTaken = payload.time_taken_minutes ?? null
    if (!timeTaken && payload.start_time && payload.end_time) {
      const ms = new Date(payload.end_time) - new Date(payload.start_time)
      if (ms > 0) timeTaken = Number((ms / 60000).toFixed(2))
    }

    const entry = await Repo.insertEntry({
      batch_operation_id: batchOperationId,
      batch_id:           op.batch_id,
      entry_time:         payload.entry_time || new Date().toISOString(),
      shift:              payload.shift          || null,
      machine_id:         payload.machine_id     || op.machine_id || null,
      operator_name:      payload.operator_name  || op.operator_name || null,
      qty_produced:       Number(payload.qty_produced  ?? 0),
      qty_rejected:       Number(payload.qty_rejected  ?? 0),
      qty_rework:         Number(payload.qty_rework    ?? 0),
      start_time:         payload.start_time     || null,
      end_time:           payload.end_time       || null,
      time_taken_minutes: timeTaken,
      rejection_reason:   payload.rejection_reason || null,
      quality_notes:      payload.quality_notes    || null,
      notes:              payload.notes            || null,
      actor_id:           actor?.id    ?? null,
      actor_email:        actor?.email ?? null,
    })

    // Roll up totals onto the operation row
    const totals = await Repo.getOperationTotals(batchOperationId)
    const qIn    = Number(op.qty_input ?? op.planned_qty ?? 0)
    const effPct = qIn > 0 ? Number(((totals.qty_output / qIn) * 100).toFixed(2)) : null

    await Repo.updateOperation(batchOperationId, {
      qty_output:   totals.qty_output,
      qty_rejected: totals.qty_rejected,
      qty_rework:   totals.qty_rework,
      efficiency_pct: effPct,
      updated_by:   actor?.id ?? null,
    })

    // Push batch-level progress
    await ManufacturingService._syncBatchProgress(op.batch_id)

    logger.info(`Production entry added to operation ${batchOperationId}: produced ${payload.qty_produced}, rejected ${payload.qty_rejected}`)
    return entry
  }

  // ── Private: sync batch actual_qty_produced from ops ─────────
  static async _syncBatchProgress(batchId) {
    const progress = await Repo.getBatchProgress(batchId)
    const update   = {}

    // Only push actuals if at least one operation has output
    if (progress.qty_produced_sum > 0) {
      update.actual_qty_produced = Number(progress.qty_produced_sum.toFixed(4))
    }
    if (progress.qty_rejected_sum > 0) {
      update.actual_qty_scrapped = Number(progress.qty_rejected_sum.toFixed(4))
    }

    if (Object.keys(update).length) {
      const { error } = await supabaseAdmin
        .from('production_batches')
        .update(update)
        .eq('id', batchId)
      if (error) logger.warn(`Failed to sync batch progress: ${error.message}`)
    }
  }
}
