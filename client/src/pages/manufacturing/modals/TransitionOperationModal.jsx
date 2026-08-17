import { useEffect } from 'react'
import { useForm }   from '@/hooks/useForm'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Input }    from '@/components/ui/Input'
import { Select }   from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button }   from '@/components/ui/Button'
import { Alert }    from '@/components/ui/Alert'
import { OP_STATUS } from '@/constants/operationStatus'

const EMPTY = {
  operator_name: '', machine_id: '',
  actual_start_at: '', actual_end_at: '',
  qty_output: '', qty_rejected: '', qty_rework: '',
  rejection_reason: '', notes: '',
}

/**
 * Modal for transitioning an operation's status (start / complete / reject / etc.)
 *
 * @param {boolean}   open
 * @param {object}    transition — { to, label, variant }
 * @param {object}    operation  — current operation row
 * @param {()=>void}  onClose
 * @param {Function}  onConfirm  — (payload) => void
 * @param {boolean}   loading
 * @param {object[]}  machines
 */
export function TransitionOperationModal({ open, transition, operation, onClose, onConfirm, loading, machines = [] }) {
  const { values, handleChange, setValues, resetForm } = useForm(EMPTY)

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

  if (!transition) return null

  const toStatus       = transition.to
  const needsActuals   = toStatus === OP_STATUS.COMPLETED || toStatus === OP_STATUS.REJECTED
  const needsStart     = toStatus === OP_STATUS.IN_PROGRESS
  const needsRejection = toStatus === OP_STATUS.REJECTED
  const isDangerous    = transition.variant === 'danger'

  const machineOptions = [
    { value: '', label: 'Keep current machine' },
    ...machines,
  ]

  function handleConfirm() {
    const payload = { to_status: toStatus }
    if (values.notes)          payload.notes          = values.notes
    if (values.operator_name)  payload.operator_name  = values.operator_name
    if (values.machine_id)     payload.machine_id     = values.machine_id
    if (needsStart && values.actual_start_at)
      payload.actual_start_at = values.actual_start_at
    if (needsActuals) {
      if (values.actual_end_at) payload.actual_end_at = values.actual_end_at
      if (values.qty_output   !== '') payload.qty_output   = +values.qty_output
      if (values.qty_rejected !== '') payload.qty_rejected = +values.qty_rejected
      if (values.qty_rework   !== '') payload.qty_rework   = +values.qty_rework
    }
    if (needsRejection && values.rejection_reason)
      payload.rejection_reason = values.rejection_reason
    onConfirm(payload)
  }

  return (
    <Modal open={open} onClose={onClose} title={transition.label} size="md">
      <ModalBody className="space-y-4">

        {isDangerous && (
          <Alert variant="error" title="Confirm action">
            This will mark the operation as <strong>{toStatus}</strong>. Please verify before proceeding.
          </Alert>
        )}

        {/* Operation info */}
        {operation && (
          <div className="rounded-lg bg-surface-50 border border-surface-200 px-4 py-3 text-sm">
            <p className="font-semibold text-surface-900">
              {operation.operation_type?.name ?? operation.operation_code}
            </p>
            <p className="text-surface-500 text-xs mt-0.5">
              Batch: {operation.batch_number ?? operation.batch_id}
            </p>
          </div>
        )}

        {/* Machine / operator override */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Machine (optional override)" name="machine_id"
            value={values.machine_id} onChange={handleChange} options={machineOptions} />
          <Input label="Operator Name" name="operator_name"
            value={values.operator_name} onChange={handleChange} placeholder="e.g. Ravi Kumar" />
        </div>

        {/* Start time */}
        {needsStart && (
          <Input label="Actual Start Time" name="actual_start_at" type="datetime-local"
            value={values.actual_start_at} onChange={handleChange}
            hint="Leave blank to use current time" />
        )}

        {/* Completion actuals */}
        {needsActuals && (
          <>
            <Input label="Actual End Time" name="actual_end_at" type="datetime-local"
              value={values.actual_end_at} onChange={handleChange}
              hint="Leave blank to use current time" />
            <div className="grid grid-cols-3 gap-4">
              <Input label="Qty Produced" name="qty_output" type="number" min="0" step="any"
                value={values.qty_output} onChange={handleChange} placeholder="0"
                hint="Leave blank to sum from entries" />
              <Input label="Qty Rejected" name="qty_rejected" type="number" min="0" step="any"
                value={values.qty_rejected} onChange={handleChange} placeholder="0" />
              <Input label="Qty Rework" name="qty_rework" type="number" min="0" step="any"
                value={values.qty_rework} onChange={handleChange} placeholder="0" />
            </div>
          </>
        )}

        {/* Rejection reason */}
        {needsRejection && (
          <Input label="Rejection Reason" name="rejection_reason"
            value={values.rejection_reason} onChange={handleChange}
            placeholder="e.g. Dimension out of tolerance" />
        )}

        <Textarea label="Notes (optional)" name="notes" rows={2}
          value={values.notes} onChange={handleChange}
          placeholder="Any notes about this transition…" />

      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={transition.variant ?? 'primary'} onClick={handleConfirm} loading={loading}>
          {transition.label}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
