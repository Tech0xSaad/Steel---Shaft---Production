import { useEffect, useState, useCallback } from 'react'
import { useForm }          from '@/hooks/useForm'
import { Input }            from '@/components/ui/Input'
import { Select }           from '@/components/ui/Select'
import { Textarea }         from '@/components/ui/Textarea'
import { Button }           from '@/components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { productsService }  from '@/services/productsService'
import { bomService }       from '@/services/bomService'
import { machinesService }  from '@/services/machinesService'
import { warehousesService } from '@/services/warehousesService'
import { Calculator, Package } from 'lucide-react'

const UOM_OPTIONS = [
  { value: 'pcs',   label: 'pcs'   },
  { value: 'kg',    label: 'kg'    },
  { value: 'set',   label: 'set'   },
  { value: 'litre', label: 'litre' },
]

const PRIORITY_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} — ${i + 1 <= 3 ? 'High' : i + 1 <= 7 ? 'Medium' : 'Low'}`,
}))

const EMPTY = {
  product_id: '', bom_id: '', planned_qty: '',
  uom: 'pcs', planned_start_date: '', planned_end_date: '',
  machine_id: '', warehouse_id: '', priority: '5', notes: '',
}

function validate(v) {
  const e = {}
  if (!v.product_id)                        e.product_id  = 'Product is required.'
  if (!v.bom_id)                            e.bom_id      = 'BOM is required.'
  if (!v.planned_qty || +v.planned_qty <= 0) e.planned_qty = 'Planned quantity must be greater than 0.'
  return e
}

export function BatchForm({ open, onClose, onSubmit, initial, loading }) {
  const isEdit = !!initial?.id
  const { values, errors, handleChange, setValues, mergeValues, validate: runValidate, resetForm } = useForm(EMPTY, validate)

  // Dropdown options
  const [products,    setProducts]    = useState([])
  const [boms,        setBoms]        = useState([])
  const [machines,    setMachines]    = useState([])
  const [warehouses,  setWarehouses]  = useState([])
  const [bomsLoading, setBomsLoading] = useState(false)

  // Auto-calculated preview (client-side mirror of server calc)
  const [preview, setPreview] = useState(null)
  const [selectedBom, setSelectedBom] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Load static dropdowns once
  useEffect(() => {
    productsService.dropdown().then(d => setProducts(d ?? [])).catch(() => {})
    machinesService.dropdown().then(d => setMachines(d ?? [])).catch(() => {})
    warehousesService.dropdown().then(d => setWarehouses(d ?? [])).catch(() => {})
  }, [])

  // When product changes, load its active BOMs
  useEffect(() => {
    if (!values.product_id) { setBoms([]); setSelectedBom(null); setSelectedProduct(null); return }
    const prod = products.find(p => p.id === values.product_id)
    setSelectedProduct(prod ?? null)
    setBomsLoading(true)
    bomService.list({ product_id: values.product_id, is_active: true, pageSize: 100 })
      .then(res => {
        const list = (res.data ?? []).map(b => ({ value: b.id, label: `v${b.version}` }))
        setBoms(list)
        // Auto-select the only BOM without wiping the rest of the form.
        // mergeValues does a partial merge, setValues replaces everything.
        if (list.length === 1 && !values.bom_id) {
          mergeValues({ bom_id: list[0].value })
        }
      })
      .catch(() => setBoms([]))
      .finally(() => setBomsLoading(false))
  }, [values.product_id, products])

  // When BOM changes, load full BOM detail for preview
  useEffect(() => {
    if (!values.bom_id) { setSelectedBom(null); return }
    bomService.getById(values.bom_id).then(b => setSelectedBom(b)).catch(() => setSelectedBom(null))
  }, [values.bom_id])

  // Recalculate preview whenever qty, product or BOM changes
  useEffect(() => {
    if (!selectedBom || !selectedProduct || !values.planned_qty || +values.planned_qty <= 0) {
      setPreview(null); return
    }
    const qty      = +values.planned_qty
    const scrapPct = +(selectedProduct.expected_scrap_pct ?? 0)
    const yieldQty = qty * (1 - scrapPct / 100)
    const scrapQty = qty * (scrapPct / 100)
    const setupMin = +(selectedProduct.setup_time_minutes  ?? 0)
    const cycleMin = +(selectedProduct.cycle_time_minutes  ?? 0) * qty
    const totalMin = setupMin + cycleMin

    const matCost = (selectedBom.items ?? []).reduce((sum, item) => {
      const cost     = +(item.raw_material?.unit_cost ?? 0)
      const reqQty   = +(item.quantity_required)
      const itemScr  = +(item.scrap_allowance_pct ?? 0) / 100
      return sum + cost * reqQty * qty * (1 + itemScr)
    }, 0)

    setPreview({
      yieldQty:   yieldQty.toFixed(3),
      scrapQty:   scrapQty.toFixed(3),
      scrapPct,
      setupMin:   setupMin.toFixed(0),
      cycleMin:   cycleMin.toFixed(0),
      totalMin:   totalMin.toFixed(0),
      matCost:    matCost.toFixed(2),
      lineCount:  selectedBom.items?.length ?? 0,
    })
  }, [selectedBom, selectedProduct, values.planned_qty])

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (initial) {
        setValues({
          product_id:         initial.product_id         ?? '',
          bom_id:             initial.bom_id             ?? '',
          planned_qty:        initial.planned_qty        ?? '',
          uom:                initial.uom                ?? 'pcs',
          planned_start_date: initial.planned_start_date ?? '',
          planned_end_date:   initial.planned_end_date   ?? '',
          machine_id:         initial.machine_id         ?? '',
          warehouse_id:       initial.warehouse_id       ?? '',
          priority:           String(initial.priority ?? 5),
          notes:              initial.notes              ?? '',
        })
      } else {
        resetForm()
      }
    }
    if (!open) { resetForm(); setPreview(null); setSelectedBom(null) }
  }, [open, initial])

  function handleSubmit(e) {
    e.preventDefault()
    if (!runValidate()) return
    onSubmit({
      product_id:         values.product_id,
      bom_id:             values.bom_id,
      planned_qty:        +values.planned_qty,
      uom:                values.uom,
      planned_start_date: values.planned_start_date || null,
      planned_end_date:   values.planned_end_date   || null,
      machine_id:         values.machine_id         || null,
      warehouse_id:       values.warehouse_id        || null,
      priority:           +values.priority,
      notes:              values.notes               || null,
    })
  }

  const productOptions   = products.map(p   => ({ value: p.id, label: `${p.code} — ${p.name}` }))
  const machineOptions   = [{ value: '', label: 'No machine assigned' },
    ...machines.map(m => ({ value: m.id, label: `${m.code} — ${m.name}` }))]
  const warehouseOptions = [{ value: '', label: 'No output warehouse' },
    ...warehouses.map(w => ({ value: w.id, label: `${w.code} — ${w.name}` }))]

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Batch Plan' : 'New Production Batch'} size="xl">
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody className="space-y-6">

          {/* Product + BOM */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 mb-3">Product & BOM</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Product" name="product_id" value={values.product_id}
                onChange={handleChange} options={productOptions}
                placeholder="Select product…" error={errors.product_id}
                required disabled={isEdit}
              />
              <Select
                label="BOM Version" name="bom_id" value={values.bom_id}
                onChange={handleChange} options={boms}
                placeholder={bomsLoading ? 'Loading…' : 'Select BOM…'}
                error={errors.bom_id} required disabled={isEdit || !values.product_id}
              />
            </div>
          </div>

          {/* Quantities */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 mb-3">Production Quantity</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Planned Quantity" name="planned_qty" type="number" min="1" step="any"
                value={values.planned_qty} onChange={handleChange}
                error={errors.planned_qty} required
              />
              <Select label="UOM" name="uom" value={values.uom}
                onChange={handleChange} options={UOM_OPTIONS} />
              <Select label="Priority (1=High)" name="priority" value={values.priority}
                onChange={handleChange} options={PRIORITY_OPTIONS} />
            </div>
          </div>

          {/* Auto-calculated preview */}
          {preview && (
            <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-4 w-4 text-primary-600" aria-hidden="true" />
                <p className="text-sm font-semibold text-primary-800">Auto-Calculated Estimates</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <PreviewField label="Expected Yield"   value={`${preview.yieldQty} ${values.uom}`} />
                <PreviewField label="Expected Scrap"   value={`${preview.scrapQty} ${values.uom} (${preview.scrapPct}%)`} />
                <PreviewField label="Setup Time"       value={`${preview.setupMin} min`} />
                <PreviewField label="Total Cycle Time" value={`${preview.cycleMin} min`} />
                <PreviewField label="Total Time"       value={`${preview.totalMin} min`} />
                <PreviewField label="Material Lines"   value={preview.lineCount} />
                <PreviewField
                  label="Est. Material Cost"
                  value={`₹${Number(preview.matCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  highlight
                />
              </div>

              {/* BOM material lines summary */}
              {selectedBom?.items?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-primary-200">
                  <p className="text-xs font-semibold text-primary-700 mb-2 flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" /> Required Materials
                  </p>
                  <div className="space-y-1">
                    {selectedBom.items.map(item => {
                      const needed = +(item.quantity_required) * +values.planned_qty * (1 + +(item.scrap_allowance_pct ?? 0) / 100)
                      const available = +(item.raw_material?.current_stock_qty ?? 0)
                      const shortage  = available < needed
                      return (
                        <div key={item.id} className={`flex items-center justify-between text-xs px-2 py-1 rounded-lg ${shortage ? 'bg-red-50 text-red-700' : 'bg-white/70 text-surface-700'}`}>
                          <span className="font-medium">{item.raw_material?.code} — {item.raw_material?.name}</span>
                          <span className={shortage ? 'font-semibold' : ''}>
                            Need {needed.toFixed(3)} {item.uom}
                            {shortage && ` · Only ${available.toFixed(3)} available ⚠`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Schedule */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 mb-3">Schedule</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Planned Start Date" name="planned_start_date" type="date"
                value={values.planned_start_date} onChange={handleChange} />
              <Input label="Planned End Date" name="planned_end_date" type="date"
                value={values.planned_end_date} onChange={handleChange} />
            </div>
          </div>

          {/* Resources */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 mb-3">Resources</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Machine" name="machine_id" value={values.machine_id}
                onChange={handleChange} options={machineOptions} />
              <Select label="Output Warehouse" name="warehouse_id" value={values.warehouse_id}
                onChange={handleChange} options={warehouseOptions} />
            </div>
          </div>

          <Textarea label="Notes" name="notes" value={values.notes}
            onChange={handleChange} rows={2} />

        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Create Batch'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

function PreviewField({ label, value, highlight }) {
  return (
    <div>
      <p className="text-xs text-primary-600">{label}</p>
      <p className={`font-semibold ${highlight ? 'text-primary-900 text-base' : 'text-primary-800'}`}>{value}</p>
    </div>
  )
}
