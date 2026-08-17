import { supabaseAdmin } from '../config/supabase.js'
import { AppError }      from '../utils/AppError.js'
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js'

const QC_TABLE  = 'quality_checks'
const COMP_TABLE = 'batch_completion_summary'

const QC_SELECT_FULL = `
  *,
  batch:production_batches (
    id, batch_number, status, planned_qty, uom,
    actual_qty_produced, actual_qty_scrapped,
    product:products ( id, code, name )
  )
`

export class QualityRepository {

  // ── Quality Checks ────────────────────────────────────────────

  static async findAll(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { batch_id, status, from_date, to_date } = query

    let q = supabaseAdmin
      .from(QC_TABLE)
      .select(`
        id, batch_id, check_number, inspector_name, inspection_date,
        qty_inspected, qty_passed, qty_rejected, qty_on_hold, uom,
        status, report_reference, created_at, updated_at,
        batch:production_batches (
          id, batch_number,
          product:products ( id, code, name )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (batch_id)  q = q.eq('batch_id', batch_id)
    if (status)    q = q.eq('status', status)
    if (from_date) q = q.gte('inspection_date', from_date)
    if (to_date)   q = q.lte('inspection_date', to_date)

    const { data, error, count } = await q
    if (error) throw new AppError(error.message, 500)
    return { data, meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }

  static async findById(id) {
    const { data, error } = await supabaseAdmin
      .from(QC_TABLE)
      .select(QC_SELECT_FULL)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') throw new AppError('Quality check not found.', 404, 'NOT_FOUND')
      throw new AppError(error.message, 500)
    }
    return data
  }

  static async findByBatchId(batchId) {
    const { data, error } = await supabaseAdmin
      .from(QC_TABLE)
      .select(QC_SELECT_FULL)
      .eq('batch_id', batchId)
      .order('check_number', { ascending: true })

    if (error) throw new AppError(error.message, 500)
    return data ?? []
  }

  /**
   * Returns the latest check_number for a batch so we can increment it.
   */
  static async getNextCheckNumber(batchId) {
    const { data, error } = await supabaseAdmin
      .from(QC_TABLE)
      .select('check_number')
      .eq('batch_id', batchId)
      .order('check_number', { ascending: false })
      .limit(1)

    if (error) throw new AppError(error.message, 500)
    return data?.length ? Number(data[0].check_number) + 1 : 1
  }

  static async create(payload) {
    const { data, error } = await supabaseAdmin
      .from(QC_TABLE)
      .insert(payload)
      .select()
      .single()

    if (error) throw new AppError(error.message, 500)
    return data
  }

  static async update(id, payload) {
    await QualityRepository.findById(id)
    const { data, error } = await supabaseAdmin
      .from(QC_TABLE)
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new AppError(error.message, 500)
    return data
  }

  static async delete(id) {
    await QualityRepository.findById(id)
    const { error } = await supabaseAdmin.from(QC_TABLE).delete().eq('id', id)
    if (error) throw new AppError(error.message, 500)
  }

  /**
   * Returns aggregated pass/reject totals for a batch across all checks.
   */
  static async getQcTotalsForBatch(batchId) {
    const { data, error } = await supabaseAdmin
      .from(QC_TABLE)
      .select('qty_passed, qty_rejected, qty_on_hold, qty_inspected, status')
      .eq('batch_id', batchId)

    if (error) throw new AppError(error.message, 500)
    const checks = data ?? []
    return {
      total_checks:  checks.length,
      qty_inspected: checks.reduce((s, c) => s + Number(c.qty_inspected ?? 0), 0),
      qty_passed:    checks.reduce((s, c) => s + Number(c.qty_passed    ?? 0), 0),
      qty_rejected:  checks.reduce((s, c) => s + Number(c.qty_rejected  ?? 0), 0),
      qty_on_hold:   checks.reduce((s, c) => s + Number(c.qty_on_hold   ?? 0), 0),
    }
  }

  // ── Batch Completion Summary ───────────────────────────────────

  static async findCompletionByBatchId(batchId) {
    const { data, error } = await supabaseAdmin
      .from(COMP_TABLE)
      .select('*')
      .eq('batch_id', batchId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new AppError(error.message, 500)
    }
    return data
  }

  static async upsertCompletion(payload) {
    const { data, error } = await supabaseAdmin
      .from(COMP_TABLE)
      .upsert(payload, { onConflict: 'batch_id' })
      .select()
      .single()

    if (error) throw new AppError(error.message, 500)
    return data
  }
}
