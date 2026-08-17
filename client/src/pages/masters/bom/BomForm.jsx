import { useEffect, useState, useCallback } from 'react'
import { useForm }   from '@/hooks/useForm'
import { Input }     from '@/components/ui/Input'
import { Select }    from '@/components/ui/Select'
import { Textarea }  from '@/components/ui/Textarea'
import { Button }    from '@/components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { productsService }     from '@/services/productsService'
import { rawMaterialsService } from '@/services/rawMaterialsService'
import { Trash2, Plus } from 'lucide-react'

const UOM_OPTIONS = [
  { value: 'kg',    label: 'kg' },
  { value: 'g',     label: 'g' },
  { value: 'ton',   label: 'ton' },
  { value: 'mm',    label: 'mm' },
  { value: 'm',     label: 'm' },
  { value: 'pcs',   label: 'pcs' },
  { value: 'litre', label: 'litre' },
  { value: 'ml',    label: 'ml' },
  { value: 'set',   label: 'set' },
]

const EMPTY_HEADER = { product_id: '', version: '1.0', is_active: true, notes: '' }
const EMPTY_LINE   = () => ({ _id: crypto.randomUUID(), raw_material_id: '', quantity_required: '', uom: 'kg', scrap_allowance_pct: '0', notes: '' })

function validateHeader(v) {
  const e = {}
  if (!v.product_id) e.product_id = 'Product is required.'
  if (!v.version?.trim()) e.version = 'Version is required.'
  return e
}

