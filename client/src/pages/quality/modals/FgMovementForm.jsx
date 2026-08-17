import { useState, useEffect } from 'react'
import { Modal }    from '@/components/ui/Modal'
import { Button }   from '@/components/ui/Button'
import { Input }    from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

const EMPTY = {
  product_id:       '',
  warehouse_id:     '',
  quantity:         '',
  uom:              'pcs',
  unit_cost:        '',
  reference_number: '',
  reason:           '',
  notes:            '',
}

/**
 * Shared form for Adjust-In, Adjust-Out, and Dispatch.
 * `mode` = 'adjust_in' | 'adjust_out' | 'dispatch'
 */
export function FgMovementForm({ open, onClose, onSubmit, saving, mode, products = [], warehouses = [] }) {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (open) setForm(EMPTY)
  }, [open])

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.product_id || !form.quantity || Number(form.quantity) <= 0) return
    const payload = {
      product_id:       form.product_id,
      warehouse_id:     form.warehouse_id || null,
      quantity:         Number(form.quantity),
      uom:              form.uom || 'pcs',
      reference_number: form.reference_number || null,
      notes:            form.notes || null,
    }
    if (mode === 'adjust_in')  payload.unit_cost = form.unit_cost ? Number(form.unit_cost) : 0
    if (mode === 'adjust_out') payload.reason    = form.reason || null
    onSubmit(payload)
  }

  const titles = {
    adjust_in:  'Finished Goods — Adjustment In',
    adjust_out: 'Finished Goods — Adjustment Out',
    dispatch:   'Dispatch Finished Goods',
  }

  const submitLabels = {
    adjust_in:  'Add Stock',
    adjust_out: 'Remove Stock',
    dispatch:   'Confirm Dispatch',
  }

  const submitVariants = {
    adjust_in:  'primary',
    adjust_out: 'warning',
    dispatch:   'primary',
  }

  return (
    <Modal open={open} onClose={onClose} title={titles[mode] ?? 'FG Movement'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Product */}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Product *</label>
          <select
            className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={form.product_id}
            onChange={e => set('product_id', e.target.value)}
            required
          >
            <option value="">Select a product…</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
            ))}
          </select>
        </div>

        {/* Warehouse */}
        {warehouses.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Warehouse</label>
            <select
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={form.warehouse_id}
              onChange={e => set('warehouse_id', e.target.value)}
            >
              <option value="">No specific warehouse</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.code} — {w.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Quantity *"
            type="number"
            min="0.001"
            step="any"
            value={form.quantity}
            onChange={e => set('quantity', e.target.value)}
            required
          />
          <Input
            label="UOM"
            value={form.uom}
            onChange={e => set('uom', e.target.value)}
          />
        </div>

        {mode === 'adjust_in' && (
          <Input
            label="Unit Cost (₹)"
            type="number"
            min="0"
            step="any"
            value={form.unit_cost}
            onChange={e => set('unit_cost', e.target.value)}
          />
        )}

        <Input
          label="Reference Number"
          value={form.reference_number}
          onChange={e => set('reference_number', e.target.value)}
          placeholder={mode === 'dispatch' ? 'e.g. DO-2024-0045' : 'e.g. ADJ-2024-001'}
        />

        {mode === 'adjust_out' && (
          <Input
            label="Reason"
            value={form.reason}
            onChange={e => set('reason', e.target.value)}
            placeholder="e.g. Damaged goods write-off"
          />
        )}

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={2}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant={submitVariants[mode] ?? 'primary'} loading={saving}>
            {submitLabels[mode] ?? 'Submit'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
