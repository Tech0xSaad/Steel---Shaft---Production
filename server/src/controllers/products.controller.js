import { ProductsService } from '../services/products.service.js'
import { ApiResponse }     from '../utils/ApiResponse.js'
import { asyncHandler }    from '../utils/asyncHandler.js'

export class ProductsController {
  /** GET /api/products */
  static list = asyncHandler(async (req, res) => {
    const { data, meta } = await ProductsService.list(req.query)
    return ApiResponse.paginated(res, data, meta)
  })

  /** GET /api/products/dropdown */
  static dropdown = asyncHandler(async (req, res) => {
    const data = await ProductsService.dropdown()
    return ApiResponse.success(res, data)
  })

  /** GET /api/products/:id */
  static getById = asyncHandler(async (req, res) => {
    const data = await ProductsService.getById(req.params.id)
    return ApiResponse.success(res, data)
  })

  /** POST /api/products */
  static create = asyncHandler(async (req, res) => {
    const data = await ProductsService.create(req.body)
    return ApiResponse.created(res, data, 'Product created successfully.')
  })

  /** PUT /api/products/:id */
  static update = asyncHandler(async (req, res) => {
    const data = await ProductsService.update(req.params.id, req.body)
    return ApiResponse.success(res, data, 'Product updated successfully.')
  })

  /** DELETE /api/products/:id */
  static remove = asyncHandler(async (req, res) => {
    await ProductsService.remove(req.params.id)
    return ApiResponse.noContent(res)
  })
}
