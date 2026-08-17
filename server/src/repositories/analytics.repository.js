import { supabaseAdmin } from '../config/supabase.js'
import { AppError }      from '../utils/AppError.js'

/**
 * AnalyticsRepository
 *
 * All dashboard KPI and analytics queries.
 * Queries are read-only aggregations — no mutations here.
 */
export class AnalyticsRepository {

  // ─── Batch KPIs ───────────────────────────────────────────────

  /**
   * Count production batches grouped by status.
   * Returns an object like { created: 2, in_progress: 5, completed: 10, … }
   */
  static async getBatchStatusCounts() {
    const { data, error } = await supabaseAdmin
      .from('production_batches')
      .select('status')

    if (error) throw new AppError(error.message, 500)

    const counts = {}
    ;(data ?? []).forEach(row => {
      counts[row.status] = (counts[row.status] ?? 0) + 1
    })
    return counts
  }

  /**
   * Batches that are currently "running" (in production or inspection states).
   */
  static async getRunningBatches() {
    const RUNNING_STATUSES = ['issued', 'production_started', 'in_progress', 'inspection']

    const { data, error } = await supabaseAdmin
      .from('production_batches')
      .select(`
        id, batch_number, status, planned_qty, uom,
        planned_start_date, planned_end_date,
        actual_start_at, actual_qty_produced,
        product:products ( id, code, name ),
        machine:machines ( id, code, name )
      `)
      .in('status', RUNNING_STATUSES)
      .order('planned_start_date', { ascending: true })
      .limit(20)

    if (error) throw new AppError(error.message, 500)
    return data ?? []
  }

  /**
   * Recently completed batches (last 10) with yield KPIs.
   */
  static async getRecentlyCompletedBatches(limit = 10) {
    const { data, error } = await supabaseAdmin
      .from('batch_completion_summary')
      .select(`
        batch_id, planned_qty, qty_produced, qty_passed_qc,
        qty_scrapped, qty_moved_to_fg, yield_pct, rejection_pct,
        scrap_pct, material_utilization_pct, completed_at,
        batch:production_batches (
          id, batch_number, status, actual_start_at, actual_end_at,
          product:products ( id, code, name )
        )
      `)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (error) throw new AppError(error.message, 500)
    return data ?? []
  }

  /**
   * Aggregate production KPIs (totals across all time or a date range).
   *
   * @param {{ from?: string, to?: string }} filters  ISO date strings (YYYY-MM-DD)
   */
  static async getProductionKpis(filters = {}) {
    const { from, to } = filters

    let q = supabaseAdmin
      .from('batch_completion_summary')
      .select(
        'planned_qty, qty_produced, qty_passed_qc, qty_rejected_qc, ' +
        'qty_scrapped, qty_moved_to_fg, yield_pct, rejection_pct, scrap_pct, ' +
        'material_utilization_pct, time_efficiency_pct, total_material_issued, ' +
        'actual_cycle_time_min, planned_cycle_time_min'
      )

    if (from) q = q.gte('completed_at', from)
    if (to)   q = q.lte('completed_at', to)

    const { data, error } = await q
    if (error) throw new AppError(error.message, 500)

    const rows = data ?? []
    if (!rows.length) {
      return {
        total_batches_completed: 0,
        total_planned_qty: 0,
        total_produced: 0,
        total_passed_qc: 0,
        total_rejected_qc: 0,
        total_scrapped: 0,
        total_moved_to_fg: 0,
        total_material_issued: 0,
        avg_yield_pct: null,
        avg_rejection_pct: null,
        avg_scrap_pct: null,
        avg_material_utilization_pct: null,
        avg_time_efficiency_pct: null,
      }
    }

    const sum  = (key) => rows.reduce((s, r) => s + Number(r[key] ?? 0), 0)
    const avg  = (key) => {
      const vals = rows.filter(r => r[key] != null).map(r => Number(r[key]))
      return vals.length ? Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(3)) : null
    }

