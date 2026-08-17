import { supabaseAdmin } from '../config/supabase.js'
import { AppError }      from '../utils/AppError.js'
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js'

const TABLE = 'products'

export class ProductsRepository {
  static async findAll(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { search, status, category } = query

    let q = supabaseAdmin
      .from(TABLE)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (search) {
      q = q.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
    }
    if (status) q = q.eq('status', status)
    if (category) q = q.ilike('category', `%${category}%`)

    const { data, error, count } = await q
    if (error) throw new AppError(error.message, 500)

    return { data, meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }

  static async findById(id) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') throw new AppError('Product not found.', 404, 'NOT_FOUND')
      throw new AppError(error.message, 500)
    }
    return data
  }

  static async create(payload) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert(payload)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') throw new AppError(`Product code "${payload.code}" already exists.`, 409, 'CONFLICT')
      throw new AppError(error.message, 500)
    }
    return data
  }

  static async update(id, payload) {
    await ProductsRepository.findById(id)

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') throw new AppError(`Product code "${payload.code}" already exists.`, 409, 'CONFLICT')
      throw new AppError(error.message, 500)
    }
    return data
  }

  static async delete(id) {
    await ProductsRepository.findById(id)

    const { error } = await supabaseAdmin
      .from(TABLE)
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === '23503') throw new AppError('Cannot delete product — it is referenced by a BOM.', 409, 'CONFLICT')
      throw new AppError(error.message, 500)
    }
  }

  /** Lightweight list for dropdowns */
  static async findAllActive() {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('id, code, name, uom')
      .eq('status', 'active')
      .order('name')

    if (error) throw new AppError(error.message, 500)
    return data
  }
}
