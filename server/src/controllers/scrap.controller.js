import { ScrapService } from '../services/scrap.service.js'
import { ApiResponse }  from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export class ScrapController {

  /** GET /api/scrap */
  static list = asyncHandler(async (req, res) => {
    const { data, meta } = await ScrapService.list(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/scrap/batches/:batchId */
  static getByBatch = asyncHandler(async (req, res) => {
    const data = await ScrapService.getByBatch(req.params.batchId)
    return ApiResponse.success(res, data)
  })

  /** GET /api/scrap/:id */
  static getById = asyncHandler(async (req, res) => {
    const data = await ScrapService.getById(req.params.id)
    return ApiResponse.success(res, data)
  })

  /** POST /api/scrap */
  static create = asyncHandler(async (req, res) => {
    const data = await ScrapService.create(req.body, req.user)
    return ApiResponse.created(res, data, 'Scrap record created.')
  })

  /** PUT /api/scrap/:id */
  static update = asyncHandler(async (req, res) => {
    const data = await ScrapService.update(req.params.id, req.body, req.user)
    return ApiResponse.success(res, data, 'Scrap record updated.')
  })

  /** DELETE /api/scrap/:id */
  static delete = asyncHandler(async (req, res) => {
    await ScrapService.delete(req.params.id)
    return ApiResponse.noContent(res)
  })

  /** POST /api/scrap/:id/dispose */
  static markDisposed = asyncHandler(async (req, res) => {
    const data = await ScrapService.markDisposed(req.params.id, req.body)
    return ApiResponse.success(res, data, 'Scrap marked as disposed.')
  })

  /** GET /api/scrap/summary/by-category */
  static summaryByCategory = asyncHandler(async (req, res) => {
    const data = await ScrapService.getSummaryByCategory(req.query)
    return ApiResponse.success(res, data)
  })

  /** GET /api/scrap/batches/:batchId/totals */
  static getTotalsForBatch = asyncHandler(async (req, res) => {
    const data = await ScrapService.getTotalsForBatch(req.params.batchId)
    return ApiResponse.success(res, data)
  })
}
