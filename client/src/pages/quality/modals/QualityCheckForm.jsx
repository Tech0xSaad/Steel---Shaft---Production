import { useState, useEffect } from 'react'
import { Modal }    from '@/components/ui/Modal'
import { Button }   from '@/components/ui/Button'
import { Input }    from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

export function QualityCheckForm({ open, onClose, onSubmit, saving, batchId }) {
  const [form, setForm] = useState({
    inspector_name:  '',
    inspection_date: new Date().toISOString().slice(0, 10),
    qty_inspected:   '',
    uom:             'pcs',
    notes:           '',
  })

  useEffect(() => {
    if (open) {
      setForm({
        inspector_name:  '',
        inspection_date: new Date().toISOString().slice(0, 10),
        qty_inspected:   '',
        uom:             'pcs',
        notes:           '',
      })
    }
  }, [open])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.qty_inspected || Number(form.qty_inspected) <= 0) return
    onSubmit({
      ...form,
      qty_inspected: Number(form.qty_inspected),
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Quality Check" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Inspector Name"
            value={form.inspector_name}
            onChange={e => set('inspector_name', e.target.value)}
            placeholder="e.g. Rajan Kumar"
          />
          <Input
            label="Inspection Date"
            type="date"
            value={form.inspection_date}
            onChange={e => set('inspection_date', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Qty to Inspect *"
            type="number"
            min="0"
            step="any"
            value={form.qty_inspected}
            onChange={e => set('qty_inspected', e.target.value)}
            required
          />
          <Input
            label="UOM"
            value={form.uom}
            onChange={e => set('uom', e.target.value)}
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
            Create Check
          </Button>
        </div>
      </form>
    </Modal>
  )
}