export function BomForm({ open, onClose, onSubmit, initial, loading }) {
  const isEdit = !!initial?.id
  const { values, errors, handleChange, setValues, validate: runValidate, resetForm, setErrors } = useForm(EMPTY_HEADER, validateHeader)

  const [products,      setProducts]      = useState([])
  const [rawMaterials,  setRawMaterials]  = useState([])
  const [lines,         setLines]         = useState([EMPTY_LINE()])
  const [lineErrors,    setLineErrors]    = useState([])

  // Load dropdowns once
  useEffect(() => {
    productsService.dropdown().then(d => setProducts(d ?? [])).catch(() => {})
    rawMaterialsService.dropdown().then(d => setRawMaterials(d ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (open) {
      if (initial) {
        setValues({
          product_id: initial.product_id ?? '',
          version:    initial.version    ?? '1.0',
          is_active:  initial.is_active  ?? true,
          notes:      initial.notes      ?? '',
        })
        setLines(
          (initial.items ?? []).map(item => ({
            _id:                 item.id ?? crypto.randomUUID(),
            raw_material_id:     item.raw_material_id ?? '',
            quantity_required:   item.quantity_required ?? '',
            uom:                 item.uom ?? 'kg',
            scrap_allowance_pct: item.scrap_allowance_pct ?? '0',
            notes:               item.notes ?? '',
          }))
        )
      } else {
        setValues(EMPTY_HEADER)
        setLines([EMPTY_LINE()])
      }
      setLineErrors([])
    }
    if (!open) { resetForm(); setLines([EMPTY_LINE()]); setLineErrors([]) }
  }, [open, initial])

  // Line handlers
  const updateLine = useCallback((idx, field, val) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: val } : l))
    setLineErrors(prev => { const n = [...prev]; if (n[idx]) n[idx] = { ...n[idx], [field]: undefined }; return n })
  }, [])

  const addLine    = () => setLines(prev => [...prev, EMPTY_LINE()])
  const removeLine = (idx) => setLines(prev => prev.filter((_, i) => i !== idx))

  function validateLines() {
    const errs = lines.map(l => {
      const e = {}
      if (!l.raw_material_id)       e.raw_material_id   = 'Select a material.'
      if (!l.quantity_required || +l.quantity_required <= 0) e.quantity_required = 'Enter qty > 0.'
      return e
    })
    setLineErrors(errs)
    return errs.every(e => Object.keys(e).length === 0)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const headerOk = runValidate()
    const linesOk  = validateLines()
    if (!headerOk || !linesOk) return

    onSubmit({
      product_id: values.product_id,
      version:    values.version,
      is_active:  Boolean(values.is_active),
      notes:      values.notes || null,
      items: lines.map(l => ({
        raw_material_id:     l.raw_material_id,
        quantity_required:   +l.quantity_required,
        uom:                 l.uom,
        scrap_allowance_pct: +l.scrap_allowance_pct || 0,
        notes:               l.notes || null,
      })),
    })
  }

  const productOptions      = products.map(p      => ({ value: p.id, label: `${p.code} — ${p.name}` }))
  const rawMaterialOptions  = rawMaterials.map(m  => ({ value: m.id, label: `${m.code} — ${m.name} (${m.uom})` }))

  // Compute total estimated cost from line quantities × unit costs
  const totalCost = lines.reduce((sum, l) => {
    const mat = rawMaterials.find(m => m.id === l.raw_material_id)
    const qty = +l.quantity_required || 0
    const scrap = (+l.scrap_allowance_pct || 0) / 100
    return sum + (mat?.unit_cost ?? 0) * qty * (1 + scrap)
  }, 0)

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit BOM' : 'New Bill of Materials'} size="xl">
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody className="space-y-6">

          {/* Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Product" name="product_id" value={values.product_id}
              onChange={handleChange} options={productOptions}
              placeholder="Select product…" error={errors.product_id} required
              disabled={isEdit}
              className="sm:col-span-2"
            />
            <Input label="Version" name="version" value={values.version}
              onChange={handleChange} error={errors.version} required
              placeholder="e.g. 1.0" />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_active" checked={values.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm font-medium text-surface-700">Active BOM</span>
            </label>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-surface-800">Material Lines</p>
              <Button type="button" variant="secondary" size="sm" onClick={addLine}
                leftIcon={<Plus className="h-4 w-4" />}>
                Add Line
              </Button>
            </div>

            <div className="rounded-xl border border-surface-200 overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-0 bg-surface-50 border-b border-surface-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-surface-500">
                <span>Raw Material</span>
                <span>Quantity</span>
                <span>UOM</span>
                <span>Scrap %</span>
                <span className="w-8" />
              </div>

              {lines.map((line, idx) => (
                <div key={line._id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-start px-3 py-3 border-b border-surface-100 last:border-b-0 bg-white">

                  {/* Material */}
                  <div>
                    <select
                      value={line.raw_material_id}
                      onChange={e => updateLine(idx, 'raw_material_id', e.target.value)}
                      className={`w-full rounded-lg border text-sm px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${lineErrors[idx]?.raw_material_id ? 'border-red-400' : 'border-surface-300'}`}
                      aria-label="Select raw material"
                    >
                      <option value="">Select material…</option>
                      {rawMaterialOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    {lineErrors[idx]?.raw_material_id && (
                      <p className="text-xs text-red-600 mt-0.5">{lineErrors[idx].raw_material_id}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <input type="number" min="0" step="any"
                      value={line.quantity_required}
                      onChange={e => updateLine(idx, 'quantity_required', e.target.value)}
                      className={`w-full rounded-lg border text-sm px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${lineErrors[idx]?.quantity_required ? 'border-red-400' : 'border-surface-300'}`}
                      placeholder="0"
                      aria-label="Quantity required"
                    />
                    {lineErrors[idx]?.quantity_required && (
                      <p className="text-xs text-red-600 mt-0.5">{lineErrors[idx].quantity_required}</p>
                    )}
                  </div>

                  {/* UOM */}
                  <select value={line.uom}
                    onChange={e => updateLine(idx, 'uom', e.target.value)}
                    className="w-full rounded-lg border border-surface-300 text-sm px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    aria-label="Unit of measure">
                    {UOM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>

                  {/* Scrap % */}
                  <input type="number" min="0" max="100" step="0.1"
                    value={line.scrap_allowance_pct}
                    onChange={e => updateLine(idx, 'scrap_allowance_pct', e.target.value)}
                    className="w-full rounded-lg border border-surface-300 text-sm px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    placeholder="0"
                    aria-label="Scrap allowance percent"
                  />

                  {/* Remove */}
                  <button type="button" onClick={() => removeLine(idx)} disabled={lines.length === 1}
                    className="mt-1 rounded-lg p-1.5 text-surface-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Remove line">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Cost summary */}
            {totalCost > 0 && (
              <div className="flex justify-end mt-2">
                <p className="text-sm text-surface-600">
                  Est. material cost:{' '}
                  <span className="font-semibold text-surface-900">
                    ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </p>
              </div>
            )}
          </div>

          <Textarea label="Notes" name="notes" value={values.notes} onChange={handleChange} rows={2} />

        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Create BOM'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
