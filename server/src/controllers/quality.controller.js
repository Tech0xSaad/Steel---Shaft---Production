import { QualityService } from '../services/quality.service.js'
import { ApiResponse }    from '../utils/ApiResponse.js'
import { asyncHandler }   from '../utils/asyncHandler.js'

export class QualityController {

  /** GET /api/quality/checks */
  static list = asyncHandler(async (req, res) => {
    const { data, meta } = await QualityService.list(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/quality/batches/:batchId/checks */
  static getByBatch = asyncHandler(async (req, res) => {
    const data = await QualityService.getByBatch(req.params.batchId)
    return ApiResponse.success(res, data)
  })

  /** GET /api/quality/checks/:id */
  static getById = asyncHandler(async (req, res) => {
    const data = await QualityService.getById(req.params.id)
    return ApiResponse.success(res, data)
  })

  /** POST /api/quality/batches/:batchId/checks */
  static create = asyncHandler(async (req, res) => {
    const data = await QualityService.create(
      { ...req.body, batch_id: req.params.batchId },
      req.user
    )
    return ApiResponse.created(res, data, 'Quality check created.')
  })

  /** PUT /api/quality/checks/:id */
  static update = asyncHandler(async (req, res) => {
    const data = await QualityService.update(req.params.id, req.body, req.user)
    return ApiResponse.success(res, data, 'Quality check updated.')
  })

  /** DELETE /api/quality/checks/:id */
  static delete = asyncHandler(async (req, res) => {
    await QualityService.delete(req.params.id)
    return ApiResponse.noContent(res)
  })

  /** POST /api/quality/checks/:id/submit */
  static submitResult = asyncHandler(async (req, res) => {
    const data = await QualityService.submitResult(req.params.id, req.body, req.user)
    return ApiResponse.success(res, data, 'Inspection result submitted.')
  })

  /** GET /api/quality/batches/:batchId/completion */
  static getCompletionSummary = asyncHandler(async (req, res) => {
    const data = await QualityService.getCompletionSummary(req.params.batchId)
    return ApiResponse.success(res, data)
  })
}
