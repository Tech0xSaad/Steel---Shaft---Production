import { FinishedGoodsService } from '../services/finishedGoods.service.js'
import { ApiResponse }          from '../utils/ApiResponse.js'
import { asyncHandler }         from '../utils/asyncHandler.js'

export class FinishedGoodsController {

  // ── Stock positions ───────────────────────────────────────────

  /** GET /api/finished-goods/stock */
  static listPositions = asyncHandler(async (req, res) => {
    const { data, meta } = await FinishedGoodsService.listPositions(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/finished-goods/stock/:id */
  static getPosition = asyncHandler(async (req, res) => {
    const data = await FinishedGoodsService.getPositionById(req.params.id)
    return ApiResponse.success(res, data)
  })

  // ── Transactions ──────────────────────────────────────────────

  /** GET /api/finished-goods/transactions */
  static listTransactions = asyncHandler(async (req, res) => {
    const { data, meta } = await FinishedGoodsService.listTransactions(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/finished-goods/transactions/:id */
  static getTransaction = asyncHandler(async (req, res) => {
    const data = await FinishedGoodsService.getTransaction(req.params.id)
    return ApiResponse.success(res, data)
  })

  // ── Movements ─────────────────────────────────────────────────

  /** POST /api/finished-goods/adjust-in */
  static adjustIn = asyncHandler(async (req, res) => {
    const data = await FinishedGoodsService.adjustIn(req.body, req.user)
    return ApiResponse.created(res, data, 'Finished goods adjustment in recorded.')
  })

  /** POST /api/finished-goods/adjust-out */
  static adjustOut = asyncHandler(async (req, res) => {
    const data = await FinishedGoodsService.adjustOut(req.body, req.user)
    return ApiResponse.created(res, data, 'Finished goods adjustment out recorded.')
  })

  /** POST /api/finished-goods/dispatch */
  static dispatch = asyncHandler(async (req, res) => {
    const data = await FinishedGoodsService.dispatch(req.body, req.user)
    return ApiResponse.created(res, data, 'Finished goods dispatched.')
  })
}
