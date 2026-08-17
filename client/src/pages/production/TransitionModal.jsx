import { useState, useEffect } from 'react'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Button }   from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Input }    from '@/components/ui/Input'
import { Alert }    from '@/components/ui/Alert'
import { BATCH_STATUS } from '@/constants/batchStatus'

/**
 * Generic confirmation modal for any lifecycle transition.
 * Shows extra actuals fields when completing a batch.
 *
 * @param {boolean}   open
 * @param {{ to, label, variant }} transition
 * @param {Function}  onClose
 * @param {Function}  onConfirm  — ({ notes, actual_qty_produced?, actual_qty_scrapped? }) => void
 * @param {boolean}   loading
 * @param {string}    batchStatus — current status (to show relevant warnings)
 */
export function TransitionModal({ open, transition, onClose, onConfirm, loading, batchStatus }) {
  const [notes,         setNotes]         = useState('')
  const [actualProd,    setActualProd]    = useState('')
  const [actualScrap,   setActualScrap]   = useState('')

  useEffect(() => {
    if (open) { setNotes(''); setActualProd(''); setActualScrap('') }
  }, [open])

  if (!transition) return null

  const isCompleting  = transition.to === BATCH_STATUS.COMPLETED
  const isClosing     = transition.to === BATCH_STATUS.CLOSED
  const isReserving   = transition.to === BATCH_STATUS.RESERVED
  const isReleasing   = transition.to === BATCH_STATUS.CREATED && batchStatus === BATCH_STATUS.RESERVED
  const isDangerous   = transition.variant === 'danger'
  const needsActuals  = isCompleting || isClosing

  function handleConfirm() {
    onConfirm({
      notes:                notes  || undefined,
      actual_qty_produced:  needsActuals && actualProd  ? actualProd  : undefined,
      actual_qty_scrapped:  needsActuals && actualScrap ? actualScrap : undefined,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={transition.label} size="sm">
      <ModalBody className="space-y-4">

        {isReserving && (
          <Alert variant="info" title="Stock will be locked">
            The required raw materials will be deducted from available inventory and reserved exclusively for this batch.
          </Alert>
        )}

        {isReleasing && (
          <Alert variant="warning" title="Stock will be returned">
            All reserved quantities will be returned to available inventory and the reservations cancelled.
          </Alert>
        )}

        {isDangerous && !isReleasing && (
          <Alert variant="error" title="This action may be irreversible">
            Closing or cancelling a batch cannot be undone. Reserved stock will be returned to inventory.
          </Alert>
        )}

        {needsActuals && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Actual Qty Produced"
              type="number" min="0" step="any"
              value={actualProd}
              onChange={e => setActualProd(e.target.value)}
              placeholder="0"
            />
            <Input
              label="Actual Qty Scrapped"
              type="number" min="0" step="any"
              value={actualScrap}
              onChange={e => setActualScrap(e.target.value)}
              placeholder="0"
            />
          </div>
        )}

        <Textarea
          label="Notes (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Add a note about this transition…"
        />

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
