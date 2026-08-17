import { useEffect } from 'react'
import { useForm }   from '@/hooks/useForm'
import { Input }     from '@/components/ui/Input'
import { Select }    from '@/components/ui/Select'
import { Textarea }  from '@/components/ui/Textarea'
import { Button }    from '@/components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'

const EMPTY = {
  code: '', name: '', description: '', category: '', uom: 'kg',
  grade: '', diameter_mm: '', length_mm: '', weight_per_unit_kg: '',
  min_stock_qty: '0', reorder_qty: '0', current_stock_qty: '0',
  unit_cost: '0', primary_supplier: '', lead_time_days: '0',
  status: 'active', notes: '',
}

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

const STATUS_OPTIONS = [
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

function validate(v) {
  const e = {}
  if (!v.code?.trim()) e.code = 'Material code is required.'
  if (!v.name?.trim()) e.name = 'Material name is required.'
  if (!v.uom)          e.uom  = 'Unit of measure is required.'
  return e
}

export function RawMaterialForm({ open, onClose, onSubmit, initial, loading }) {
  const isEdit = !!initial?.id
  const { values, errors, handleChange, setValues, validate: runValidate, resetForm } = useForm(EMPTY, validate)

  useEffect(() => {
    if (open) {
      setValues(initial ? {
        code:               initial.code               ?? '',
        name:               initial.name               ?? '',
        description:        initial.description        ?? '',
        category:           initial.category           ?? '',
        uom:                initial.uom                ?? 'kg',
        grade:              initial.grade              ?? '',
        diameter_mm:        initial.diameter_mm        ?? '',
        length_mm:          initial.length_mm          ?? '',
        weight_per_unit_kg: initial.weight_per_unit_kg ?? '',
        min_stock_qty:      initial.min_stock_qty      ?? '0',
        reorder_qty:        initial.reorder_qty        ?? '0',
        current_stock_qty:  initial.current_stock_qty  ?? '0',
        unit_cost:          initial.unit_cost          ?? '0',
        primary_supplier:   initial.primary_supplier   ?? '',
        lead_time_days:     initial.lead_time_days     ?? '0',
        status:             initial.status             ?? 'active',
        notes:              initial.notes              ?? '',
      } : EMPTY)
    }
    if (!open) resetForm()
  }, [open, initial])

  function handleSubmit(e) {
    e.preventDefault()
    if (!runValidate()) return
    const payload = { ...values }
    const numFields = ['diameter_mm','length_mm','weight_per_unit_kg',
                       'min_stock_qty','reorder_qty','current_stock_qty',
                       'unit_cost','lead_time_days']
    numFields.forEach(f => { payload[f] = payload[f] === '' ? null : +payload[f] })
    const textFields = ['description','category','grade','primary_supplier','notes']
    textFields.forEach(f => { if (!payload[f]) payload[f] = null })
    onSubmit(payload)
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Raw Material' : 'New Raw Material'} size="lg">
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody className="space-y-5">

          {/* Basic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Material Code" name="code" value={values.code}
              onChange={handleChange} error={errors.code} required />
            <Input label="Material Name" name="name" value={values.name}
              onChange={handleChange} error={errors.name} required />
            <Input label="Category" name="category" value={values.category}
              onChange={handleChange} />
            <Select label="Unit of Measure" name="uom" value={values.uom}
              onChange={handleChange} options={UOM_OPTIONS} error={errors.uom} required />
          </div>

          <Textarea label="Description" name="description" value={values.description}
            onChange={handleChange} rows={2} />

          {/* Physical */}
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 pt-1">Physical Properties</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Grade / Specification" name="grade" value={values.grade}
              onChange={handleChange} />
            <Input label="Weight per Unit (kg)" name="weight_per_unit_kg" type="number" min="0"
              value={values.weight_per_unit_kg} onChange={handleChange} />
            <Input label="Diameter (mm)" name="diameter_mm" type="number" min="0"
              value={values.diameter_mm} onChange={handleChange} />
            <Input label="Length (mm)" name="length_mm" type="number" min="0"
              value={values.length_mm} onChange={handleChange} />
          </div>

          {/* Inventory */}
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 pt-1">Inventory Thresholds</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Current Stock" name="current_stock_qty" type="number" min="0"
              value={values.current_stock_qty} onChange={handleChange} />
            <Input label="Min Stock" name="min_stock_qty" type="number" min="0"
              value={values.min_stock_qty} onChange={handleChange} />
            <Input label="Reorder Qty" name="reorder_qty" type="number" min="0"
              value={values.reorder_qty} onChange={handleChange} />
          </div>

          {/* Supplier & Costing */}
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 pt-1">Supplier & Costing</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Unit Cost (₹)" name="unit_cost" type="number" min="0"
              value={values.unit_cost} onChange={handleChange} />
            <Input label="Lead Time (days)" name="lead_time_days" type="number" min="0"
              value={values.lead_time_days} onChange={handleChange} />
            <Input label="Primary Supplier" name="primary_supplier" value={values.primary_supplier}
              onChange={handleChange} className="sm:col-span-2" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Status" name="status" value={values.status}
              onChange={handleChange} options={STATUS_OPTIONS} />
            <Textarea label="Notes" name="notes" value={values.notes}
              onChange={handleChange} rows={2} />
          </div>

        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Create Material'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
