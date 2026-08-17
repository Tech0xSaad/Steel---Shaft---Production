import { supabaseAdmin } from '../config/supabase.js'
import { AppError }      from '../utils/AppError.js'
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js'

const TXN_TABLE  = 'inventory_transactions'
const WIP_TABLE  = 'wip_inventory'
const RM_TABLE   = 'raw_materials'

// ── Stock Positions ───────────────────────────────────────────
export class InventoryRepository {

  // Read stock positions from the view
  static async findStockPositions(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { search, category, status, low_stock_only } = query

    let q = supabaseAdmin
      .from('stock_positions')
      .select('*', { count: 'exact' })
      .order('name')
      .range(offset, offset + pageSize - 1)

    if (search)
      q = q.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
    if (category) q = q.ilike('category', `%${category}%`)
    if (status)   q = q.eq('status', status)
    if (low_stock_only === true || low_stock_only === 'true')
      q = q.eq('needs_reorder', true)

    const { data, error, count } = await q
    if (error) throw new AppError(error.message, 500)
    return { data, meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }

  // Single material position (used in modal detail panels)
  static async findStockPosition(rawMaterialId) {
    const { data, error } = await supabaseAdmin
      .from('stock_positions')
      .select('*')
      .eq('raw_material_id', rawMaterialId)
      .single()
    if (error) {
      if (error.code === 'PGRST116') throw new AppError('Material not found.', 404, 'NOT_FOUND')
      throw new AppError(error.message, 500)
    }
    return data
  }

  // Read a raw material row (for balance snapshot and cost lookup)
  static async findRawMaterial(id) {
    const { data, error } = await supabaseAdmin
      .from(RM_TABLE)
      .select('id, code, name, uom, unit_cost, current_stock_qty, reserved_qty, wip_qty, min_stock_qty, reorder_qty, status')
      .eq('id', id)
      .single()
    if (error) {
      if (error.code === 'PGRST116') throw new AppError('Raw material not found.', 404, 'NOT_FOUND')
      throw new AppError(error.message, 500)
    }
    return data
  }

  // ── Ledger ────────────────────────────────────────────────────
  static async findTransactions(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { raw_material_id, warehouse_id, transaction_type, batch_id,
            from_date, to_date, search } = query

    let q = supabaseAdmin
      .from(TXN_TABLE)
      .select(`
        *,
        raw_material:raw_materials ( id, code, name, uom ),
        warehouse:warehouses        ( id, code, name ),
        batch:production_batches    ( id, batch_number )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (raw_material_id)  q = q.eq('raw_material_id',  raw_material_id)
    if (warehouse_id)     q = q.eq('warehouse_id',     warehouse_id)
    if (transaction_type) q = q.eq('transaction_type', transaction_type)
    if (batch_id)         q = q.eq('batch_id',         batch_id)
    if (from_date)        q = q.gte('created_at',      from_date)
    if (to_date)          q = q.lte('created_at',      to_date + 'T23:59:59Z')
    if (search)           q = q.ilike('reference_number', `%${search}%`)

    const { data, error, count } = await q
    if (error) throw new AppError(error.message, 500)
    return { data, meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }

  // Single transaction
  static async findTransactionById(id) {
    const { data, error } = await supabaseAdmin
      .from(TXN_TABLE)
      .select(`
        *,
        raw_material:raw_materials ( id, code, name, uom ),
        warehouse:warehouses        ( id, code, name ),
        batch:production_batches    ( id, batch_number )
      `)
      .eq('id', id)
      .single()
    if (error) {
      if (error.code === 'PGRST116') throw new AppError('Transaction not found.', 404, 'NOT_FOUND')
      throw new AppError(error.message, 500)
    }
    return data
  }

  // Append a ledger record (immutable — insert only)
  static async insertTransaction(txnPayload) {
    const { data, error } = await supabaseAdmin
      .from(TXN_TABLE)
      .insert(txnPayload)
      .select()
      .single()
    if (error) throw new AppError(error.message, 500)
    return data
  }

  // ── Stock quantity updaters ────────────────────────────────────

  /** Increase current_stock_qty and total_received_qty */
  static async addPhysicalStock(rawMaterialId, qty, unitCost) {
    const mat = await InventoryRepository.findRawMaterial(rawMaterialId)
    const newQty = Number(mat.current_stock_qty) + qty

    // Weighted-average cost update
    const totalQtyBefore = Number(mat.current_stock_qty)
    const existingCost   = Number(mat.unit_cost ?? 0)
    const newUnitCost    = unitCost != null && qty > 0
      ? ((existingCost * totalQtyBefore) + (unitCost * qty)) / (totalQtyBefore + qty)
      : existingCost

    const update = {
      current_stock_qty:  Number(newQty.toFixed(4)),
      total_received_qty: Number((Number(mat.total_received_qty ?? 0) + qty).toFixed(4)),
    }
    if (unitCost != null) update.unit_cost = Number(newUnitCost.toFixed(4))

    const { error } = await supabaseAdmin
      .from(RM_TABLE)
      .update(update)
      .eq('id', rawMaterialId)
    if (error) throw new AppError(error.message, 500)
    return { balanceBefore: Number(mat.current_stock_qty), balanceAfter: newQty, unitCost: newUnitCost }
  }

  /** Decrease current_stock_qty (adjustment out, scrap, transfer out) */
  static async removePhysicalStock(rawMaterialId, qty) {
    const mat = await InventoryRepository.findRawMaterial(rawMaterialId)
    const newQty = Number(mat.current_stock_qty) - qty
    if (newQty < 0) throw new AppError(
      `Insufficient stock. Available: ${Number(mat.current_stock_qty).toFixed(3)} ${mat.uom}, requested: ${qty.toFixed(3)} ${mat.uom}`,
      422, 'INSUFFICIENT_STOCK'
    )
    const { error } = await supabaseAdmin
      .from(RM_TABLE)
      .update({ current_stock_qty: Number(newQty.toFixed(4)) })
      .eq('id', rawMaterialId)
    if (error) throw new AppError(error.message, 500)
    return { balanceBefore: Number(mat.current_stock_qty), balanceAfter: newQty }
  }

  /** Increase reserved_qty (called when batch moves to 'reserved') */
  static async addReservedQty(rawMaterialId, qty) {
    const mat = await InventoryRepository.findRawMaterial(rawMaterialId)
    const { error } = await supabaseAdmin
      .from(RM_TABLE)
      .update({ reserved_qty: Number((Number(mat.reserved_qty) + qty).toFixed(4)) })
      .eq('id', rawMaterialId)
    if (error) throw new AppError(error.message, 500)
  }

  /** Decrease reserved_qty (when reservation released or issued) */
  static async removeReservedQty(rawMaterialId, qty) {
    const mat = await InventoryRepository.findRawMaterial(rawMaterialId)
    const newReserved = Math.max(0, Number(mat.reserved_qty) - qty)
    const { error } = await supabaseAdmin
      .from(RM_TABLE)
      .update({ reserved_qty: Number(newReserved.toFixed(4)) })
      .eq('id', rawMaterialId)
    if (error) throw new AppError(error.message, 500)
  }

  /** Move qty from reserved → WIP (when batch issued to shop floor) */
  static async moveReservedToWip(rawMaterialId, qty) {
    const mat = await InventoryRepository.findRawMaterial(rawMaterialId)
    const newReserved = Math.max(0, Number(mat.reserved_qty) - qty)
    const newWip      = Number(mat.wip_qty) + qty
    const newTotalIssued = Number((Number(mat.total_issued_qty ?? 0) + qty).toFixed(4))

    const { error } = await supabaseAdmin
      .from(RM_TABLE)
      .update({
        reserved_qty:     Number(newReserved.toFixed(4)),
        wip_qty:          Number(newWip.toFixed(4)),
        total_issued_qty: newTotalIssued,
      })
      .eq('id', rawMaterialId)
    if (error) throw new AppError(error.message, 500)
  }

  /** Decrease WIP qty (when WIP out or scrap posted) */
  static async removeWipQty(rawMaterialId, qty) {
    const mat = await InventoryRepository.findRawMaterial(rawMaterialId)
    const newWip = Math.max(0, Number(mat.wip_qty) - qty)
    const { error } = await supabaseAdmin
      .from(RM_TABLE)
      .update({ wip_qty: Number(newWip.toFixed(4)) })
      .eq('id', rawMaterialId)
    if (error) throw new AppError(error.message, 500)
  }

  // ── WIP Inventory ─────────────────────────────────────────────
  static async findWip(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { batch_id, is_closed } = query

    let q = supabaseAdmin
      .from(WIP_TABLE)
      .select(`
        *,
        raw_material:raw_materials ( id, code, name, uom ),
        batch:production_batches   ( id, batch_number, status )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (batch_id)  q = q.eq('batch_id', batch_id)
    if (is_closed !== undefined && is_closed !== null)
      q = q.eq('is_closed', is_closed)

    const { data, error, count } = await q
    if (error) throw new AppError(error.message, 500)
    return { data, meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }

  static async upsertWipLine(batchId, rawMaterialId, fields) {
    // Try update first; if no row exists, insert
    const { data: existing } = await supabaseAdmin
      .from(WIP_TABLE)
      .select('id, qty_issued, qty_consumed, qty_returned, qty_scrapped')
      .eq('batch_id', batchId)
      .eq('raw_material_id', rawMaterialId)
      .maybeSingle()

    if (existing) {
      const update = {}
      if (fields.qty_issued   != null) update.qty_issued   = Number((existing.qty_issued   + fields.qty_issued).toFixed(4))
      if (fields.qty_consumed != null) update.qty_consumed = Number((existing.qty_consumed + fields.qty_consumed).toFixed(4))
      if (fields.qty_returned != null) update.qty_returned = Number((existing.qty_returned + fields.qty_returned).toFixed(4))
      if (fields.qty_scrapped != null) update.qty_scrapped = Number((existing.qty_scrapped + fields.qty_scrapped).toFixed(4))
      if (fields.is_closed    != null) update.is_closed    = fields.is_closed

      const { error } = await supabaseAdmin
        .from(WIP_TABLE).update(update).eq('id', existing.id)
      if (error) throw new AppError(error.message, 500)
    } else {
      const insert = {
        batch_id:        batchId,
        raw_material_id: rawMaterialId,
        qty_issued:      fields.qty_issued   ?? 0,
        qty_consumed:    fields.qty_consumed ?? 0,
        qty_returned:    fields.qty_returned ?? 0,
        qty_scrapped:    fields.qty_scrapped ?? 0,
        uom:             fields.uom          ?? 'kg',
        is_closed:       fields.is_closed    ?? false,
      }
      const { error } = await supabaseAdmin.from(WIP_TABLE).insert(insert)
      if (error) throw new AppError(error.message, 500)
    }
  }

  static async closeWipForBatch(batchId) {
    const { error } = await supabaseAdmin
      .from(WIP_TABLE)
      .update({ is_closed: true })
      .eq('batch_id', batchId)
    if (error) throw new AppError(error.message, 500)
  }

  // ── Stock alerts ──────────────────────────────────────────────
  static async checkAndCreateAlerts(rawMaterialId) {
    const mat = await InventoryRepository.findRawMaterial(rawMaterialId)
    const alerts = []

    if (Number(mat.current_stock_qty) <= Number(mat.min_stock_qty)) {
      alerts.push({ type: 'below_minimum', threshold: mat.min_stock_qty })
    }
    if (Number(mat.current_stock_qty) <= Number(mat.reorder_qty)) {
      alerts.push({ type: 'reorder_point', threshold: mat.reorder_qty })
    }

    for (const a of alerts) {
      // Resolve previous active alert of same type
      await supabaseAdmin
        .from('stock_alerts')
        .update({ is_active: false, resolved_at: new Date().toISOString() })
        .eq('raw_material_id', rawMaterialId)
        .eq('alert_type', a.type)
        .eq('is_active', true)

      await supabaseAdmin.from('stock_alerts').insert({
        raw_material_id:  rawMaterialId,
        alert_type:       a.type,
        current_stock_qty: mat.current_stock_qty,
        threshold_qty:    a.threshold,
        is_active:        true,
      })
    }
  }

  static async findActiveAlerts() {
    const { data, error } = await supabaseAdmin
      .from('stock_alerts')
      .select('*, raw_material:raw_materials(id, code, name, uom)')
      .eq('is_active', true)
      .order('triggered_at', { ascending: false })
    if (error) throw new AppError(error.message, 500)
    return data
  }
}
