import { supabaseAdmin } from '../config/supabase.js'
import { AppError }      from '../utils/AppError.js'
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js'

/**
 * ReportsRepository
 *
 * Structured, filterable, export-ready report queries.
 * Each method returns { data, meta } for paginated reports, or raw arrays for summary reports.
 */
export class ReportsRepository {

  // ─── Production Report ────────────────────────────────────────

  /**
   * Production batch report — one row per batch, with all KPIs.
   * Supports filters: status, product_id, from_date, to_date, batch_number search.
   */
  static async getProductionReport(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { status, product_id, from_date, to_date, search } = query

    let q = supabaseAdmin
      .from('production_batches')
      .select(`
        id, batch_number, status, planned_qty, uom, priority,
        planned_start_date, planned_end_date,
        actual_start_at, actual_end_at,
        actual_qty_produced, actual_qty_scrapped,
        estimated_material_cost, estimated_total_time_min,
        created_at, updated_at,
        product:products ( id, code, name, category ),
        machine:machines ( id, code, name ),
        warehouse:warehouses ( id, code, name ),
        completion:batch_completion_summary (
          qty_produced, qty_passed_qc, qty_rejected_qc, qty_scrapped,
          qty_moved_to_fg, yield_pct, rejection_pct, scrap_pct,
          material_utilization_pct, time_efficiency_pct,
          total_material_issued, actual_cycle_time_min, planned_cycle_time_min,
          completed_at
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (status)     q = q.eq('status', status)
    if (product_id) q = q.eq('product_id', product_id)
    if (from_date)  q = q.gte('planned_start_date', from_date)
    if (to_date)    q = q.lte('planned_start_date', to_date)
    if (search)     q = q.ilike('batch_number', `%${search}%`)

    const { data, error, count } = await q
    if (error) throw new AppError(error.message, 500)
    return { data: data ?? [], meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }

  // ─── Inventory Report ─────────────────────────────────────────

  /**
   * Raw material inventory report — current stock levels with value.
   */
  static async getInventoryReport(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { category, status, low_stock } = query

    let q = supabaseAdmin
      .from('raw_materials')
      .select(`
        id, code, name, category, uom, grade, unit_cost,
        current_stock_qty, reserved_qty, wip_qty,
        min_stock_qty, reorder_qty,
        total_received_qty, total_issued_qty,
        primary_supplier, status, updated_at
      `, { count: 'exact' })
      .order('name', { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (category) q = q.eq('category', category)
    if (status)   q = q.eq('status', status)

    const { data, error, count } = await q
    if (error) throw new AppError(error.message, 500)

    let rows = data ?? []

    // Compute derived fields
    rows = rows.map(m => {
      const available = Math.max(0, Number(m.current_stock_qty ?? 0) - Number(m.reserved_qty ?? 0))
      const stockValue = Number(m.current_stock_qty ?? 0) * Number(m.unit_cost ?? 0)
      return {
        ...m,
        available_qty:       Number(available.toFixed(4)),
        stock_value:         Number(stockValue.toFixed(4)),
        is_below_minimum:    Number(m.current_stock_qty ?? 0) <= Number(m.min_stock_qty ?? 0),
        needs_reorder:       Number(m.current_stock_qty ?? 0) <= Number(m.reorder_qty ?? 0),
      }
    })

    // Client-side low_stock filter (post derivation)
    if (low_stock === 'true' || low_stock === true) {
      rows = rows.filter(r => r.is_below_minimum || r.needs_reorder)
    }

    return { data: rows, meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }

  /**
   * Inventory transaction ledger report — filterable, paginated.
   */
  static async getInventoryLedgerReport(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { raw_material_id, transaction_type, batch_id, from_date, to_date } = query

    let q = supabaseAdmin
      .from('inventory_transactions')
      .select(`
        id, transaction_type, quantity, uom, balance_before, balance_after,
        from_location, to_location, reference_number, reference_date,
        unit_cost, total_cost, actor_email, notes, created_at,
        raw_material:raw_materials ( id, code, name, uom ),
        warehouse:warehouses ( id, code, name ),
        batch:production_batches ( id, batch_number )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (raw_material_id)   q = q.eq('raw_material_id', raw_material_id)
    if (transaction_type)  q = q.eq('transaction_type', transaction_type)
    if (batch_id)          q = q.eq('batch_id', batch_id)
    if (from_date)         q = q.gte('created_at', `${from_date}T00:00:00Z`)
    if (to_date)           q = q.lte('created_at', `${to_date}T23:59:59Z`)

    const { data, error, count } = await q
    if (error) throw new AppError(error.message, 500)
    return { data: data ?? [], meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }

  // ─── Scrap Report ─────────────────────────────────────────────

  /**
   * Detailed scrap records report.
   */
  static async getScrapReport(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { batch_id, scrap_category, machine_id, from_date, to_date } = query

    let q = supabaseAdmin
      .from('scrap_records')
      .select(`
        id, scrap_date, scrap_category, description,
        qty_scrapped, weight_kg, uom,
        department, operator_name,
        unit_cost, total_scrap_cost,
        disposal_method, disposal_notes, disposed_at,
        notes, created_at,
        batch:production_batches (
          id, batch_number, status,
          product:products ( id, code, name )
        ),
        machine:machines ( id, code, name )
      `, { count: 'exact' })
      .order('scrap_date', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (batch_id)      q = q.eq('batch_id', batch_id)
    if (scrap_category) q = q.eq('scrap_category', scrap_category)
    if (machine_id)    q = q.eq('machine_id', machine_id)
    if (from_date)     q = q.gte('scrap_date', from_date)
    if (to_date)       q = q.lte('scrap_date', to_date)

    const { data, error, count } = await q
    if (error) throw new AppError(error.message, 500)
    return { data: data ?? [], meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }

  /**
   * Scrap summary totals for a report header (totals, not paginated).
   */
  static async getScrapSummaryTotals(filters = {}) {
    const { from_date, to_date } = filters

    let q = supabaseAdmin
      .from('scrap_records')
      .select('qty_scrapped, total_scrap_cost')

    if (from_date) q = q.gte('scrap_date', from_date)
    if (to_date)   q = q.lte('scrap_date', to_date)

    const { data, error } = await q
    if (error) throw new AppError(error.message, 500)

    const rows = data ?? []
    return {
      total_records:     rows.length,
      total_qty_scrapped: Number(rows.reduce((s, r) => s + Number(r.qty_scrapped ?? 0), 0).toFixed(4)),
      total_scrap_cost:   Number(rows.reduce((s, r) => s + Number(r.total_scrap_cost ?? 0), 0).toFixed(4)),
    }
  }

  // ─── Batch Summary Report ─────────────────────────────────────

  /**
   * Full batch summary — one row per completed batch with expected vs actual analysis.
   */
  static async getBatchSummaryReport(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { product_id, from_date, to_date } = query

    let q = supabaseAdmin
      .from('batch_completion_summary')
      .select(`
        id, batch_id, planned_qty, total_material_issued,
        qty_produced, qty_passed_qc, qty_rejected_qc, qty_scrapped,
        qty_rework, qty_moved_to_fg, yield_pct, rejection_pct, scrap_pct,
        material_utilization_pct, time_efficiency_pct,
        actual_cycle_time_min, planned_cycle_time_min, completed_at, created_at,
        batch:production_batches (
          id, batch_number, status,
          planned_start_date, planned_end_date,
          actual_start_at, actual_end_at,
          estimated_material_cost, priority,
          product:products ( id, code, name, category, expected_scrap_pct ),
          machine:machines ( id, code, name )
        )
      `, { count: 'exact' })
      .order('completed_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (product_id) q = q.eq('batch:production_batches.product_id', product_id)
    if (from_date)  q = q.gte('completed_at', `${from_date}T00:00:00Z`)
    if (to_date)    q = q.lte('completed_at', `${to_date}T23:59:59Z`)

    const { data, error, count } = await q
    if (error) throw new AppError(error.message, 500)

    // Enrich each row with expected-vs-actual variance
    const enriched = (data ?? []).map(row => {
      const plannedQty = Number(row.planned_qty ?? 0)
      const producedQty = Number(row.qty_produced ?? 0)
      const expectedScrapPct = Number(row.batch?.product?.expected_scrap_pct ?? 0)
      const expectedYield = plannedQty > 0 ? plannedQty * (1 - expectedScrapPct / 100) : 0
      const actualYield = Number(row.qty_passed_qc ?? 0)
      const yieldVariance = expectedYield > 0 ? Number(((actualYield - expectedYield) / expectedYield * 100).toFixed(3)) : null

      return {
        ...row,
        expected_yield_qty:   Number(expectedYield.toFixed(4)),
        yield_variance_pct:   yieldVariance,
        production_variance:  Number((producedQty - plannedQty).toFixed(4)),
      }
    })

    return { data: enriched, meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }

  // ─── Material Reconciliation Report ──────────────────────────

  /**
   * Material reconciliation — for a given date range, shows what was
   * received, issued, returned, and the closing balance per material.
   */
  static async getMaterialReconciliationReport(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { from_date, to_date, raw_material_id } = query

    // Get all transactions in range
    let q = supabaseAdmin
      .from('inventory_transactions')
      .select(`
        raw_material_id, transaction_type, quantity,
        raw_material:raw_materials ( id, code, name, uom, unit_cost, current_stock_qty )
      `)

    if (from_date)      q = q.gte('created_at', `${from_date}T00:00:00Z`)
    if (to_date)        q = q.lte('created_at', `${to_date}T23:59:59Z`)
    if (raw_material_id) q = q.eq('raw_material_id', raw_material_id)

    const { data, error } = await q
    if (error) throw new AppError(error.message, 500)

    // Group by material
    const grouped = {}
    ;(data ?? []).forEach(row => {
      const mid = row.raw_material_id
      if (!grouped[mid]) {
        grouped[mid] = {
          raw_material_id: mid,
          material_code:   row.raw_material?.code ?? '—',
          material_name:   row.raw_material?.name ?? '—',
          uom:             row.raw_material?.uom  ?? 'kg',
          unit_cost:       Number(row.raw_material?.unit_cost ?? 0),
          current_stock:   Number(row.raw_material?.current_stock_qty ?? 0),
          total_received:  0,
          total_issued:    0,
          total_returned:  0,
          total_adjusted_in:  0,
          total_adjusted_out: 0,
          total_scrapped:  0,
        }
      }
      const qty = Number(row.quantity ?? 0)
      switch (row.transaction_type) {
        case 'receive':         grouped[mid].total_received     += qty; break
        case 'issue':           grouped[mid].total_issued       += qty; break
        case 'return':          grouped[mid].total_returned     += qty; break
        case 'adjustment_in':   grouped[mid].total_adjusted_in  += qty; break
        case 'adjustment_out':  grouped[mid].total_adjusted_out += qty; break
        case 'scrap':           grouped[mid].total_scrapped     += qty; break
        default: break
      }
    })

    const rows = Object.values(grouped).map(g => ({
      ...g,
      total_received:     Number(g.total_received.toFixed(4)),
      total_issued:       Number(g.total_issued.toFixed(4)),
      total_returned:     Number(g.total_returned.toFixed(4)),
      total_adjusted_in:  Number(g.total_adjusted_in.toFixed(4)),
      total_adjusted_out: Number(g.total_adjusted_out.toFixed(4)),
      total_scrapped:     Number(g.total_scrapped.toFixed(4)),
      net_movement:       Number((
        g.total_received + g.total_returned + g.total_adjusted_in -
        g.total_issued - g.total_adjusted_out - g.total_scrapped
      ).toFixed(4)),
    }))

    const total = rows.length
    const paged = rows.slice(offset, offset + pageSize)
    return { data: paged, meta: buildPaginationMeta({ page, pageSize, total }) }
  }

  // ─── Finished Goods Report ────────────────────────────────────

  /**
   * Finished goods transaction report — filterable ledger.
   */
  static async getFinishedGoodsReport(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { product_id, movement_type, from_date, to_date } = query

    let q = supabaseAdmin
      .from('finished_goods_transactions')
      .select(`
        id, movement_type, quantity, uom, balance_before, balance_after,
        unit_cost, total_cost, reference_number, reference_date,
        actor_email, notes, created_at,
        product:products ( id, code, name, category ),
        warehouse:warehouses ( id, code, name ),
        batch:production_batches ( id, batch_number )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (product_id)    q = q.eq('product_id',    product_id)
    if (movement_type) q = q.eq('movement_type', movement_type)
    if (from_date)     q = q.gte('created_at', `${from_date}T00:00:00Z`)
    if (to_date)       q = q.lte('created_at', `${to_date}T23:59:59Z`)

    const { data, error, count } = await q
    if (error) throw new AppError(error.message, 500)
    return { data: data ?? [], meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }
}
