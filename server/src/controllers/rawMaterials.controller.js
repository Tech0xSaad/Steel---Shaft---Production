import { RawMaterialsService } from '../services/rawMaterials.service.js'
import { ApiResponse }         from '../utils/ApiResponse.js'
import { asyncHandler }        from '../utils/asyncHandler.js'

export class RawMaterialsController {
  /** GET /api/raw-materials */
  static list = asyncHandler(async (req, res) => {
    const { data, meta } = await RawMaterialsService.list(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/raw-materials/dropdown */
  static dropdown = asyncHandler(async (req, res) => {
    const data = await RawMaterialsService.dropdown()
    return ApiResponse.success(res, data)
  })

  /** GET /api/raw-materials/:id */
  static getById = asyncHandler(async (req, res) => {
    const data = await RawMaterialsService.getById(req.params.id)
    return ApiResponse.success(res, data)
  })

  /** POST /api/raw-materials */
  static create = asyncHandler(async (req, res) => {
    const data = await RawMaterialsService.create(req.body)
    return ApiResponse.created(res, data, 'Raw material created successfully.')
  })

  /** PUT /api/raw-materials/:id */
  static update = asyncHandler(async (req, res) => {
    const data = await RawMaterialsService.update(req.params.id, req.body)
    return ApiResponse.success(res, data, 'Raw material updated successfully.')
  })

  /** DELETE /api/raw-materials/:id */
  static remove = asyncHandler(async (req, res) => {
    await RawMaterialsService.remove(req.params.id)
    return ApiResponse.noContent(res)
  })
}
