import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

/**
 * Generic confirm/delete dialog.
 *
 * @param {boolean}   open
 * @param {()=>void}  onClose
 * @param {()=>void}  onConfirm
 * @param {boolean}   loading
 * @param {string}    title
 * @param {string}    message
 * @param {string}    confirmLabel
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
}) {
  return (
    <Modal open={open} onClose={onClose} title={null} size="sm">
      <ModalBody className="flex flex-col items-center text-center gap-3 pt-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-surface-900">{title}</h3>
          <p className="mt-1 text-sm text-surface-500">{message}</p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
