import { MachinesService } from '../services/machines.service.js'
import { ApiResponse }     from '../utils/ApiResponse.js'
import { asyncHandler }    from '../utils/asyncHandler.js'

export class MachinesController {
  /** GET /api/machines */
  static list = asyncHandler(async (req, res) => {
    const { data, meta } = await MachinesService.list(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/machines/dropdown */
  static dropdown = asyncHandler(async (req, res) => {
    const data = await MachinesService.dropdown()
    return ApiResponse.success(res, data)
  })

  /** GET /api/machines/:id */
  static getById = asyncHandler(async (req, res) => {
    const data = await MachinesService.getById(req.params.id)
    return ApiResponse.success(res, data)
  })

  /** POST /api/machines */
  static create = asyncHandler(async (req, res) => {
    const data = await MachinesService.create(req.body)
    return ApiResponse.created(res, data, 'Machine created successfully.')
  })

  /** PUT /api/machines/:id */
  static update = asyncHandler(async (req, res) => {
    const data = await MachinesService.update(req.params.id, req.body)
    return ApiResponse.success(res, data, 'Machine updated successfully.')
  })

  /** DELETE /api/machines/:id */
  static remove = asyncHandler(async (req, res) => {
    await MachinesService.remove(req.params.id)
    return ApiResponse.noContent(res)
  })
}