    return {
      total_batches_completed:      rows.length,
      total_planned_qty:            Number(sum('planned_qty').toFixed(4)),
      total_produced:               Number(sum('qty_produced').toFixed(4)),
      total_passed_qc:              Number(sum('qty_passed_qc').toFixed(4)),
      total_rejected_qc:            Number(sum('qty_rejected_qc').toFixed(4)),
      total_scrapped:               Number(sum('qty_scrapped').toFixed(4)),
      total_moved_to_fg:            Number(sum('qty_moved_to_fg').toFixed(4)),
      total_material_issued:        Number(sum('total_material_issued').toFixed(4)),
      avg_yield_pct:                avg('yield_pct'),
      avg_rejection_pct:            avg('rejection_pct'),
      avg_scrap_pct:                avg('scrap_pct'),
      avg_material_utilization_pct: avg('material_utilization_pct'),
      avg_time_efficiency_pct:      avg('time_efficiency_pct'),
    }
  }

  // ─── Inventory KPIs ───────────────────────────────────────────

  /**
   * Overall inventory snapshot: total stock value, low-stock count, alert count.
   */
  static async getInventorySnapshot() {
    const { data: materials, error } = await supabaseAdmin
      .from('raw_materials')
      .select(
        'id, current_stock_qty, reserved_qty, wip_qty, unit_cost, ' +
        'min_stock_qty, reorder_qty, status'
      )
      .eq('status', 'active')

    if (error) throw new AppError(error.message, 500)

    const rows          = materials ?? []
    let totalValue      = 0
    let belowMin        = 0
    let needsReorder    = 0
    let totalStockQty   = 0
    let totalReservedQty = 0
    let totalWipQty     = 0

    rows.forEach(m => {
      const qty    = Number(m.current_stock_qty ?? 0)
      const cost   = Number(m.unit_cost         ?? 0)
      const rsv    = Number(m.reserved_qty      ?? 0)
      const wip    = Number(m.wip_qty           ?? 0)
      const minQty = Number(m.min_stock_qty     ?? 0)
      const reord  = Number(m.reorder_qty       ?? 0)

      totalValue      += qty * cost
      totalStockQty   += qty
      totalReservedQty += rsv
      totalWipQty      += wip
      if (qty <= minQty)  belowMin++
      if (qty <= reord)   needsReorder++
    })

    return {
      total_active_materials: rows.length,
      total_stock_value:      Number(totalValue.toFixed(4)),
      total_stock_qty:        Number(totalStockQty.toFixed(4)),
      total_reserved_qty:     Number(totalReservedQty.toFixed(4)),
      total_wip_qty:          Number(totalWipQty.toFixed(4)),
      below_minimum_count:    belowMin,
      needs_reorder_count:    needsReorder,
    }
  }

  /**
   * Finished goods stock summary across all products.
   */
  static async getFinishedGoodsSnapshot() {
    const { data, error } = await supabaseAdmin
      .from('finished_goods_inventory')
      .select('qty_on_hand, qty_dispatched, unit_cost, total_value, product_id')

    if (error) throw new AppError(error.message, 500)

    const rows = data ?? []
    return {
      total_products_in_stock: rows.filter(r => Number(r.qty_on_hand ?? 0) > 0).length,
      total_fg_qty:            Number(rows.reduce((s, r) => s + Number(r.qty_on_hand ?? 0), 0).toFixed(4)),
      total_dispatched_qty:    Number(rows.reduce((s, r) => s + Number(r.qty_dispatched ?? 0), 0).toFixed(4)),
      total_fg_value:          Number(rows.reduce((s, r) => s + Number(r.total_value ?? 0), 0).toFixed(4)),
    }
  }

  // ─── Scrap KPIs ───────────────────────────────────────────────

  /**
   * Scrap totals grouped by category.
   * Returns an array of { scrap_category, total_qty, total_cost, count }.
   */
  static async getScrapByCategory(filters = {}) {
    const { from, to } = filters

    let q = supabaseAdmin
      .from('scrap_records')
      .select('scrap_category, qty_scrapped, total_scrap_cost')

    if (from) q = q.gte('scrap_date', from)
    if (to)   q = q.lte('scrap_date', to)

    const { data, error } = await q
    if (error) throw new AppError(error.message, 500)

    // Group client-side (simpler than rpc for now)
    const grouped = {}
    ;(data ?? []).forEach(row => {
      const cat = row.scrap_category
      if (!grouped[cat]) grouped[cat] = { scrap_category: cat, total_qty: 0, total_cost: 0, count: 0 }
      grouped[cat].total_qty  += Number(row.qty_scrapped     ?? 0)
      grouped[cat].total_cost += Number(row.total_scrap_cost ?? 0)
      grouped[cat].count      += 1
    })

    return Object.values(grouped).map(g => ({
      scrap_category: g.scrap_category,
      total_qty:      Number(g.total_qty.toFixed(4)),
      total_cost:     Number(g.total_cost.toFixed(4)),
      count:          g.count,
    })).sort((a, b) => b.total_qty - a.total_qty)
  }

  /**
   * Scrap totals grouped by machine.
   */
  static async getScrapByMachine(filters = {}) {
    const { from, to } = filters

    let q = supabaseAdmin
      .from('scrap_records')
      .select(`
        machine_id, qty_scrapped, total_scrap_cost,
        machine:machines ( id, code, name )
      `)

    if (from) q = q.gte('scrap_date', from)
    if (to)   q = q.lte('scrap_date', to)

    const { data, error } = await q
    if (error) throw new AppError(error.message, 500)

    const grouped = {}
    ;(data ?? []).forEach(row => {
      const key  = row.machine_id ?? 'no_machine'
      if (!grouped[key]) grouped[key] = {
        machine_id:   row.machine_id,
        machine_code: row.machine?.code ?? '—',
        machine_name: row.machine?.name ?? 'No Machine',
        total_qty:    0,
        total_cost:   0,
        count:        0,
      }
      grouped[key].total_qty  += Number(row.qty_scrapped     ?? 0)
      grouped[key].total_cost += Number(row.total_scrap_cost ?? 0)
      grouped[key].count      += 1
    })

    return Object.values(grouped).map(g => ({
      ...g,
      total_qty:  Number(g.total_qty.toFixed(4)),
      total_cost: Number(g.total_cost.toFixed(4)),
    })).sort((a, b) => b.total_qty - a.total_qty)
  }

  // ─── Manufacturing efficiency ─────────────────────────────────

  /**
   * Operation-level efficiency summary across all batch operations.
   * Returns array of { operation_name, total_ops, completed, avg_efficiency_pct, total_rejected }.
   */
  static async getOperationEfficiency(filters = {}) {
    const { from, to } = filters

    let q = supabaseAdmin
      .from('batch_operations')
      .select(`
        status, qty_input, qty_output, qty_rejected, efficiency_pct,
        actual_start_at, actual_end_at,
        operation_type:operation_types ( id, code, name, category )
      `)

    if (from) q = q.gte('actual_start_at', `${from}T00:00:00Z`)
    if (to)   q = q.lte('actual_start_at', `${to}T23:59:59Z`)

    const { data, error } = await q
    if (error) throw new AppError(error.message, 500)

    const grouped = {}
    ;(data ?? []).forEach(row => {
      const name = row.operation_type?.name ?? 'Unknown'
      if (!grouped[name]) grouped[name] = {
        operation_name:     name,
        operation_code:     row.operation_type?.code ?? '',
        operation_category: row.operation_type?.category ?? '',
        total_ops:          0,
        completed:          0,
        total_input:        0,
        total_output:       0,
        total_rejected:     0,
        efficiency_sum:     0,
        efficiency_count:   0,
      }
      grouped[name].total_ops++
      if (row.status === 'completed') grouped[name].completed++
      grouped[name].total_input    += Number(row.qty_input    ?? 0)
      grouped[name].total_output   += Number(row.qty_output   ?? 0)
      grouped[name].total_rejected += Number(row.qty_rejected ?? 0)
      if (row.efficiency_pct != null) {
        grouped[name].efficiency_sum   += Number(row.efficiency_pct)
        grouped[name].efficiency_count += 1
      }
    })

    return Object.values(grouped).map(g => ({
      operation_name:     g.operation_name,
      operation_code:     g.operation_code,
      operation_category: g.operation_category,
      total_ops:          g.total_ops,
      completed:          g.completed,
      total_input:        Number(g.total_input.toFixed(4)),
      total_output:       Number(g.total_output.toFixed(4)),
      total_rejected:     Number(g.total_rejected.toFixed(4)),
      avg_efficiency_pct: g.efficiency_count
        ? Number((g.efficiency_sum / g.efficiency_count).toFixed(3))
        : null,
    })).sort((a, b) => b.total_ops - a.total_ops)
  }

  // ─── Recent activity ──────────────────────────────────────────

  /**
   * Returns the last N lifecycle log events — used for the dashboard activity feed.
   */
  static async getRecentActivity(limit = 15) {
    const { data, error } = await supabaseAdmin
      .from('batch_lifecycle_logs')
      .select(`
        id, from_status, to_status, actor_email, notes, created_at,
        batch:production_batches (
          id, batch_number,
          product:products ( code, name )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new AppError(error.message, 500)
    return data ?? []
  }

  // ─── Material consumption trend ───────────────────────────────

  /**
   * Daily material received vs. issued for the last N days.
   */
  static async getMaterialConsumptionTrend(days = 30) {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceIso = since.toISOString()

    const { data, error } = await supabaseAdmin
      .from('inventory_transactions')
      .select('transaction_type, quantity, created_at')
      .in('transaction_type', ['receive', 'issue', 'wip_in'])
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true })

    if (error) throw new AppError(error.message, 500)

    // Bucket by date
    const byDate = {}
    ;(data ?? []).forEach(row => {
      const date = row.created_at.slice(0, 10)
      if (!byDate[date]) byDate[date] = { date, received: 0, issued: 0 }
      if (row.transaction_type === 'receive')         byDate[date].received += Number(row.quantity ?? 0)
      if (row.transaction_type === 'issue' || row.transaction_type === 'wip_in')
                                                      byDate[date].issued   += Number(row.quantity ?? 0)
    })

    return Object.values(byDate).map(d => ({
      date:     d.date,
      received: Number(d.received.toFixed(4)),
      issued:   Number(d.issued.toFixed(4)),
    }))
  }

  // ─── Master data counts ───────────────────────────────────────

  static async getMasterDataCounts() {
    const [products, rawMaterials, machines, warehouses] = await Promise.all([
      supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('raw_materials').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('machines').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('warehouses').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ])

    return {
      products:      products.count ?? 0,
      raw_materials: rawMaterials.count ?? 0,
      machines:      machines.count ?? 0,
      warehouses:    warehouses.count ?? 0,
    }
  }
}
