import { useEffect, useState } from 'react'
import { useForm }   from '@/hooks/useForm'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Select }   from '@/components/ui/Select'
import { Input }    from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button }   from '@/components/ui/Button'
import { manufacturingService } from '@/services/manufacturingService'

const EMPTY = {
  operation_type_id: '',
  sequence_no: '',
  machine_id: '',
  operator_name: '',
  planned_qty: '',
  planned_start_at: '',
  planned_end_at: '',
  notes: '',
}

function validate(v) {
  const e = {}
  if (!v.operation_type_id) e.operation_type_id = 'Operation type is required.'
  return e
}

/**
 * Modal for adding or editing a batch operation.
 *
 * @param {boolean}   open
 * @param {()=>void}  onClose
 * @param {()=>void}  onSubmit  — (payload) => Promise<void>
 * @param {object}    initial   — existing operation row (edit mode)
 * @param {boolean}   loading
 * @param {object[]}  machines  — [{ value, label }]
 */
export function OperationForm({ open, onClose, onSubmit, initial, loading, machines = [] }) {
  const isEdit = !!initial?.id
  const { values, errors, handleChange, setValues, validate: run, resetForm } = useForm(EMPTY, validate)
  const [opTypes, setOpTypes] = useState([])

  useEffect(() => {
    manufacturingService.listOpTypes(true)
      .then(d => setOpTypes((d ?? []).map(o => ({ value: o.id, label: `${o.code} — ${o.name}` }))))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (open) {
      setValues(initial ? {
        operation_type_id: initial.operation_type_id ?? '',
        sequence_no:       initial.sequence_no       ?? '',
        machine_id:        initial.machine_id        ?? '',
        operator_name:     initial.operator_name     ?? '',
        planned_qty:       initial.planned_qty       ?? '',
        planned_start_at:  initial.planned_start_at  ? initial.planned_start_at.slice(0, 16) : '',
        planned_end_at:    initial.planned_end_at    ? initial.planned_end_at.slice(0, 16)   : '',
        notes:             initial.notes             ?? '',
      } : EMPTY)
    }
    if (!open) resetForm()
  }, [open, initial])

  function handleSubmit(e) {
    e.preventDefault()
    if (!run()) return
    onSubmit({
      operation_type_id: values.operation_type_id,
      sequence_no:       values.sequence_no       !== '' ? +values.sequence_no  : undefined,
      machine_id:        values.machine_id        || null,
      operator_name:     values.operator_name     || null,
      planned_qty:       values.planned_qty       !== '' ? +values.planned_qty  : null,
      planned_start_at:  values.planned_start_at  || null,
      planned_end_at:    values.planned_end_at    || null,
      notes:             values.notes             || null,
    })
  }

  const machineOptions = [
    { value: '', label: 'No machine assigned' },
    ...machines,
  ]

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Operation' : 'Add Operation'} size="md">
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody className="space-y-4">

          <Select
            label="Operation Type" name="operation_type_id"
            value={values.operation_type_id} onChange={handleChange}
            options={opTypes} placeholder="Select operation…"
            error={errors.operation_type_id} required
            disabled={isEdit}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sequence No." name="sequence_no" type="number" min="0"
              value={values.sequence_no} onChange={handleChange}
              hint="Lower number runs first"
            />
            <Input
              label="Planned Qty" name="planned_qty" type="number" min="0" step="any"
              value={values.planned_qty} onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Machine" name="machine_id"
              value={values.machine_id} onChange={handleChange}
              options={machineOptions}
            />
            <Input
              label="Operator Name" name="operator_name"
              value={values.operator_name} onChange={handleChange}
              placeholder="e.g. Ravi Kumar"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Planned Start" name="planned_start_at" type="datetime-local"
              value={values.planned_start_at} onChange={handleChange}
            />
            <Input
              label="Planned End" name="planned_end_at" type="datetime-local"
              value={values.planned_end_at} onChange={handleChange}
            />
          </div>

          <Textarea label="Notes" name="notes" rows={2}
            value={values.notes} onChange={handleChange} />

        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Save Changes' : 'Add Operation'}</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
