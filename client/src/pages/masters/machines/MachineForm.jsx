import { useEffect } from 'react'
import { useForm }   from '@/hooks/useForm'
import { Input }     from '@/components/ui/Input'
import { Select }    from '@/components/ui/Select'
import { Textarea }  from '@/components/ui/Textarea'
import { Button }    from '@/components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'

const EMPTY = {
  code: '', name: '', description: '', machine_type: '', make: '', model: '',
  year_of_manufacture: '',
  capacity_per_hour: '', capacity_uom: '',
  last_maintenance_at: '', next_maintenance_at: '', maintenance_cycle_days: '',
  location: '', department: '',
  hourly_rate: '0',
  status: 'active', notes: '',
}

const STATUS_OPTIONS = [
  { value: 'active',      label: 'Active' },
  { value: 'idle',        label: 'Idle' },
  { value: 'maintenance', label: 'Under Maintenance' },
  { value: 'retired',     label: 'Retired' },
]

function validate(v) {
  const e = {}
  if (!v.code?.trim()) e.code = 'Machine code is required.'
  if (!v.name?.trim()) e.name = 'Machine name is required.'
  return e
}

export function MachineForm({ open, onClose, onSubmit, initial, loading }) {
  const isEdit = !!initial?.id
  const { values, errors, handleChange, setValues, validate: runValidate, resetForm } = useForm(EMPTY, validate)

  useEffect(() => {
    if (open) {
      setValues(initial ? {
        code:                   initial.code                   ?? '',
        name:                   initial.name                   ?? '',
        description:            initial.description            ?? '',
        machine_type:           initial.machine_type           ?? '',
        make:                   initial.make                   ?? '',
        model:                  initial.model                  ?? '',
        year_of_manufacture:    initial.year_of_manufacture    ?? '',
        capacity_per_hour:      initial.capacity_per_hour      ?? '',
        capacity_uom:           initial.capacity_uom           ?? '',
        last_maintenance_at:    initial.last_maintenance_at    ? initial.last_maintenance_at.split('T')[0] : '',
        next_maintenance_at:    initial.next_maintenance_at    ? initial.next_maintenance_at.split('T')[0] : '',
        maintenance_cycle_days: initial.maintenance_cycle_days ?? '',
        location:               initial.location               ?? '',
        department:             initial.department             ?? '',
        hourly_rate:            initial.hourly_rate            ?? '0',
        status:                 initial.status                 ?? 'active',
        notes:                  initial.notes                  ?? '',
      } : EMPTY)
    }
    if (!open) resetForm()
  }, [open, initial])

  function handleSubmit(e) {
    e.preventDefault()
    if (!runValidate()) return
    const payload = { ...values }
    const numFields = ['year_of_manufacture','capacity_per_hour','maintenance_cycle_days','hourly_rate']
    numFields.forEach(f => { payload[f] = payload[f] === '' ? null : +payload[f] })
    const dateFields = ['last_maintenance_at','next_maintenance_at']
    dateFields.forEach(f => { if (!payload[f]) payload[f] = null })
    const textFields = ['description','machine_type','make','model','capacity_uom','location','department','notes']
    textFields.forEach(f => { if (!payload[f]) payload[f] = null })
    onSubmit(payload)
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Machine' : 'New Machine'} size="lg">
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody className="space-y-5">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Machine Code" name="code" value={values.code}
              onChange={handleChange} error={errors.code} required />
            <Input label="Machine Name" name="name" value={values.name}
              onChange={handleChange} error={errors.name} required />
            <Input label="Machine Type" name="machine_type" value={values.machine_type}
              onChange={handleChange} placeholder="e.g. CNC Lathe, Grinding" />
            <Input label="Make / Brand" name="make" value={values.make} onChange={handleChange} />
            <Input label="Model" name="model" value={values.model} onChange={handleChange} />
            <Input label="Year of Manufacture" name="year_of_manufacture" type="number" min="1900"
              value={values.year_of_manufacture} onChange={handleChange} />
          </div>

          <Textarea label="Description" name="description" value={values.description}
            onChange={handleChange} rows={2} />

          <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 pt-1">Capacity</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Capacity per Hour" name="capacity_per_hour" type="number" min="0"
              value={values.capacity_per_hour} onChange={handleChange} />
            <Input label="Capacity UOM" name="capacity_uom" value={values.capacity_uom}
              onChange={handleChange} placeholder="e.g. pcs, kg" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 pt-1">Maintenance</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Last Maintenance" name="last_maintenance_at" type="date"
              value={values.last_maintenance_at} onChange={handleChange} />
            <Input label="Next Maintenance" name="next_maintenance_at" type="date"
              value={values.next_maintenance_at} onChange={handleChange} />
            <Input label="Cycle (days)" name="maintenance_cycle_days" type="number" min="1"
              value={values.maintenance_cycle_days} onChange={handleChange} />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 pt-1">Location & Costing</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Department" name="department" value={values.department} onChange={handleChange} />
            <Input label="Location" name="location" value={values.location} onChange={handleChange} />
            <Input label="Hourly Rate (₹)" name="hourly_rate" type="number" min="0"
              value={values.hourly_rate} onChange={handleChange} />
            <Select label="Status" name="status" value={values.status}
              onChange={handleChange} options={STATUS_OPTIONS} />
          </div>

          <Textarea label="Notes" name="notes" value={values.notes} onChange={handleChange} rows={2} />

        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Create Machine'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
