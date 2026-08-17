import { BomService }     from '../services/bom.service.js'
import { ApiResponse }    from '../utils/ApiResponse.js'
import { asyncHandler }   from '../utils/asyncHandler.js'

export class BomController {
  /** GET /api/bom */
  static list = asyncHandler(async (req, res) => {
    const { data, meta } = await BomService.list(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/bom/:id */
  static getById = asyncHandler(async (req, res) => {
    const data = await BomService.getById(req.params.id)
    return ApiResponse.success(res, data)
  })

  /** POST /api/bom */
  static create = asyncHandler(async (req, res) => {
    const data = await BomService.create(req.body)
    return ApiResponse.created(res, data, 'BOM created successfully.')
  })

  /** PUT /api/bom/:id */
  static update = asyncHandler(async (req, res) => {
    const data = await BomService.update(req.params.id, req.body)
    return ApiResponse.success(res, data, 'BOM updated successfully.')
  })

  /** DELETE /api/bom/:id */
  static remove = asyncHandler(async (req, res) => {
    await BomService.remove(req.params.id)
    return ApiResponse.noContent(res)
  })
}
