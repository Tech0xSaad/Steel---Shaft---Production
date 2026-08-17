import { supabaseAdmin } from '../config/supabase.js'
import { AppError }      from '../utils/AppError.js'
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js'

const TABLE = 'warehouses'

export class WarehousesRepository {
  static async findAll(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { search, type, is_active } = query

    let q = supabaseAdmin
      .from(TABLE)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (search)    q = q.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
    if (type)      q = q.eq('warehouse_type', type)
    if (is_active !== undefined && is_active !== null) {
      q = q.eq('is_active', is_active)
    }

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
      if (error.code === 'PGRST116') throw new AppError('Warehouse not found.', 404, 'NOT_FOUND')
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
      if (error.code === '23505') throw new AppError(`Warehouse code "${payload.code}" already exists.`, 409, 'CONFLICT')
      throw new AppError(error.message, 500)
    }
    return data
  }

  static async update(id, payload) {
    await WarehousesRepository.findById(id)

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') throw new AppError(`Warehouse code "${payload.code}" already exists.`, 409, 'CONFLICT')
      throw new AppError(error.message, 500)
    }
    return data
  }

  static async delete(id) {
    await WarehousesRepository.findById(id)

    const { error } = await supabaseAdmin
      .from(TABLE)
      .delete()
      .eq('id', id)

    if (error) throw new AppError(error.message, 500)
  }

  static async findAllActive() {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('id, code, name, warehouse_type')
      .eq('is_active', true)
      .order('name')

    if (error) throw new AppError(error.message, 500)
    return data
  }
}
