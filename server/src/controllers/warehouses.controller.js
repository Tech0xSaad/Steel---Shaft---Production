import { WarehousesService } from '../services/warehouses.service.js'
import { ApiResponse }       from '../utils/ApiResponse.js'
import { asyncHandler }      from '../utils/asyncHandler.js'

export class WarehousesController {
  /** GET /api/warehouses */
  static list = asyncHandler(async (req, res) => {
    const { data, meta } = await WarehousesService.list(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/warehouses/dropdown */
  static dropdown = asyncHandler(async (req, res) => {
    const data = await WarehousesService.dropdown()
    return ApiResponse.success(res, data)
  })

  /** GET /api/warehouses/:id */
  static getById = asyncHandler(async (req, res) => {
    const data = await WarehousesService.getById(req.params.id)
    return ApiResponse.success(res, data)
  })

  /** POST /api/warehouses */
  static create = asyncHandler(async (req, res) => {
    const data = await WarehousesService.create(req.body)
    return ApiResponse.created(res, data, 'Warehouse created successfully.')
  })

  /** PUT /api/warehouses/:id */
  static update = asyncHandler(async (req, res) => {
    const data = await WarehousesService.update(req.params.id, req.body)
    return ApiResponse.success(res, data, 'Warehouse updated successfully.')
  })

  /** DELETE /api/warehouses/:id */
  static remove = asyncHandler(async (req, res) => {
    await WarehousesService.remove(req.params.id)
    return ApiResponse.noContent(res)
  })
}
