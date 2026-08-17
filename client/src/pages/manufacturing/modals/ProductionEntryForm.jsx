import { useEffect } from 'react'
import { useForm }   from '@/hooks/useForm'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Input }    from '@/components/ui/Input'
import { Select }   from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button }   from '@/components/ui/Button'
import { SHIFT_OPTIONS } from '@/constants/operationStatus'

const EMPTY = {
  shift: '', machine_id: '', operator_name: '',
  qty_produced: '', qty_rejected: '0', qty_rework: '0',
  start_time: '', end_time: '',
  rejection_reason: '', quality_notes: '', notes: '',
}

function validate(v) {
  const e = {}
  if (v.qty_produced === '' || +v.qty_produced < 0)
    e.qty_produced = 'Produced quantity must be 0 or more.'
  return e
}

/**
 * Modal for recording a production entry against an operation.
 *
 * @param {boolean}   open
 * @param {()=>void}  onClose
 * @param {object}    operation  — the parent batch_operation row (for context display)
 * @param {Function}  onSubmit   — (payload) => Promise<void>
 * @param {boolean}   loading
 * @param {object[]}  machines   — [{ value, label }]
 */
export function ProductionEntryForm({ open, onClose, operation, onSubmit, loading, machines = [] }) {
  const { values, errors, handleChange, setValues, validate: run, resetForm } = useForm(EMPTY, validate)

  useEffect(() => {
    if (open) {
      setValues({
        ...EMPTY,
        machine_id:    operation?.machine_id    ?? '',
        operator_name: operation?.operator_name ?? '',
      })
    }
    if (!open) resetForm()
  }, [open, operation])

  function handleSubmit(e) {
    e.preventDefault()
    if (!run()) return
    onSubmit({
      shift:            values.shift           || null,
      machine_id:       values.machine_id      || null,
      operator_name:    values.operator_name   || null,
      qty_produced:     +values.qty_produced,
      qty_rejected:     +values.qty_rejected,
      qty_rework:       +values.qty_rework,
      start_time:       values.start_time      || null,
      end_time:         values.end_time        || null,
      rejection_reason: values.rejection_reason || null,
      quality_notes:    values.quality_notes   || null,
      notes:            values.notes           || null,
    })
  }

  const machineOptions = [
    { value: '', label: 'No machine assigned' },
    ...machines,
  ]

  return (
    <Modal open={open} onClose={onClose} title="Record Production Entry" size="md">
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody className="space-y-4">

          {/* Operation context */}
          {operation && (
            <div className="rounded-lg bg-surface-50 border border-surface-200 px-4 py-3">
              <p className="text-sm font-semibold text-surface-900">
                {operation.operation_type?.name ?? operation.operation_code}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-surface-500">
                <span>Planned qty: <b>{operation.planned_qty ?? '—'}</b></span>
                <span>Produced so far: <b>{Number(operation.qty_output ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })}</b></span>
                <span>Rejected so far: <b>{Number(operation.qty_rejected ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })}</b></span>
              </div>
            </div>
          )}

          {/* Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Shift" name="shift" value={values.shift}
              onChange={handleChange} options={SHIFT_OPTIONS} />
            <Select label="Machine" name="machine_id" value={values.machine_id}
              onChange={handleChange} options={machineOptions} />
            <Input label="Operator" name="operator_name" value={values.operator_name}
              onChange={handleChange} placeholder="e.g. Ravi Kumar" />
          </div>

          {/* Quantities */}
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-400">Quantities for this entry</p>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Qty Produced" name="qty_produced" type="number" min="0" step="any"
              required value={values.qty_produced} onChange={handleChange}
              error={errors.qty_produced} />
            <Input label="Qty Rejected" name="qty_rejected" type="number" min="0" step="any"
              value={values.qty_rejected} onChange={handleChange} />
            <Input label="Qty Rework" name="qty_rework" type="number" min="0" step="any"
              value={values.qty_rework} onChange={handleChange} />
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Time" name="start_time" type="datetime-local"
              value={values.start_time} onChange={handleChange} />
            <Input label="End Time" name="end_time" type="datetime-local"
              value={values.end_time} onChange={handleChange}
              hint="Time taken calculated automatically" />
          </div>

          {+values.qty_rejected > 0 && (
            <Input label="Rejection Reason" name="rejection_reason"
              value={values.rejection_reason} onChange={handleChange}
              placeholder="e.g. Diameter oversize, surface defect" />
          )}

          <Textarea label="Quality Notes" name="quality_notes" rows={2}
            value={values.quality_notes} onChange={handleChange} />
          <Textarea label="Notes" name="notes" rows={2}
            value={values.notes} onChange={handleChange} />

        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading}>Record Entry</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
