import { supabaseAdmin } from '../config/supabase.js'
import { AppError }      from '../utils/AppError.js'
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js'

const OP_TYPES  = 'operation_types'
const BATCH_OPS = 'batch_operations'
const ENTRIES   = 'production_entries'
const BATCHES   = 'production_batches'

const BATCH_OP_SELECT = `
  *,
  operation_type:operation_types ( id, code, name, category, sequence_no, standard_time_minutes ),
  machine:machines ( id, code, name ),
  entries:production_entries (
    id, entry_time, operator_name, qty_produced, qty_rejected, qty_rework,
    start_time, end_time, time_taken_minutes, rejection_reason, quality_notes, notes,
    actor_email, created_at,
    machine:machines ( id, code, name )
  )
`

export class ManufacturingRepository {

  // ── Operation Types ───────────────────────────────────────────
  static async findAllOpTypes(activeOnly = false) {
    let q = supabaseAdmin
      .from(OP_TYPES)
      .select('*')
      .order('sequence_no')
      .order('name')
    if (activeOnly) q = q.eq('is_active', true)
    const { data, error } = await q
    if (error) throw new AppError(error.message, 500)
    return data
  }

  static async findOpTypeById(id) {
    const { data, error } = await supabaseAdmin
      .from(OP_TYPES).select('*').eq('id', id).single()
    if (error) {
      if (error.code === 'PGRST116') throw new AppError('Operation type not found.', 404, 'NOT_FOUND')
      throw new AppError(error.message, 500)
    }
    return data
  }

  static async createOpType(payload) {
    const { data, error } = await supabaseAdmin
      .from(OP_TYPES).insert(payload).select().single()
    if (error) {
      if (error.code === '23505') throw new AppError(`Operation code "${payload.code}" already exists.`, 409, 'CONFLICT')
      throw new AppError(error.message, 500)
    }
    return data
  }

  static async updateOpType(id, payload) {
    await ManufacturingRepository.findOpTypeById(id)
    const { data, error } = await supabaseAdmin
      .from(OP_TYPES).update(payload).eq('id', id).select().single()
    if (error) throw new AppError(error.message, 500)
    return data
  }

  // ── Batch Operations ──────────────────────────────────────────
  static async findOperationsByBatch(batchId) {
    const { data, error } = await supabaseAdmin
      .from(BATCH_OPS)
      .select(BATCH_OP_SELECT)
      .eq('batch_id', batchId)
      .order('sequence_no')
      .order('created_at')
    if (error) throw new AppError(error.message, 500)
    // Sort entries within each operation by entry_time asc
    return (data ?? []).map(op => ({
      ...op,
      entries: (op.entries ?? []).sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time)),
    }))
  }

  static async findAllOperations(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { batch_id, status, machine_id } = query

    let q = supabaseAdmin
      .from(BATCH_OPS)
      .select(`
        id, batch_id, sequence_no, operator_name, status,
        planned_qty, qty_input, qty_output, qty_rejected, qty_rework,
        actual_start_at, actual_end_at, efficiency_pct, cycle_time_actual_min,
        created_at, updated_at,
        operation_type:operation_types ( id, code, name, category ),
        machine:machines ( id, code, name ),
        batch:production_batches ( id, batch_number, status )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (batch_id)   q = q.eq('batch_id',   batch_id)
    if (status)     q = q.eq('status',     status)
    if (machine_id) q = q.eq('machine_id', machine_id)

    const { data, error, count } = await q
    if (error) throw new AppError(error.message, 500)
    return { data, meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }

  static async findOperationById(id) {
    const { data, error } = await supabaseAdmin
      .from(BATCH_OPS)
      .select(BATCH_OP_SELECT)
      .eq('id', id)
      .single()
    if (error) {
      if (error.code === 'PGRST116') throw new AppError('Operation not found.', 404, 'NOT_FOUND')
      throw new AppError(error.message, 500)
    }
    data.entries = (data.entries ?? []).sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time))
    return data
  }

  static async createOperation(payload) {
    const { data, error } = await supabaseAdmin
      .from(BATCH_OPS).insert(payload).select().single()
    if (error) {
      if (error.code === '23505')
        throw new AppError('This operation type is already added to this batch.', 409, 'CONFLICT')
      throw new AppError(error.message, 500)
    }
    return ManufacturingRepository.findOperationById(data.id)
  }

  static async updateOperation(id, payload) {
    await ManufacturingRepository.findOperationById(id)
    const { data, error } = await supabaseAdmin
      .from(BATCH_OPS).update(payload).eq('id', id).select().single()
    if (error) throw new AppError(error.message, 500)
    return ManufacturingRepository.findOperationById(data.id)
  }

  static async deleteOperation(id) {
    await ManufacturingRepository.findOperationById(id)
    const { error } = await supabaseAdmin.from(BATCH_OPS).delete().eq('id', id)
    if (error) throw new AppError(error.message, 500)
  }

  // ── Production Entries ────────────────────────────────────────
  static async findEntriesByOperation(batchOperationId, query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { data, error, count } = await supabaseAdmin
      .from(ENTRIES)
      .select(`
        *,
        machine:machines ( id, code, name )
      `, { count: 'exact' })
      .eq('batch_operation_id', batchOperationId)
      .order('entry_time', { ascending: false })
      .range(offset, offset + pageSize - 1)
    if (error) throw new AppError(error.message, 500)
    return { data, meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }

  static async insertEntry(payload) {
    const { data, error } = await supabaseAdmin
      .from(ENTRIES).insert(payload).select().single()
    if (error) throw new AppError(error.message, 500)
    return data
  }

  // ── Aggregated totals for a batch operation ───────────────────
  static async getOperationTotals(batchOperationId) {
    const { data, error } = await supabaseAdmin
      .from(ENTRIES)
      .select('qty_produced, qty_rejected, qty_rework, time_taken_minutes')
      .eq('batch_operation_id', batchOperationId)
    if (error) throw new AppError(error.message, 500)
    return (data ?? []).reduce(
      (acc, e) => ({
        qty_output:          acc.qty_output          + Number(e.qty_produced       ?? 0),
        qty_rejected:        acc.qty_rejected         + Number(e.qty_rejected       ?? 0),
        qty_rework:          acc.qty_rework           + Number(e.qty_rework         ?? 0),
        total_time_minutes:  acc.total_time_minutes   + Number(e.time_taken_minutes ?? 0),
      }),
      { qty_output: 0, qty_rejected: 0, qty_rework: 0, total_time_minutes: 0 }
    )
  }

  // ── Batch progress snapshot (used by service to push to batch) ─
  static async getBatchProgress(batchId) {
    const { data, error } = await supabaseAdmin
      .from(BATCH_OPS)
      .select('status, qty_output, qty_rejected')
      .eq('batch_id', batchId)
    if (error) throw new AppError(error.message, 500)
    const ops = data ?? []
    return {
      total:     ops.length,
      completed: ops.filter(o => o.status === 'completed').length,
      rejected:  ops.filter(o => o.status === 'rejected').length,
      skipped:   ops.filter(o => o.status === 'skipped').length,
      qty_produced_sum: ops.reduce((s, o) => s + Number(o.qty_output   ?? 0), 0),
      qty_rejected_sum: ops.reduce((s, o) => s + Number(o.qty_rejected ?? 0), 0),
    }
  }
}
