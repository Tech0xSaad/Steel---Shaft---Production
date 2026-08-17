import { InventoryRepository as Repo } from '../repositories/inventory.repository.js'
import { AppError }   from '../utils/AppError.js'
import { logger }     from '../config/logger.js'
import {
  TXN_TYPE,
  TXN_STOCK_EFFECT,
  TXN_LOCATION_MAP,
} from '../constants/inventoryTypes.js'

/**
 * Inventory Service — every operation follows the same pattern:
 *  1. Validate business rules
 *  2. Update raw_materials stock columns atomically
 *  3. Post an immutable ledger record (inventory_transactions)
 *  4. Optionally update WIP inventory
 *  5. Check and raise stock alerts
 */
export class InventoryService {

  // ── Queries ───────────────────────────────────────────────────
  static listPositions(query)    { return Repo.findStockPositions(query) }
  static getPosition(id)         { return Repo.findStockPosition(id) }
  static listTransactions(query) { return Repo.findTransactions(query) }
  static getTransaction(id)      { return Repo.findTransactionById(id) }
  static listWip(query)          { return Repo.findWip(query) }
  static getAlerts()             { return Repo.findActiveAlerts() }

  // ── Receive Stock (GRN) ───────────────────────────────────────
  /**
   * Records a goods receipt — increases physical stock.
   * Updates weighted-average unit cost if unit_cost is provided.
   */
  static async receiveStock(payload, actor) {
    const { raw_material_id, warehouse_id, quantity, uom,
            reference_number, reference_date, unit_cost, notes } = payload

    const mat = await Repo.findRawMaterial(raw_material_id)
    if (mat.status !== 'active')
      throw new AppError('Cannot receive stock for an inactive material.', 422, 'INVALID_STATUS')

    const qty = Number(quantity)
    const { balanceBefore, balanceAfter, unitCost: resolvedCost } =
      await Repo.addPhysicalStock(raw_material_id, qty, unit_cost ?? null)

    const txn = await Repo.insertTransaction({
      raw_material_id,
      warehouse_id:     warehouse_id || null,
      transaction_type: TXN_TYPE.RECEIVE,
      quantity:         qty,
      uom:              uom ?? mat.uom,
      balance_before:   balanceBefore,
      balance_after:    balanceAfter,
      from_location:    TXN_LOCATION_MAP.receive.from,
      to_location:      TXN_LOCATION_MAP.receive.to,
      reference_number: reference_number || null,
      reference_date:   reference_date   || null,
      unit_cost:        resolvedCost,
      total_cost:       Number((resolvedCost * qty).toFixed(4)),
      actor_id:         actor?.id    ?? null,
      actor_email:      actor?.email ?? null,
      notes:            notes || null,
    })

    logger.info(`Inventory: received ${qty} ${mat.uom} of ${mat.code}. Balance: ${balanceAfter}`)
    return txn
  }

  // ── Manual Adjustment ─────────────────────────────────────────
  static async adjustStock(payload, actor) {
    const { raw_material_id, warehouse_id, adjustment_type, quantity,
            uom, reference_number, reason, notes } = payload

    const mat = await Repo.findRawMaterial(raw_material_id)
    const qty = Number(quantity)
    let balanceBefore, balanceAfter

    if (adjustment_type === TXN_TYPE.ADJUSTMENT_IN) {
      ;({ balanceBefore, balanceAfter } = await Repo.addPhysicalStock(raw_material_id, qty, null))
    } else {
      ;({ balanceBefore, balanceAfter } = await Repo.removePhysicalStock(raw_material_id, qty))
      await Repo.checkAndCreateAlerts(raw_material_id)
    }

    const txn = await Repo.insertTransaction({
      raw_material_id,
      warehouse_id:     warehouse_id || null,
      transaction_type: adjustment_type,
      quantity:         qty,
      uom:              uom ?? mat.uom,
      balance_before:   balanceBefore,
      balance_after:    balanceAfter,
      from_location:    TXN_LOCATION_MAP[adjustment_type]?.from,
      to_location:      TXN_LOCATION_MAP[adjustment_type]?.to,
      reference_number: reference_number || null,
      unit_cost:        Number(mat.unit_cost ?? 0),
      total_cost:       Number((Number(mat.unit_cost ?? 0) * qty).toFixed(4)),
      actor_id:         actor?.id    ?? null,
      actor_email:      actor?.email ?? null,
      notes:            [reason, notes].filter(Boolean).join(' — ') || null,
    })

    logger.info(`Inventory: adjustment ${adjustment_type} ${qty} ${mat.uom} of ${mat.code}. Balance: ${balanceAfter}`)
    return txn
  }

