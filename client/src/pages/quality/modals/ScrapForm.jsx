import { useState, useEffect } from 'react'
import { Modal }    from '@/components/ui/Modal'
import { Button }   from '@/components/ui/Button'
import { Input }    from '@/components/ui/Input'
import { Select }   from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { SCRAP_CATEGORY_OPTIONS } from '@/constants/qualityTypes'

const EMPTY = {
  batch_id:       '',
  scrap_date:     new Date().toISOString().slice(0, 10),
  scrap_category: 'other',
  description:    '',
  qty_scrapped:   '',
  weight_kg:      '',
  uom:            'pcs',
  department:     '',
  operator_name:  '',
  unit_cost:      '',
  disposal_method:'',
  notes:          '',
}

export function ScrapForm({ open, onClose, onSubmit, saving, initial, batches = [] }) {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (open) {
      setForm(initial
        ? {
            ...EMPTY,
            ...initial,
            scrap_date: initial.scrap_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
            qty_scrapped:  initial.qty_scrapped  ?? '',
            weight_kg:     initial.weight_kg     ?? '',
            unit_cost:     initial.unit_cost     ?? '',
          }
        : EMPTY
      )
    }
  }, [open, initial])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.qty_scrapped || Number(form.qty_scrapped) <= 0) return
    onSubmit({
      ...form,
      qty_scrapped: Number(form.qty_scrapped),
      weight_kg:    form.weight_kg   ? Number(form.weight_kg)  : null,
      unit_cost:    form.unit_cost   ? Number(form.unit_cost)  : 0,
    })
  }

  const isEdit = !!initial

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Scrap Record' : 'Log Scrap'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Batch selector — only on create when no batch_id pre-filled */}
        {!isEdit && batches.length > 0 && !form.batch_id && (
          <Select
            label="Batch *"
            value={form.batch_id}
            onChange={e => set('batch_id', e.target.value)}
            options={batches.map(b => ({ value: b.id, label: b.batch_number }))}
            placeholder="Select a batch…"
            required
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Scrap Date"
            type="date"
            value={form.scrap_date}
            onChange={e => set('scrap_date', e.target.value)}
          />
          <Select
            label="Category"
            value={form.scrap_category}
            onChange={e => set('scrap_category', e.target.value)}
            options={SCRAP_CATEGORY_OPTIONS}
          />
        </div>

        <Textarea
          label="Description"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={2}
          placeholder="Brief description of the defect…"
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Qty Scrapped *"
            type="number"
            min="0.001"
            step="any"
            value={form.qty_scrapped}
            onChange={e => set('qty_scrapped', e.target.value)}
            required
          />
          <Input
            label="Weight (kg)"
            type="number"
            min="0"
            step="any"
            value={form.weight_kg}
            onChange={e => set('weight_kg', e.target.value)}
          />
          <Input
            label="UOM"
            value={form.uom}
            onChange={e => set('uom', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Operator"
            value={form.operator_name}
            onChange={e => set('operator_name', e.target.value)}
          />
          <Input
            label="Department"
            value={form.department}
            onChange={e => set('department', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Unit Cost (₹)"
            type="number"
            min="0"
            step="any"
            value={form.unit_cost}
            onChange={e => set('unit_cost', e.target.value)}
          />
          <Input
            label="Disposal Method"
            value={form.disposal_method}
            onChange={e => set('disposal_method', e.target.value)}
            placeholder="e.g. Sold as scrap"
          />
        </div>

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
          <Button type="submit" variant="primary" loading={saving}>
            {isEdit ? 'Save Changes' : 'Log Scrap'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
