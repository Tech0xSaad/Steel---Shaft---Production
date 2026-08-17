import { ManufacturingService } from '../services/manufacturing.service.js'
import { ApiResponse }          from '../utils/ApiResponse.js'
import { asyncHandler }         from '../utils/asyncHandler.js'

export class ManufacturingController {

  // ── Operation Types ───────────────────────────────────────────
  /** GET /api/manufacturing/operation-types */
  static listOpTypes = asyncHandler(async (req, res) => {
    const activeOnly = req.query.active_only === 'true'
    const data = await ManufacturingService.listOpTypes(activeOnly)
    return ApiResponse.success(res, data)
  })

  /** GET /api/manufacturing/operation-types/:id */
  static getOpType = asyncHandler(async (req, res) => {
    const data = await ManufacturingService.getOpTypeById(req.params.id)
    return ApiResponse.success(res, data)
  })

  /** POST /api/manufacturing/operation-types */
  static createOpType = asyncHandler(async (req, res) => {
    const data = await ManufacturingService.createOpType(req.body)
    return ApiResponse.created(res, data, 'Operation type created.')
  })

  /** PUT /api/manufacturing/operation-types/:id */
  static updateOpType = asyncHandler(async (req, res) => {
    const data = await ManufacturingService.updateOpType(req.params.id, req.body)
    return ApiResponse.success(res, data, 'Operation type updated.')
  })

  // ── Batch Operations ──────────────────────────────────────────
  /** GET /api/manufacturing/operations?batch_id=&status=&machine_id= */
  static listOperations = asyncHandler(async (req, res) => {
    const { data, meta } = await ManufacturingService.listOperations(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/manufacturing/batches/:batchId/operations */
  static getOperationsByBatch = asyncHandler(async (req, res) => {
    const data = await ManufacturingService.getOperationsByBatch(req.params.batchId)
    return ApiResponse.success(res, data)
  })

  /** GET /api/manufacturing/operations/:id */
  static getOperation = asyncHandler(async (req, res) => {
    const data = await ManufacturingService.getOperationById(req.params.id)
    return ApiResponse.success(res, data)
  })

  /** POST /api/manufacturing/batches/:batchId/operations */
  static addOperation = asyncHandler(async (req, res) => {
    const data = await ManufacturingService.addOperation(req.params.batchId, req.body, req.user)
    return ApiResponse.created(res, data, 'Operation added to batch.')
  })

  /** PUT /api/manufacturing/operations/:id */
  static updateOperation = asyncHandler(async (req, res) => {
    const data = await ManufacturingService.updateOperation(req.params.id, req.body, req.user)
    return ApiResponse.success(res, data, 'Operation updated.')
  })

  /** DELETE /api/manufacturing/operations/:id */
  static deleteOperation = asyncHandler(async (req, res) => {
    await ManufacturingService.deleteOperation(req.params.id)
    return ApiResponse.noContent(res)
  })

  /** POST /api/manufacturing/operations/:id/transition */
  static transitionOperation = asyncHandler(async (req, res) => {
    const data = await ManufacturingService.transitionOperation(req.params.id, req.body, req.user)
    return ApiResponse.success(res, data, `Operation moved to "${req.body.to_status}".`)
  })

  // ── Production Entries ────────────────────────────────────────
  /** GET /api/manufacturing/operations/:id/entries */
  static listEntries = asyncHandler(async (req, res) => {
    const { data, meta } = await ManufacturingService.getEntriesByOperation(req.params.id, req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** POST /api/manufacturing/operations/:id/entries */
  static addEntry = asyncHandler(async (req, res) => {
    const data = await ManufacturingService.addProductionEntry(req.params.id, req.body, req.user)
    return ApiResponse.created(res, data, 'Production entry recorded.')
  })
}
