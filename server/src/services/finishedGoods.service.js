import { FinishedGoodsRepository as Repo } from '../repositories/finishedGoods.repository.js'
import { AppError }  from '../utils/AppError.js'
import { logger }    from '../config/logger.js'
import { FG_MOVEMENT_TYPE } from '../constants/inventoryTypes.js'

/**
 * FinishedGoodsService
 *
 * Handles manual FG inventory operations:
 *   - List / query stock positions and transactions
 *   - Manual adjustments (in / out)
 *   - Dispatch (reduces FG qty, records ledger entry)
 *
 * Production Receipt (qty_passed from QC) is handled by QualityService.
 */
export class FinishedGoodsService {

  // ── Stock positions ───────────────────────────────────────────
  static listPositions(query)      { return Repo.findAllPositions(query) }
  static getPositionById(id)       { return Repo.findPositionById(id) }

  // ── FG transactions ───────────────────────────────────────────
  static listTransactions(query)   { return Repo.findAllTransactions(query) }
  static getTransaction(id)        { return Repo.findTransactionById(id) }

  // ── Manual Adjustment In ──────────────────────────────────────
  static async adjustIn(payload, actor) {
    const { product_id, warehouse_id, quantity, unit_cost, reference_number, notes } = payload
    const qty = Number(quantity)

    const { balanceBefore, balanceAfter } = await Repo.addFgStock(
      product_id, warehouse_id ?? null, qty, Number(unit_cost ?? 0)
    )

    const txn = await Repo.insertTransaction({
      product_id,
      warehouse_id:     warehouse_id  || null,
      batch_id:         null,
      quality_check_id: null,
      movement_type:    FG_MOVEMENT_TYPE.ADJUSTMENT_IN,
      quantity:         qty,
      uom:              payload.uom || 'pcs',
      balance_before:   balanceBefore,
      balance_after:    balanceAfter,
      unit_cost:        Number(unit_cost ?? 0),
      total_cost:       Number((Number(unit_cost ?? 0) * qty).toFixed(4)),
      reference_number: reference_number || null,
      actor_id:         actor?.id    ?? null,
      actor_email:      actor?.email ?? null,
      notes:            notes || null,
    })

    logger.info(`FG adjustment-in: ${qty} pcs of product ${product_id}. Balance: ${balanceAfter}`)
    return txn
  }

  // ── Manual Adjustment Out ─────────────────────────────────────
  static async adjustOut(payload, actor) {
    const { product_id, warehouse_id, quantity, reference_number, reason, notes } = payload
    const qty = Number(quantity)

    const position = await Repo.findPositionByProductAndWarehouse(product_id, warehouse_id ?? null)
    const unitCost = position ? Number(position.unit_cost ?? 0) : 0

    const { balanceBefore, balanceAfter } = await Repo.removeFgStock(
      product_id, warehouse_id ?? null, qty
    )

    const txn = await Repo.insertTransaction({
      product_id,
      warehouse_id:     warehouse_id  || null,
      movement_type:    FG_MOVEMENT_TYPE.ADJUSTMENT_OUT,
      quantity:         qty,
      uom:              payload.uom || 'pcs',
      balance_before:   balanceBefore,
      balance_after:    balanceAfter,
      unit_cost:        unitCost,
      total_cost:       Number((unitCost * qty).toFixed(4)),
      reference_number: reference_number || null,
      actor_id:         actor?.id    ?? null,
      actor_email:      actor?.email ?? null,
      notes:            [reason, notes].filter(Boolean).join(' — ') || null,
    })

    logger.info(`FG adjustment-out: ${qty} pcs of product ${product_id}. Balance: ${balanceAfter}`)
    return txn
  }

  // ── Dispatch ──────────────────────────────────────────────────
  static async dispatch(payload, actor) {
    const { product_id, warehouse_id, quantity, reference_number, notes } = payload
    const qty = Number(quantity)

    const position = await Repo.findPositionByProductAndWarehouse(product_id, warehouse_id ?? null)
    if (!position) throw new AppError('No finished goods stock for this product.', 422, 'NO_STOCK')
    const unitCost = Number(position.unit_cost ?? 0)

    const { balanceBefore, balanceAfter } = await Repo.removeFgStock(
      product_id, warehouse_id ?? null, qty
    )
    await Repo.addDispatchedQty(product_id, warehouse_id ?? null, qty)

    const txn = await Repo.insertTransaction({
      product_id,
      warehouse_id:     warehouse_id  || null,
      movement_type:    FG_MOVEMENT_TYPE.DISPATCH,
      quantity:         qty,
      uom:              payload.uom || 'pcs',
      balance_before:   balanceBefore,
      balance_after:    balanceAfter,
      unit_cost:        unitCost,
      total_cost:       Number((unitCost * qty).toFixed(4)),
      reference_number: reference_number || null,
      actor_id:         actor?.id    ?? null,
      actor_email:      actor?.email ?? null,
      notes:            notes || null,
    })

    logger.info(`FG dispatch: ${qty} pcs of product ${product_id} dispatched. Balance: ${balanceAfter}`)
    return txn
  }
}