  // ── Transfer Between Warehouses ───────────────────────────────
  static async transferStock(payload, actor) {
    const { raw_material_id, from_warehouse_id, to_warehouse_id,
            quantity, uom, reference_number, notes } = payload

    if (from_warehouse_id === to_warehouse_id)
      throw new AppError('Source and destination warehouse must differ.', 422, 'SAME_WAREHOUSE')

    const mat = await Repo.findRawMaterial(raw_material_id)
    const qty = Number(quantity)

    // Transfer out → transfer in (net effect on total stock is zero)
    const { balanceBefore } = await Repo.removePhysicalStock(raw_material_id, qty)
    const { balanceAfter }  = await Repo.addPhysicalStock(raw_material_id, qty, null)

    const base = {
      raw_material_id,
      quantity:         qty,
      uom:              uom ?? mat.uom,
      reference_number: reference_number || null,
      unit_cost:        Number(mat.unit_cost ?? 0),
      total_cost:       Number((Number(mat.unit_cost ?? 0) * qty).toFixed(4)),
      actor_id:         actor?.id    ?? null,
      actor_email:      actor?.email ?? null,
      notes:            notes || null,
    }

    await Repo.insertTransaction({
      ...base,
      warehouse_id:     from_warehouse_id,
      transaction_type: TXN_TYPE.TRANSFER_OUT,
      balance_before:   balanceBefore,
      balance_after:    balanceBefore, // net neutral on total
      from_location:    'raw_material',
      to_location:      null,
    })

    const txn = await Repo.insertTransaction({
      ...base,
      warehouse_id:     to_warehouse_id,
      transaction_type: TXN_TYPE.TRANSFER_IN,
      balance_before:   balanceBefore,
      balance_after:    balanceAfter,
      from_location:    null,
      to_location:      'raw_material',
    })

    logger.info(`Inventory: transfer ${qty} ${mat.uom} of ${mat.code} from ${from_warehouse_id} → ${to_warehouse_id}`)
    return txn
  }

  // ── Scrap Stock ───────────────────────────────────────────────
  static async scrapStock(payload, actor) {
    const { raw_material_id, warehouse_id, quantity, uom,
            batch_id, reference_number, reason, notes } = payload

    const mat = await Repo.findRawMaterial(raw_material_id)
    const qty = Number(quantity)
    const { balanceBefore, balanceAfter } = await Repo.removePhysicalStock(raw_material_id, qty)

    if (batch_id) {
      await Repo.removeWipQty(raw_material_id, qty)
      await Repo.upsertWipLine(batch_id, raw_material_id, { qty_scrapped: qty })
    }

    await Repo.checkAndCreateAlerts(raw_material_id)

    const txn = await Repo.insertTransaction({
      raw_material_id,
      warehouse_id:     warehouse_id || null,
      transaction_type: TXN_TYPE.SCRAP,
      quantity:         qty,
      uom:              uom ?? mat.uom,
      balance_before:   balanceBefore,
      balance_after:    balanceAfter,
      from_location:    batch_id ? 'wip' : 'raw_material',
      to_location:      'scrap',
      batch_id:         batch_id || null,
      reference_number: reference_number || null,
      unit_cost:        Number(mat.unit_cost ?? 0),
      total_cost:       Number((Number(mat.unit_cost ?? 0) * qty).toFixed(4)),
      actor_id:         actor?.id    ?? null,
      actor_email:      actor?.email ?? null,
      notes:            [reason, notes].filter(Boolean).join(' — ') || null,
    })

    logger.info(`Inventory: scrapped ${qty} ${mat.uom} of ${mat.code}. Balance: ${balanceAfter}`)
    return txn
  }

