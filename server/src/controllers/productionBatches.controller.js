import { ProductionBatchesService } from '../services/productionBatches.service.js'
import { ApiResponse }              from '../utils/ApiResponse.js'
import { asyncHandler }             from '../utils/asyncHandler.js'

export class ProductionBatchesController {

  /** GET /api/production/batches */
  static list = asyncHandler(async (req, res) => {
    const { data, meta } = await ProductionBatchesService.list(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/production/batches/:id */
  static getById = asyncHandler(async (req, res) => {
    const data = await ProductionBatchesService.getById(req.params.id)
    return ApiResponse.success(res, data)
  })

  /** POST /api/production/batches */
  static create = asyncHandler(async (req, res) => {
    const data = await ProductionBatchesService.create(req.body, req.user)
    return ApiResponse.created(res, data, 'Production batch created successfully.')
  })

  /** PUT /api/production/batches/:id */
  static update = asyncHandler(async (req, res) => {
    const data = await ProductionBatchesService.update(req.params.id, req.body, req.user)
    return ApiResponse.success(res, data, 'Production batch updated successfully.')
  })

  /** DELETE /api/production/batches/:id */
  static remove = asyncHandler(async (req, res) => {
    await ProductionBatchesService.remove(req.params.id)
    return ApiResponse.noContent(res)
  })

  /**
   * POST /api/production/batches/:id/transition
   * Body: { to_status, notes?, actual_qty_produced?, actual_qty_scrapped? }
   */
  static transition = asyncHandler(async (req, res) => {
    const { to_status, notes, actual_qty_produced, actual_qty_scrapped } = req.body
    const data = await ProductionBatchesService.transition(
      req.params.id,
      to_status,
      notes,
      { actual_qty_produced, actual_qty_scrapped },
      req.user
    )
    return ApiResponse.success(res, data, `Batch transitioned to "${to_status}".`)
  })
}
