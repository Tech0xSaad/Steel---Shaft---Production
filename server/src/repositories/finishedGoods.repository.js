import { supabaseAdmin } from '../config/supabase.js'
import { AppError }      from '../utils/AppError.js'
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js'

const FG_INV   = 'finished_goods_inventory'
const FG_TXN   = 'finished_goods_transactions'

const FG_INV_SELECT = `
  *,
  product:products ( id, code, name, uom, category ),
  warehouse:warehouses ( id, code, name )
`

const FG_TXN_SELECT = `
  *,
  product:products ( id, code, name ),
  warehouse:warehouses ( id, code, name ),
  batch:production_batches ( id, batch_number ),
  quality_check:quality_checks ( id, check_number )
`

export class FinishedGoodsRepository {

  // ── Stock positions ───────────────────────────────────────────

  static async findAllPositions(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { product_id, warehouse_id } = query

    let q = supabaseAdmin
      .from(FG_INV)
      .select(FG_INV_SELECT, { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (product_id)   q = q.eq('product_id',   product_id)
    if (warehouse_id) q = q.eq('warehouse_id', warehouse_id)

    const { data, error, count } = await q
    if (error) throw new AppError(error.message, 500)
    return { data, meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }

  static async findPositionByProductAndWarehouse(productId, warehouseId) {
    let q = supabaseAdmin
      .from(FG_INV)
      .select(FG_INV_SELECT)
      .eq('product_id', productId)

    if (warehouseId) {
      q = q.eq('warehouse_id', warehouseId)
    } else {
      q = q.is('warehouse_id', null)
    }

    const { data, error } = await q.maybeSingle()
    if (error) throw new AppError(error.message, 500)
    return data
  }

  static async findPositionById(id) {
    const { data, error } = await supabaseAdmin
      .from(FG_INV)
      .select(FG_INV_SELECT)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') throw new AppError('Finished goods record not found.', 404, 'NOT_FOUND')
      throw new AppError(error.message, 500)
    }
    return data
  }

  /**
   * Add qty to a product's FG stock, creating the row if it doesn't exist yet.
   * Returns { balanceBefore, balanceAfter }.
   */
  static async addFgStock(productId, warehouseId, qty, unitCost = 0) {
    const existing = await FinishedGoodsRepository.findPositionByProductAndWarehouse(productId, warehouseId)

    if (existing) {
      const newQty = Number(existing.qty_on_hand) + qty
      // Weighted average cost update
      const existingValue = Number(existing.qty_on_hand) * Number(existing.unit_cost ?? 0)
      const addedValue    = qty * Number(unitCost ?? 0)
      const newCost = newQty > 0 ? (existingValue + addedValue) / newQty : Number(unitCost ?? 0)

      const { error } = await supabaseAdmin
        .from(FG_INV)
        .update({
          qty_on_hand:  newQty,
          unit_cost:    Number(newCost.toFixed(4)),
          total_value:  Number((newQty * newCost).toFixed(4)),
        })
        .eq('id', existing.id)

      if (error) throw new AppError(error.message, 500)
      return { balanceBefore: Number(existing.qty_on_hand), balanceAfter: newQty }
    } else {
      const { error } = await supabaseAdmin
        .from(FG_INV)
        .insert({
          product_id:   productId,
          warehouse_id: warehouseId || null,
          qty_on_hand:  qty,
          unit_cost:    Number(unitCost ?? 0),
          total_value:  Number((qty * Number(unitCost ?? 0)).toFixed(4)),
        })

      if (error) throw new AppError(error.message, 500)
      return { balanceBefore: 0, balanceAfter: qty }
    }
  }

  /**
   * Remove qty from FG stock (dispatch, adjustment out).
   * Throws if insufficient stock.
   */
  static async removeFgStock(productId, warehouseId, qty) {
    const existing = await FinishedGoodsRepository.findPositionByProductAndWarehouse(productId, warehouseId)
    if (!existing) throw new AppError('No finished goods stock found for this product.', 422, 'NO_STOCK')

    const newQty = Number(existing.qty_on_hand) - qty
    if (newQty < 0) throw new AppError(
      `Insufficient finished goods stock. Available: ${existing.qty_on_hand}, Requested: ${qty}`,
      422, 'INSUFFICIENT_STOCK'
    )

    const { error } = await supabaseAdmin
      .from(FG_INV)
      .update({
        qty_on_hand: newQty,
        total_value: Number((newQty * Number(existing.unit_cost ?? 0)).toFixed(4)),
      })
      .eq('id', existing.id)

    if (error) throw new AppError(error.message, 500)
    return { balanceBefore: Number(existing.qty_on_hand), balanceAfter: newQty }
  }

  /**
   * Update dispatched qty counter on FG position row.
   */
  static async addDispatchedQty(productId, warehouseId, qty) {
    const existing = await FinishedGoodsRepository.findPositionByProductAndWarehouse(productId, warehouseId)
    if (!existing) return

    const { error } = await supabaseAdmin
      .from(FG_INV)
      .update({ qty_dispatched: Number(existing.qty_dispatched ?? 0) + qty })
      .eq('id', existing.id)

    if (error) throw new AppError(error.message, 500)
  }

  // ── FG Transactions (ledger) ──────────────────────────────────

  static async findAllTransactions(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { product_id, warehouse_id, movement_type, batch_id } = query

    let q = supabaseAdmin
      .from(FG_TXN)
      .select(FG_TXN_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (product_id)    q = q.eq('product_id',    product_id)
    if (warehouse_id)  q = q.eq('warehouse_id',  warehouse_id)
    if (movement_type) q = q.eq('movement_type', movement_type)
    if (batch_id)      q = q.eq('batch_id',      batch_id)

    const { data, error, count } = await q
    if (error) throw new AppError(error.message, 500)
    return { data, meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }

  static async findTransactionById(id) {
    const { data, error } = await supabaseAdmin
      .from(FG_TXN)
      .select(FG_TXN_SELECT)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') throw new AppError('FG transaction not found.', 404, 'NOT_FOUND')
      throw new AppError(error.message, 500)
    }
    return data
  }

  static async insertTransaction(payload) {
    const { data, error } = await supabaseAdmin
      .from(FG_TXN)
      .insert(payload)
      .select()
      .single()

    if (error) throw new AppError(error.message, 500)
    return data
  }
}
