import { InventoryService } from '../services/inventory.service.js'
import { ApiResponse }      from '../utils/ApiResponse.js'
import { asyncHandler }     from '../utils/asyncHandler.js'

export class InventoryController {

  // ── Stock Positions ───────────────────────────────────────────
  /** GET /api/inventory/positions */
  static listPositions = asyncHandler(async (req, res) => {
    const { data, meta } = await InventoryService.listPositions(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/inventory/positions/:rawMaterialId */
  static getPosition = asyncHandler(async (req, res) => {
    const data = await InventoryService.getPosition(req.params.rawMaterialId)
    return ApiResponse.success(res, data)
  })

  // ── Ledger ────────────────────────────────────────────────────
  /** GET /api/inventory/transactions */
  static listTransactions = asyncHandler(async (req, res) => {
    const { data, meta } = await InventoryService.listTransactions(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/inventory/transactions/:id */
  static getTransaction = asyncHandler(async (req, res) => {
    const data = await InventoryService.getTransaction(req.params.id)
    return ApiResponse.success(res, data)
  })

  // ── Movements ─────────────────────────────────────────────────
  /** POST /api/inventory/receive */
  static receive = asyncHandler(async (req, res) => {
    const data = await InventoryService.receiveStock(req.body, req.user)
    return ApiResponse.created(res, data, 'Stock received successfully.')
  })

  /** POST /api/inventory/adjust */
  static adjust = asyncHandler(async (req, res) => {
    const data = await InventoryService.adjustStock(req.body, req.user)
    return ApiResponse.success(res, data, 'Stock adjusted successfully.')
  })

  /** POST /api/inventory/transfer */
  static transfer = asyncHandler(async (req, res) => {
    const data = await InventoryService.transferStock(req.body, req.user)
    return ApiResponse.success(res, data, 'Stock transferred successfully.')
  })

  /** POST /api/inventory/scrap */
  static scrap = asyncHandler(async (req, res) => {
    const data = await InventoryService.scrapStock(req.body, req.user)
    return ApiResponse.success(res, data, 'Stock scrapped successfully.')
  })

  /** POST /api/inventory/return */
  static returnStock = asyncHandler(async (req, res) => {
    const data = await InventoryService.returnFromProduction(req.body, req.user)
    return ApiResponse.success(res, data, 'Stock returned successfully.')
  })

  // ── WIP ───────────────────────────────────────────────────────
  /** GET /api/inventory/wip */
  static listWip = asyncHandler(async (req, res) => {
    const { data, meta } = await InventoryService.listWip(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  // ── Alerts ────────────────────────────────────────────────────
  /** GET /api/inventory/alerts */
  static getAlerts = asyncHandler(async (req, res) => {
    const data = await InventoryService.getAlerts()
    return ApiResponse.success(res, data)
  })
}
