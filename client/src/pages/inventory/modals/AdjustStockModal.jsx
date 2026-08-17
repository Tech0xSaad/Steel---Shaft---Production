import { useEffect } from 'react'
import { useForm }   from '@/hooks/useForm'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Input }    from '@/components/ui/Input'
import { Select }   from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button }   from '@/components/ui/Button'
import { Alert }    from '@/components/ui/Alert'

const ADJ_TYPE_OPTIONS = [
  { value: 'adjustment_in',  label: 'Adjustment In  (+)  — add stock' },
  { value: 'adjustment_out', label: 'Adjustment Out (−)  — remove stock' },
]

const UOM_OPTIONS = [
  { value: 'kg',    label: 'kg'    }, { value: 'g',     label: 'g'     },
  { value: 'ton',   label: 'ton'   }, { value: 'pcs',   label: 'pcs'   },
  { value: 'mm',    label: 'mm'    }, { value: 'm',     label: 'm'     },
  { value: 'litre', label: 'litre' }, { value: 'ml',    label: 'ml'    },
  { value: 'set',   label: 'set'   },
]

const EMPTY = {
  adjustment_type: 'adjustment_in',
  quantity: '', uom: 'kg',
  reference_number: '', reason: '', notes: '',
}

function validate(v) {
  const e = {}
  if (!v.quantity || +v.quantity <= 0) e.quantity = 'Quantity must be greater than zero.'
  if (!v.adjustment_type)              e.adjustment_type = 'Select adjustment type.'
  return e
}

/**
 * Modal for manual stock adjustments (count corrections, write-offs, etc.)
 *
 * @param {boolean}   open
 * @param {()=>void}  onClose
 * @param {object}    material   — stock position row
 * @param {Function}  onSubmit   — (payload) => void
 * @param {boolean}   loading
 * @param {object[]}  warehouses — dropdown options
 */
export function AdjustStockModal({ open, onClose, material, onSubmit, loading, warehouses = [] }) {
  const { values, errors, handleChange, setValues, validate: run, resetForm } = useForm(EMPTY, validate)

  useEffect(() => {
    if (open) setValues({ ...EMPTY, uom: material?.uom ?? 'kg' })
    if (!open) resetForm()
  }, [open, material])

  const warehouseOptions = [
    { value: '', label: 'No specific warehouse' },
    ...warehouses,
  ]

  const isOut = values.adjustment_type === 'adjustment_out'

  function handleSubmit(e) {
    e.preventDefault()
    if (!run()) return
    onSubmit({
      raw_material_id:  material.id,
      adjustment_type:  values.adjustment_type,
      quantity:         +values.quantity,
      uom:              values.uom,
      warehouse_id:     values.warehouse_id || undefined,
      reference_number: values.reference_number || undefined,
      reason:           values.reason || undefined,
      notes:            values.notes  || undefined,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Manual Stock Adjustment" size="md">
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody className="space-y-4">
          {/* Material info */}
          {material && (
            <div className="rounded-lg border border-surface-200 bg-surface-50 px-4 py-3">
              <p className="text-sm font-semibold text-surface-900">{material.code} — {material.name}</p>
              <div className="flex gap-4 mt-1 text-xs text-surface-600">
                <span>Physical: <b>{Number(material.physical_stock_qty ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })}</b></span>
                <span>Available: <b>{Number(material.available_qty ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })}</b></span>
                <span>Reserved: <b>{Number(material.reserved_qty ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })}</b></span>
              </div>
            </div>
          )}

          {isOut && (
            <Alert variant="warning" title="Stock reduction">
              Adjustment Out reduces physical stock and is recorded in the ledger. Ensure you have the correct count before proceeding.
            </Alert>
          )}

          <Select
            label="Adjustment Type" name="adjustment_type" required
            value={values.adjustment_type} onChange={handleChange}
            options={ADJ_TYPE_OPTIONS} error={errors.adjustment_type}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity" name="quantity" type="number"
              min="0.001" step="any" required
              value={values.quantity} onChange={handleChange}
              error={errors.quantity}
            />
            <Select
              label="UOM" name="uom"
              value={values.uom} onChange={handleChange}
              options={UOM_OPTIONS}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Reference No." name="reference_number"
              value={values.reference_number} onChange={handleChange}
              placeholder="e.g. ADJ-2025-001"
            />
            <Select
              label="Warehouse" name="warehouse_id"
              value={values.warehouse_id ?? ''} onChange={handleChange}
              options={warehouseOptions}
            />
          </div>

          <Input
            label="Reason" name="reason"
            value={values.reason} onChange={handleChange}
            placeholder="e.g. Physical count correction, damage write-off"
          />

          <Textarea label="Notes" name="notes" rows={2}
            value={values.notes} onChange={handleChange} />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            type="submit" loading={loading}
            variant={isOut ? 'danger' : 'primary'}
          >
            {isOut ? 'Remove Stock' : 'Add Stock'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
