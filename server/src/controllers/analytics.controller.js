import { AnalyticsRepository as Repo } from '../repositories/analytics.repository.js'
import { ApiResponse }                  from '../utils/ApiResponse.js'
import { asyncHandler }                 from '../utils/asyncHandler.js'

/**
 * AnalyticsController
 *
 * GET /api/analytics/dashboard          – full dashboard payload (single call)
 * GET /api/analytics/batch-status       – batch counts by status
 * GET /api/analytics/running-batches    – active/running batches list
 * GET /api/analytics/production-kpis   – aggregated production KPIs
 * GET /api/analytics/inventory          – inventory snapshot
 * GET /api/analytics/finished-goods    – finished goods snapshot
 * GET /api/analytics/scrap/by-category – scrap grouped by category
 * GET /api/analytics/scrap/by-machine  – scrap grouped by machine
 * GET /api/analytics/operation-efficiency – op-level efficiency
 * GET /api/analytics/recent-activity   – latest lifecycle events
 * GET /api/analytics/material-trend    – daily receive vs issue trend
 * GET /api/analytics/master-counts     – active master data counts
 */
export class AnalyticsController {

  /**
   * Single consolidated endpoint for the dashboard page.
   * Fires all queries in parallel to keep latency low.
   */
  static dashboard = asyncHandler(async (req, res) => {
    const filters = {
      from: req.query.from || null,
      to:   req.query.to   || null,
    }

    const [
      batchStatusCounts,
      runningBatches,
      recentlyCompleted,
      productionKpis,
      inventorySnapshot,
      finishedGoodsSnapshot,
      scrapByCategory,
      recentActivity,
      masterCounts,
    ] = await Promise.all([
      Repo.getBatchStatusCounts(),
      Repo.getRunningBatches(),
      Repo.getRecentlyCompletedBatches(5),
      Repo.getProductionKpis(filters),
      Repo.getInventorySnapshot(),
      Repo.getFinishedGoodsSnapshot(),
      Repo.getScrapByCategory(filters),
      Repo.getRecentActivity(10),
      Repo.getMasterDataCounts(),
    ])

    return ApiResponse.success(res, {
      batch_status_counts:    batchStatusCounts,
      running_batches:        runningBatches,
      recently_completed:     recentlyCompleted,
      production_kpis:        productionKpis,
      inventory_snapshot:     inventorySnapshot,
      finished_goods_snapshot: finishedGoodsSnapshot,
      scrap_by_category:      scrapByCategory,
      recent_activity:        recentActivity,
      master_counts:          masterCounts,
    })
  })

  /** GET /api/analytics/batch-status */
  static batchStatus = asyncHandler(async (req, res) => {
    const data = await Repo.getBatchStatusCounts()
    return ApiResponse.success(res, data)
  })

  /** GET /api/analytics/running-batches */
  static runningBatches = asyncHandler(async (req, res) => {
    const data = await Repo.getRunningBatches()
    return ApiResponse.success(res, data)
  })

  /** GET /api/analytics/production-kpis?from=&to= */
  static productionKpis = asyncHandler(async (req, res) => {
    const filters = { from: req.query.from, to: req.query.to }
    const data = await Repo.getProductionKpis(filters)
    return ApiResponse.success(res, data)
  })

  /** GET /api/analytics/inventory */
  static inventorySnapshot = asyncHandler(async (req, res) => {
    const data = await Repo.getInventorySnapshot()
    return ApiResponse.success(res, data)
  })

  /** GET /api/analytics/finished-goods */
  static finishedGoodsSnapshot = asyncHandler(async (req, res) => {
    const data = await Repo.getFinishedGoodsSnapshot()
    return ApiResponse.success(res, data)
  })

  /** GET /api/analytics/scrap/by-category?from=&to= */
  static scrapByCategory = asyncHandler(async (req, res) => {
    const filters = { from: req.query.from, to: req.query.to }
    const data = await Repo.getScrapByCategory(filters)
    return ApiResponse.success(res, data)
  })

  /** GET /api/analytics/scrap/by-machine?from=&to= */
  static scrapByMachine = asyncHandler(async (req, res) => {
    const filters = { from: req.query.from, to: req.query.to }
    const data = await Repo.getScrapByMachine(filters)
    return ApiResponse.success(res, data)
  })

  /** GET /api/analytics/operation-efficiency?from=&to= */
  static operationEfficiency = asyncHandler(async (req, res) => {
    const filters = { from: req.query.from, to: req.query.to }
    const data = await Repo.getOperationEfficiency(filters)
    return ApiResponse.success(res, data)
  })

  /** GET /api/analytics/recent-activity?limit= */
  static recentActivity = asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 15), 50)
    const data = await Repo.getRecentActivity(limit)
    return ApiResponse.success(res, data)
  })

  /** GET /api/analytics/material-trend?days= */
  static materialTrend = asyncHandler(async (req, res) => {
    const days = Math.min(Number(req.query.days ?? 30), 365)
    const data = await Repo.getMaterialConsumptionTrend(days)
    return ApiResponse.success(res, data)
  })

  /** GET /api/analytics/master-counts */
  static masterCounts = asyncHandler(async (req, res) => {
    const data = await Repo.getMasterDataCounts()
    return ApiResponse.success(res, data)
  })
}
