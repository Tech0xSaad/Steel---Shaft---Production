import { useEffect } from 'react'
import { useForm }   from '@/hooks/useForm'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Input }    from '@/components/ui/Input'
import { Select }   from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button }   from '@/components/ui/Button'
import { Alert }    from '@/components/ui/Alert'

const UOM_OPTIONS = [
  { value: 'kg', label: 'kg' }, { value: 'g', label: 'g' },
  { value: 'ton', label: 'ton' }, { value: 'pcs', label: 'pcs' },
  { value: 'mm', label: 'mm' }, { value: 'm', label: 'm' },
  { value: 'litre', label: 'litre' }, { value: 'set', label: 'set' },
]

const EMPTY = { quantity: '', uom: 'kg', reference_number: '', reason: '', notes: '' }

function validate(v) {
  const e = {}
  if (!v.quantity || +v.quantity <= 0) e.quantity = 'Quantity must be greater than zero.'
  return e
}

/**
 * Modal for scrapping stock (irreversible write-off).
 */
export function ScrapStockModal({ open, onClose, material, onSubmit, loading }) {
  const { values, errors, handleChange, setValues, validate: run, resetForm } = useForm(EMPTY, validate)

  useEffect(() => {
    if (open)  setValues({ ...EMPTY, uom: material?.uom ?? 'kg' })
    if (!open) resetForm()
  }, [open, material])

  function handleSubmit(e) {
    e.preventDefault()
    if (!run()) return
    onSubmit({
      raw_material_id:  material.id,
      quantity:         +values.quantity,
      uom:              values.uom,
      reference_number: values.reference_number || undefined,
      reason:           values.reason           || undefined,
      notes:            values.notes            || undefined,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Scrap Stock" size="sm">
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody className="space-y-4">
          {material && (
            <div className="rounded-lg border border-surface-200 bg-surface-50 px-4 py-3">
              <p className="text-sm font-semibold text-surface-900">{material.code} — {material.name}</p>
              <p className="text-xs text-surface-600 mt-0.5">
                Physical stock: {Number(material.physical_stock_qty ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })} {material.uom}
              </p>
            </div>
          )}
          <Alert variant="error" title="Irreversible action">
            Scrapping permanently removes stock from inventory. This cannot be undone.
          </Alert>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantity to Scrap" name="quantity" type="number"
              min="0.001" step="any" required
              value={values.quantity} onChange={handleChange} error={errors.quantity} />
            <Select label="UOM" name="uom" value={values.uom} onChange={handleChange} options={UOM_OPTIONS} />
          </div>
          <Input label="Reason" name="reason" value={values.reason} onChange={handleChange}
            placeholder="e.g. Damaged, expired, contaminated" />
          <Input label="Reference No." name="reference_number" value={values.reference_number} onChange={handleChange} />
          <Textarea label="Notes" name="notes" rows={2} value={values.notes} onChange={handleChange} />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading} variant="danger">Confirm Scrap</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
