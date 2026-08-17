import { useEffect } from 'react'
import { useForm }   from '@/hooks/useForm'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Input }    from '@/components/ui/Input'
import { Select }   from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button }   from '@/components/ui/Button'
import { Alert }    from '@/components/ui/Alert'

const UOM_OPTIONS = [
  { value: 'kg',    label: 'kg'    },
  { value: 'g',     label: 'g'     },
  { value: 'ton',   label: 'ton'   },
  { value: 'pcs',   label: 'pcs'   },
  { value: 'mm',    label: 'mm'    },
  { value: 'm',     label: 'm'     },
  { value: 'litre', label: 'litre' },
  { value: 'ml',    label: 'ml'    },
  { value: 'set',   label: 'set'   },
]

const EMPTY = {
  quantity: '', uom: 'kg', unit_cost: '',
  reference_number: '', reference_date: '', notes: '',
}

function validate(v) {
  const e = {}
  if (!v.quantity || +v.quantity <= 0) e.quantity = 'Quantity must be greater than zero.'
  return e
}

/**
 * Modal for receiving new stock (Goods Receipt Note).
 *
 * @param {boolean}    open
 * @param {()=>void}   onClose
 * @param {object}     material  — { id, code, name, uom, unit_cost, current_stock_qty }
 * @param {()=>void}   onSubmit  — (payload) => Promise<void>
 * @param {boolean}    loading
 * @param {object[]}   warehouses — dropdown options [{ value, label }]
 */
export function ReceiveStockModal({ open, onClose, material, onSubmit, loading, warehouses = [] }) {
  const { values, errors, handleChange, setValues, validate: run, resetForm } = useForm(EMPTY, validate)

  useEffect(() => {
    if (open) {
      setValues({ ...EMPTY, uom: material?.uom ?? 'kg', unit_cost: material?.unit_cost ?? '' })
    }
    if (!open) resetForm()
  }, [open, material])

  const warehouseOptions = [
    { value: '', label: 'No specific warehouse' },
    ...warehouses,
  ]

  function handleSubmit(e) {
    e.preventDefault()
    if (!run()) return
    onSubmit({
      raw_material_id:  material.id,
      quantity:         +values.quantity,
      uom:              values.uom,
      unit_cost:        values.unit_cost !== '' ? +values.unit_cost : undefined,
      warehouse_id:     values.warehouse_id || undefined,
      reference_number: values.reference_number || undefined,
      reference_date:   values.reference_date   || undefined,
      notes:            values.notes            || undefined,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Receive Stock (GRN)" size="md">
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody className="space-y-4">
          {/* Material info banner */}
          {material && (
            <div className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3">
              <p className="text-sm font-semibold text-primary-900">{material.code} — {material.name}</p>
              <p className="text-xs text-primary-700 mt-0.5">
                Current stock: {Number(material.physical_stock_qty ?? material.current_stock_qty ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })} {material.uom}
              </p>
            </div>
          )}

          <Alert variant="info">
            Receiving stock increases the physical quantity and updates the weighted-average unit cost if a new cost is entered.
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity Received" name="quantity" type="number"
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
              label="Unit Cost (₹)" name="unit_cost" type="number"
              min="0" step="any"
              value={values.unit_cost} onChange={handleChange}
              hint="Leave blank to keep existing cost"
            />
            <Select
              label="Warehouse" name="warehouse_id"
              value={values.warehouse_id ?? ''} onChange={handleChange}
              options={warehouseOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="GRN / Reference No." name="reference_number"
              value={values.reference_number} onChange={handleChange}
              placeholder="e.g. GRN-2025-001"
            />
            <Input
              label="Reference Date" name="reference_date" type="date"
              value={values.reference_date} onChange={handleChange}
            />
          </div>

          <Textarea label="Notes" name="notes" rows={2}
            value={values.notes} onChange={handleChange} />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading}>Receive Stock</Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
