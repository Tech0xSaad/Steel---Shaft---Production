import { supabaseAdmin } from '../config/supabase.js'
import { AppError }      from '../utils/AppError.js'
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js'

const TABLE = 'scrap_records'

const SCRAP_SELECT_FULL = `
  *,
  batch:production_batches (
    id, batch_number, status,
    product:products ( id, code, name )
  ),
  machine:machines ( id, code, name ),
  quality_check:quality_checks ( id, check_number, inspector_name ),
  batch_operation:batch_operations (
    id, sequence_no,
    operation_type:operation_types ( id, code, name )
  )
`

export class ScrapRepository {

  static async findAll(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { batch_id, scrap_category, machine_id, from_date, to_date } = query

    let q = supabaseAdmin
      .from(TABLE)
      .select(`
        id, batch_id, scrap_date, scrap_category, description,
        qty_scrapped, weight_kg, uom, department, operator_name,
        unit_cost, total_scrap_cost, disposal_method, disposed_at,
        created_at,
        batch:production_batches (
          id, batch_number,
          product:products ( id, code, name )
        ),
        machine:machines ( id, code, name )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (batch_id)      q = q.eq('batch_id',      batch_id)
    if (scrap_category) q = q.eq('scrap_category', scrap_category)
    if (machine_id)    q = q.eq('machine_id',    machine_id)
    if (from_date)     q = q.gte('scrap_date',   from_date)
    if (to_date)       q = q.lte('scrap_date',   to_date)

    const { data, error, count } = await q
    if (error) throw new AppError(error.message, 500)
    return { data, meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }

  static async findById(id) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select(SCRAP_SELECT_FULL)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') throw new AppError('Scrap record not found.', 404, 'NOT_FOUND')
      throw new AppError(error.message, 500)
    }
    return data
  }

  static async findByBatchId(batchId) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select(SCRAP_SELECT_FULL)
      .eq('batch_id', batchId)
      .order('scrap_date', { ascending: false })
    if (error) throw new AppError(error.message, 500)
    return data ?? []
  }

  static async create(payload) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert(payload)
      .select()
      .single()

    if (error) throw new AppError(error.message, 500)
    return ScrapRepository.findById(data.id)
  }

  static async update(id, payload) {
    await ScrapRepository.findById(id)
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new AppError(error.message, 500)
    return ScrapRepository.findById(data.id)
  }

  static async delete(id) {
    await ScrapRepository.findById(id)
    const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id)
    if (error) throw new AppError(error.message, 500)
  }

  /**
   * Aggregated scrap totals for a batch.
   */
  static async getTotalsForBatch(batchId) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('qty_scrapped, weight_kg, total_scrap_cost, scrap_category')
      .eq('batch_id', batchId)

    if (error) throw new AppError(error.message, 500)
    const records = data ?? []
    return {
      total_records:    records.length,
      total_qty:        records.reduce((s, r) => s + Number(r.qty_scrapped     ?? 0), 0),
      total_weight_kg:  records.reduce((s, r) => s + Number(r.weight_kg        ?? 0), 0),
      total_cost:       records.reduce((s, r) => s + Number(r.total_scrap_cost ?? 0), 0),
    }
  }

  /**
   * Scrap summary grouped by category (used for reports).
   */
  static async getSummaryByCategory(query) {
    const { from_date, to_date, batch_id } = query
    let q = supabaseAdmin
      .from(TABLE)
      .select('scrap_category, qty_scrapped, total_scrap_cost')

    if (batch_id)  q = q.eq('batch_id',  batch_id)
    if (from_date) q = q.gte('scrap_date', from_date)
    if (to_date)   q = q.lte('scrap_date', to_date)

    const { data, error } = await q
    if (error) throw new AppError(error.message, 500)

    // Group in JS
    const grouped = {}
    for (const r of data ?? []) {
      const cat = r.scrap_category
      if (!grouped[cat]) grouped[cat] = { scrap_category: cat, total_qty: 0, total_cost: 0, record_count: 0 }
      grouped[cat].total_qty   += Number(r.qty_scrapped     ?? 0)
      grouped[cat].total_cost  += Number(r.total_scrap_cost ?? 0)
      grouped[cat].record_count += 1
    }
    return Object.values(grouped).sort((a, b) => b.total_qty - a.total_qty)
  }
}
