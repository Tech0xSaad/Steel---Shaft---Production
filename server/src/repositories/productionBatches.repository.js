import { supabaseAdmin } from '../config/supabase.js'
import { AppError }      from '../utils/AppError.js'
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js'

const BATCH  = 'production_batches'
const RESERV = 'batch_material_reservations'
const LOG    = 'batch_lifecycle_logs'

const BATCH_SELECT_FULL = `
  *,
  product:products ( id, code, name, uom, cycle_time_minutes, setup_time_minutes, expected_scrap_pct ),
  bom:bom ( id, version, items:bom_items( *, raw_material:raw_materials(id, code, name, uom, unit_cost, current_stock_qty) ) ),
  machine:machines ( id, code, name ),
  warehouse:warehouses ( id, code, name ),
  reservations:batch_material_reservations (
    *,
    raw_material:raw_materials ( id, code, name, uom, current_stock_qty )
  ),
  lifecycle_logs:batch_lifecycle_logs ( * )
`

export class ProductionBatchesRepository {

  // ── List (paginated) ─────────────────────────────────────────
  static async findAll(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { search, status, product_id, from_date, to_date } = query

    let q = supabaseAdmin
      .from(BATCH)
      .select(`
        id, batch_number, status, priority, planned_qty, uom,
        planned_start_date, planned_end_date,
        expected_yield_qty, estimated_material_cost,
        actual_qty_produced, actual_start_at, actual_end_at,
        created_at, updated_at,
        product:products ( id, code, name ),
        machine:machines ( id, code, name )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (search)     q = q.or(`batch_number.ilike.%${search}%`)
    if (status)     q = q.eq('status', status)
    if (product_id) q = q.eq('product_id', product_id)
    if (from_date)  q = q.gte('planned_start_date', from_date)
    if (to_date)    q = q.lte('planned_start_date', to_date)

    const { data, error, count } = await q
    if (error) throw new AppError(error.message, 500)
    return { data, meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }

  // ── Get full detail ──────────────────────────────────────────
  static async findById(id) {
    const { data, error } = await supabaseAdmin
      .from(BATCH)
      .select(BATCH_SELECT_FULL)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') throw new AppError('Production batch not found.', 404, 'NOT_FOUND')
      throw new AppError(error.message, 500)
    }

    // Sort lifecycle logs by created_at asc
    if (data.lifecycle_logs) {
      data.lifecycle_logs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    }
    return data
  }

  // ── Create batch header (no reservations yet) ────────────────
  static async create(payload) {
    const { data, error } = await supabaseAdmin
      .from(BATCH)
      .insert(payload)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') throw new AppError(`Batch number "${payload.batch_number}" already exists.`, 409, 'CONFLICT')
      throw new AppError(error.message, 500)
    }
    return data
  }

  // ── Update planning fields ───────────────────────────────────
  static async update(id, payload) {
    await ProductionBatchesRepository.findById(id)
    const { data, error } = await supabaseAdmin
      .from(BATCH)
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new AppError(error.message, 500)
    return data
  }

  // ── Update status only ───────────────────────────────────────
  static async updateStatus(id, status, actuals = {}) {
    const update = { status, ...actuals }
    const { data, error } = await supabaseAdmin
      .from(BATCH)
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new AppError(error.message, 500)
    return data
  }

  // ── Delete (only allowed from 'created') ────────────────────
  static async delete(id) {
    await ProductionBatchesRepository.findById(id)
    const { error } = await supabaseAdmin.from(BATCH).delete().eq('id', id)
    if (error) throw new AppError(error.message, 500)
  }

  // ── Reservations ─────────────────────────────────────────────
  static async createReservations(reservations) {
    const { data, error } = await supabaseAdmin
      .from(RESERV)
      .insert(reservations)
      .select()
    if (error) throw new AppError(error.message, 500)
    return data
  }

  static async updateReservationStatus(batchId, status, extra = {}) {
    const { error } = await supabaseAdmin
      .from(RESERV)
      .update({ status, ...extra })
      .eq('batch_id', batchId)
    if (error) throw new AppError(error.message, 500)
  }

  static async cancelReservations(batchId) {
    const { error } = await supabaseAdmin
      .from(RESERV)
      .update({ status: 'cancelled' })
      .eq('batch_id', batchId)
      .neq('status', 'cancelled')
    if (error) throw new AppError(error.message, 500)
  }

  // ── Raw material stock management (atomic) ───────────────────
  static async deductReservedStock(rawMaterialId, qty) {
    const { data: mat, error: fetchErr } = await supabaseAdmin
      .from('raw_materials')
      .select('current_stock_qty')
      .eq('id', rawMaterialId)
      .single()
    if (fetchErr) throw new AppError(fetchErr.message, 500)

    const newQty = Number(mat.current_stock_qty) - qty
    if (newQty < 0) throw new AppError(
      'Insufficient stock for reservation.',
      422, 'INSUFFICIENT_STOCK'
    )

    const { error: updateErr } = await supabaseAdmin
      .from('raw_materials')
      .update({ current_stock_qty: newQty })
      .eq('id', rawMaterialId)
    if (updateErr) throw new AppError(updateErr.message, 500)
  }

  static async returnStockQty(rawMaterialId, qty) {
    const { data: mat, error: fetchErr } = await supabaseAdmin
      .from('raw_materials')
      .select('current_stock_qty')
      .eq('id', rawMaterialId)
      .single()
    if (fetchErr) throw new AppError(fetchErr.message, 500)

    const { error: updateErr } = await supabaseAdmin
      .from('raw_materials')
      .update({ current_stock_qty: Number(mat.current_stock_qty) + qty })
      .eq('id', rawMaterialId)
    if (updateErr) throw new AppError(updateErr.message, 500)
  }

  // ── Lifecycle log ────────────────────────────────────────────
  static async addLifecycleLog(entry) {
    const { error } = await supabaseAdmin.from(LOG).insert(entry)
    if (error) throw new AppError(error.message, 500)
  }
}
