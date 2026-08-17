import { useEffect } from 'react'
import { useForm }   from '@/hooks/useForm'
import { Input }     from '@/components/ui/Input'
import { Select }    from '@/components/ui/Select'
import { Textarea }  from '@/components/ui/Textarea'
import { Button }    from '@/components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'

const EMPTY = {
  code: '', name: '', description: '', category: '', uom: 'pcs',
  diameter_mm: '', length_mm: '', weight_kg: '',
  material_grade: '', hardness_spec: '', surface_finish: '', tolerance_spec: '',
  cycle_time_minutes: '', setup_time_minutes: '', expected_scrap_pct: '0',
  standard_cost: '0', selling_price: '0',
  status: 'active', notes: '',
}

const UOM_OPTIONS = [
  { value: 'pcs',   label: 'pcs' },
  { value: 'kg',    label: 'kg' },
  { value: 'g',     label: 'g' },
  { value: 'ton',   label: 'ton' },
  { value: 'mm',    label: 'mm' },
  { value: 'm',     label: 'm' },
  { value: 'litre', label: 'litre' },
  { value: 'ml',    label: 'ml' },
  { value: 'set',   label: 'set' },
]

const STATUS_OPTIONS = [
  { value: 'active',       label: 'Active' },
  { value: 'inactive',     label: 'Inactive' },
  { value: 'discontinued', label: 'Discontinued' },
]

function validate(v) {
  const e = {}
  if (!v.code?.trim())     e.code = 'Product code is required.'
  if (!v.name?.trim())     e.name = 'Product name is required.'
  if (!v.uom)              e.uom  = 'Unit of measure is required.'
  if (v.expected_scrap_pct !== '' && (isNaN(v.expected_scrap_pct) || +v.expected_scrap_pct < 0 || +v.expected_scrap_pct > 100))
    e.expected_scrap_pct = 'Must be 0–100.'
  return e
}

export function ProductForm({ open, onClose, onSubmit, initial, loading }) {
  const isEdit = !!initial?.id
  const { values, errors, handleChange, setValues, validate: runValidate, resetForm } = useForm(EMPTY, validate)

  useEffect(() => {
    if (open) {
      setValues(initial ? {
        code:               initial.code               ?? '',
        name:               initial.name               ?? '',
        description:        initial.description        ?? '',
        category:           initial.category           ?? '',
        uom:                initial.uom                ?? 'pcs',
        diameter_mm:        initial.diameter_mm        ?? '',
        length_mm:          initial.length_mm          ?? '',
        weight_kg:          initial.weight_kg          ?? '',
        material_grade:     initial.material_grade     ?? '',
        hardness_spec:      initial.hardness_spec      ?? '',
        surface_finish:     initial.surface_finish     ?? '',
        tolerance_spec:     initial.tolerance_spec     ?? '',
        cycle_time_minutes: initial.cycle_time_minutes ?? '',
        setup_time_minutes: initial.setup_time_minutes ?? '',
        expected_scrap_pct: initial.expected_scrap_pct ?? '0',
        standard_cost:      initial.standard_cost      ?? '0',
        selling_price:      initial.selling_price      ?? '0',
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
    // Convert numeric strings to numbers, nullify empty strings
    const numFields = ['diameter_mm','length_mm','weight_kg','cycle_time_minutes',
                       'setup_time_minutes','expected_scrap_pct','standard_cost','selling_price']
    numFields.forEach(f => {
      payload[f] = payload[f] === '' ? null : +payload[f]
    })
    const textFields = ['description','category','material_grade','hardness_spec',
                        'surface_finish','tolerance_spec','notes']
    textFields.forEach(f => { if (!payload[f]) payload[f] = null })
    onSubmit(payload)
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Product' : 'New Product'} size="lg">
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody className="space-y-5">

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Product Code" name="code" value={values.code}
              onChange={handleChange} error={errors.code} required />
            <Input label="Product Name" name="name" value={values.name}
              onChange={handleChange} error={errors.name} required />
            <Input label="Category" name="category" value={values.category}
              onChange={handleChange} />
            <Select label="Unit of Measure" name="uom" value={values.uom}
              onChange={handleChange} options={UOM_OPTIONS} error={errors.uom} required />
          </div>

          <Textarea label="Description" name="description" value={values.description}
            onChange={handleChange} rows={2} />

          {/* Physical Attributes */}
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 pt-1">Physical Attributes</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Diameter (mm)" name="diameter_mm" type="number" min="0"
              value={values.diameter_mm} onChange={handleChange} />
            <Input label="Length (mm)" name="length_mm" type="number" min="0"
              value={values.length_mm} onChange={handleChange} />
            <Input label="Weight (kg)" name="weight_kg" type="number" min="0"
              value={values.weight_kg} onChange={handleChange} />
          </div>

          {/* Manufacturing Standards */}
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 pt-1">Manufacturing Standards</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Material Grade" name="material_grade" value={values.material_grade}
              onChange={handleChange} />
            <Input label="Hardness Spec" name="hardness_spec" value={values.hardness_spec}
              onChange={handleChange} />
            <Input label="Surface Finish" name="surface_finish" value={values.surface_finish}
              onChange={handleChange} />
            <Input label="Tolerance Spec" name="tolerance_spec" value={values.tolerance_spec}
              onChange={handleChange} />
          </div>

          {/* Production Parameters */}
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 pt-1">Production Parameters</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Cycle Time (min)" name="cycle_time_minutes" type="number" min="0"
              value={values.cycle_time_minutes} onChange={handleChange} />
            <Input label="Setup Time (min)" name="setup_time_minutes" type="number" min="0"
              value={values.setup_time_minutes} onChange={handleChange} />
            <Input label="Expected Scrap (%)" name="expected_scrap_pct" type="number" min="0" max="100"
              value={values.expected_scrap_pct} onChange={handleChange} error={errors.expected_scrap_pct} />
          </div>

          {/* Costing */}
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 pt-1">Costing</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Standard Cost (₹)" name="standard_cost" type="number" min="0"
              value={values.standard_cost} onChange={handleChange} />
            <Input label="Selling Price (₹)" name="selling_price" type="number" min="0"
              value={values.selling_price} onChange={handleChange} />
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
          <Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Create Product'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