  // ── Issue to Production (batch reservation → WIP) ─────────────
  /**
   * Called internally when a batch transitions to 'issued'.
   * Moves reserved_qty into wip_qty and posts an ISSUE ledger entry.
   * Also creates WIP inventory lines.
   */
  static async issueReservationToWip(reservations, batchId, actor) {
    for (const r of reservations) {
      const mat = await Repo.findRawMaterial(r.raw_material_id)
      const qty = Number(r.reserved_qty)

      // Move reserved → WIP in raw_materials columns
      await Repo.moveReservedToWip(r.raw_material_id, qty)

      // Create / update WIP inventory line
      await Repo.upsertWipLine(batchId, r.raw_material_id, {
        qty_issued: qty,
        uom:        r.uom,
      })

      // Post ledger entry
      const balanceBefore = Number(mat.current_stock_qty)
      await Repo.insertTransaction({
        raw_material_id:  r.raw_material_id,
        transaction_type: TXN_TYPE.ISSUE,
        quantity:         qty,
        uom:              r.uom,
        balance_before:   balanceBefore,
        balance_after:    balanceBefore,  // physical balance unchanged (deducted at reservation)
        from_location:    'reserved',
        to_location:      'wip',
        batch_id:         batchId,
        reservation_id:   r.id || null,
        unit_cost:        Number(mat.unit_cost ?? 0),
        total_cost:       Number((Number(mat.unit_cost ?? 0) * qty).toFixed(4)),
        actor_id:         actor?.id    ?? null,
        actor_email:      actor?.email ?? null,
        notes:            `Issued to batch ${batchId}`,
      })
    }
    logger.info(`Inventory: issued ${reservations.length} material lines to batch ${batchId}`)
  }

  // ── Return from Production (WIP → raw_material store) ─────────
  static async returnFromProduction(payload, actor) {
    const { raw_material_id, warehouse_id, quantity, uom,
            batch_id, reference_number, notes } = payload

    const mat = await Repo.findRawMaterial(raw_material_id)
    const qty = Number(quantity)

    // Add back to physical stock and decrease WIP
    const { balanceBefore, balanceAfter } = await Repo.addPhysicalStock(raw_material_id, qty, null)
    await Repo.removeWipQty(raw_material_id, qty)

    if (batch_id) {
      await Repo.upsertWipLine(batch_id, raw_material_id, { qty_returned: qty })
    }

    const txn = await Repo.insertTransaction({
      raw_material_id,
      warehouse_id:     warehouse_id || null,
      transaction_type: TXN_TYPE.RETURN,
      quantity:         qty,
      uom:              uom ?? mat.uom,
      balance_before:   balanceBefore,
      balance_after:    balanceAfter,
      from_location:    'wip',
      to_location:      'raw_material',
      batch_id:         batch_id || null,
      reference_number: reference_number || null,
      unit_cost:        Number(mat.unit_cost ?? 0),
      total_cost:       Number((Number(mat.unit_cost ?? 0) * qty).toFixed(4)),
      actor_id:         actor?.id    ?? null,
      actor_email:      actor?.email ?? null,
      notes:            notes || null,
    })

    logger.info(`Inventory: returned ${qty} ${mat.uom} of ${mat.code} from production. Balance: ${balanceAfter}`)
    return txn
  }

  // ── Close WIP when batch completes ───────────────────────────
  static async closeWipForBatch(batchId) {
    await Repo.closeWipForBatch(batchId)
    logger.info(`Inventory: WIP closed for batch ${batchId}`)
  }
}
