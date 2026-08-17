import { ReportsRepository as Repo } from '../repositories/reports.repository.js'
import { ApiResponse }               from '../utils/ApiResponse.js'
import { asyncHandler }              from '../utils/asyncHandler.js'

/**
 * ReportsController
 *
 * GET /api/reports/production          – production batch report (paginated)
 * GET /api/reports/inventory           – raw material stock report (paginated)
 * GET /api/reports/inventory/ledger    – inventory transaction ledger (paginated)
 * GET /api/reports/scrap               – scrap records report (paginated)
 * GET /api/reports/scrap/summary       – scrap totals (non-paginated)
 * GET /api/reports/batch-summary       – batch completion summary report (paginated)
 * GET /api/reports/material-reconciliation – material reconciliation report (paginated)
 * GET /api/reports/finished-goods      – FG transaction report (paginated)
 */
export class ReportsController {

  /** GET /api/reports/production */
  static productionReport = asyncHandler(async (req, res) => {
    const { data, meta } = await Repo.getProductionReport(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/reports/inventory */
  static inventoryReport = asyncHandler(async (req, res) => {
    const { data, meta } = await Repo.getInventoryReport(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/reports/inventory/ledger */
  static inventoryLedgerReport = asyncHandler(async (req, res) => {
    const { data, meta } = await Repo.getInventoryLedgerReport(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/reports/scrap */
  static scrapReport = asyncHandler(async (req, res) => {
    const { data, meta } = await Repo.getScrapReport(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/reports/scrap/summary */
  static scrapSummary = asyncHandler(async (req, res) => {
    const { from_date, to_date } = req.query
    const data = await Repo.getScrapSummaryTotals({ from_date, to_date })
    return ApiResponse.success(res, data)
  })

  /** GET /api/reports/batch-summary */
  static batchSummaryReport = asyncHandler(async (req, res) => {
    const { data, meta } = await Repo.getBatchSummaryReport(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/reports/material-reconciliation */
  static materialReconciliationReport = asyncHandler(async (req, res) => {
    const { data, meta } = await Repo.getMaterialReconciliationReport(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/reports/finished-goods */
  static finishedGoodsReport = asyncHandler(async (req, res) => {
    const { data, meta } = await Repo.getFinishedGoodsReport(req.query)
    return ApiResponse.paginated(res, data, meta)
  })
}
