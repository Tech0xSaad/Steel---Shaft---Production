import { useEffect } from 'react'
import { useForm }   from '@/hooks/useForm'
import { Input }     from '@/components/ui/Input'
import { Select }    from '@/components/ui/Select'
import { Textarea }  from '@/components/ui/Textarea'
import { Button }    from '@/components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'

const EMPTY = {
  code: '', name: '', description: '',
  warehouse_type: 'general',
  address: '', city: '', state: '',
  total_capacity: '', capacity_uom: '',
  manager_name: '', contact_phone: '',
  is_active: true, notes: '',
}

const TYPE_OPTIONS = [
  { value: 'raw_material',    label: 'Raw Material' },
  { value: 'finished_goods',  label: 'Finished Goods' },
  { value: 'wip',             label: 'Work-in-Progress (WIP)' },
  { value: 'general',         label: 'General' },
]

function validate(v) {
  const e = {}
  if (!v.code?.trim()) e.code = 'Warehouse code is required.'
  if (!v.name?.trim()) e.name = 'Warehouse name is required.'
  return e
}

export function WarehouseForm({ open, onClose, onSubmit, initial, loading }) {
  const isEdit = !!initial?.id
  const { values, errors, handleChange, setValues, validate: runValidate, resetForm } = useForm(EMPTY, validate)

  useEffect(() => {
    if (open) {
      setValues(initial ? {
        code:           initial.code           ?? '',
        name:           initial.name           ?? '',
        description:    initial.description    ?? '',
        warehouse_type: initial.warehouse_type ?? 'general',
        address:        initial.address        ?? '',
        city:           initial.city           ?? '',
        state:          initial.state          ?? '',
        total_capacity: initial.total_capacity ?? '',
        capacity_uom:   initial.capacity_uom   ?? '',
        manager_name:   initial.manager_name   ?? '',
        contact_phone:  initial.contact_phone  ?? '',
        is_active:      initial.is_active      ?? true,
        notes:          initial.notes          ?? '',
      } : EMPTY)
    }
    if (!open) resetForm()
  }, [open, initial])

  function handleSubmit(e) {
    e.preventDefault()
    if (!runValidate()) return
    const payload = { ...values }
    payload.total_capacity = payload.total_capacity === '' ? null : +payload.total_capacity
    const textFields = ['description','address','city','state','capacity_uom','manager_name','contact_phone','notes']
    textFields.forEach(f => { if (!payload[f]) payload[f] = null })
    payload.is_active = Boolean(payload.is_active)
    onSubmit(payload)
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Warehouse' : 'New Warehouse'} size="lg">
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody className="space-y-5">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Warehouse Code" name="code" value={values.code}
              onChange={handleChange} error={errors.code} required />
            <Input label="Warehouse Name" name="name" value={values.name}
              onChange={handleChange} error={errors.name} required />
            <Select label="Type" name="warehouse_type" value={values.warehouse_type}
              onChange={handleChange} options={TYPE_OPTIONS} required />
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={values.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-surface-700">Active</span>
              </label>
            </div>
          </div>

          <Textarea label="Description" name="description" value={values.description}
            onChange={handleChange} rows={2} />

          <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 pt-1">Location</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="City" name="city" value={values.city} onChange={handleChange} />
            <Input label="State" name="state" value={values.state} onChange={handleChange} />
            <Textarea label="Address" name="address" value={values.address}
              onChange={handleChange} rows={2} className="sm:col-span-2" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 pt-1">Capacity & Contact</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Total Capacity" name="total_capacity" type="number" min="0"
              value={values.total_capacity} onChange={handleChange} />
            <Input label="Capacity UOM" name="capacity_uom" value={values.capacity_uom}
              onChange={handleChange} placeholder="e.g. ton, pcs" />
            <Input label="Manager Name" name="manager_name" value={values.manager_name}
              onChange={handleChange} />
            <Input label="Contact Phone" name="contact_phone" value={values.contact_phone}
              onChange={handleChange} type="tel" />
          </div>

          <Textarea label="Notes" name="notes" value={values.notes} onChange={handleChange} rows={2} />

        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Create Warehouse'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
