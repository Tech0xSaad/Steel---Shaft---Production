import { supabaseAdmin } from '../config/supabase.js'
import { AppError }      from '../utils/AppError.js'
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js'

const BOM_TABLE   = 'bom'
const ITEMS_TABLE = 'bom_items'

export class BomRepository {
  static async findAll(query) {
    const { page, pageSize, offset } = parsePagination(query)
    const { product_id, is_active } = query

    let q = supabaseAdmin
      .from(BOM_TABLE)
      .select(`
        *,
        product:products ( id, code, name, uom )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (product_id) q = q.eq('product_id', product_id)
    if (is_active !== undefined && is_active !== null) {
      q = q.eq('is_active', is_active)
    }

    const { data, error, count } = await q
    if (error) throw new AppError(error.message, 500)

    return { data, meta: buildPaginationMeta({ page, pageSize, total: count ?? 0 }) }
  }

  static async findById(id) {
    const { data, error } = await supabaseAdmin
      .from(BOM_TABLE)
      .select(`
        *,
        product:products ( id, code, name, uom ),
        items:bom_items (
          *,
          raw_material:raw_materials ( id, code, name, uom, unit_cost )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') throw new AppError('BOM not found.', 404, 'NOT_FOUND')
      throw new AppError(error.message, 500)
    }
    return data
  }

  static async create({ product_id, version, is_active, notes, items }) {
    // 1. Check for duplicate product+version
    const { data: existing } = await supabaseAdmin
      .from(BOM_TABLE)
      .select('id')
      .eq('product_id', product_id)
      .eq('version', version)
      .maybeSingle()

    if (existing) {
      throw new AppError(`BOM version "${version}" already exists for this product.`, 409, 'CONFLICT')
    }

    // 2. Insert BOM header
    const { data: bom, error: bomErr } = await supabaseAdmin
      .from(BOM_TABLE)
      .insert({ product_id, version, is_active, notes })
      .select()
      .single()

    if (bomErr) throw new AppError(bomErr.message, 500)

    // 3. Insert BOM items
    const bomItems = items.map(item => ({
      bom_id:              bom.id,
      raw_material_id:     item.raw_material_id,
      quantity_required:   item.quantity_required,
      uom:                 item.uom,
      scrap_allowance_pct: item.scrap_allowance_pct ?? 0,
      notes:               item.notes ?? null,
    }))

    const { error: itemsErr } = await supabaseAdmin
      .from(ITEMS_TABLE)
      .insert(bomItems)

    if (itemsErr) throw new AppError(itemsErr.message, 500)

    return BomRepository.findById(bom.id)
  }

  static async update(id, { version, is_active, notes, items }) {
    const existing = await BomRepository.findById(id)

    // Update header
    const headerUpdate = {}
    if (version   !== undefined) headerUpdate.version   = version
    if (is_active !== undefined) headerUpdate.is_active = is_active
    if (notes     !== undefined) headerUpdate.notes     = notes

    if (Object.keys(headerUpdate).length) {
      const { error } = await supabaseAdmin
        .from(BOM_TABLE)
        .update(headerUpdate)
        .eq('id', id)

      if (error) {
        if (error.code === '23505') throw new AppError(`BOM version "${version}" already exists for this product.`, 409, 'CONFLICT')
        throw new AppError(error.message, 500)
      }
    }

    // Replace items if provided (full replace strategy)
    if (items && items.length) {
      const { error: delErr } = await supabaseAdmin
        .from(ITEMS_TABLE)
        .delete()
        .eq('bom_id', id)

      if (delErr) throw new AppError(delErr.message, 500)

      const bomItems = items.map(item => ({
        bom_id:              id,
        raw_material_id:     item.raw_material_id,
        quantity_required:   item.quantity_required,
        uom:                 item.uom,
        scrap_allowance_pct: item.scrap_allowance_pct ?? 0,
        notes:               item.notes ?? null,
      }))

      const { error: insertErr } = await supabaseAdmin
        .from(ITEMS_TABLE)
        .insert(bomItems)

      if (insertErr) throw new AppError(insertErr.message, 500)
    }

    return BomRepository.findById(id)
  }

  static async delete(id) {
    await BomRepository.findById(id)
    // bom_items cascade-deleted by FK on delete cascade

    const { error } = await supabaseAdmin
      .from(BOM_TABLE)
      .delete()
      .eq('id', id)

    if (error) throw new AppError(error.message, 500)
  }
}
