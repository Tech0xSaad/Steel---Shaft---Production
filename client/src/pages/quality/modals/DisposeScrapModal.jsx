import { useState, useEffect } from 'react'
import { Modal }    from '@/components/ui/Modal'
import { Button }   from '@/components/ui/Button'
import { Input }    from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

export function DisposeScrapModal({ open, onClose, onSubmit, saving, record }) {
  const [form, setForm] = useState({ disposal_method: '', disposal_notes: '' })

  useEffect(() => {
    if (open) {
      setForm({
        disposal_method: record?.disposal_method || '',
        disposal_notes:  record?.disposal_notes  || '',
      })
    }
  }, [open, record])

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.disposal_method.trim()) return
    onSubmit({
      disposal_method: form.disposal_method,
      disposal_notes:  form.disposal_notes || null,
      disposed_at:     new Date().toISOString(),
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Mark Scrap as Disposed" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Disposal Method *"
          value={form.disposal_method}
          onChange={e => setForm(f => ({ ...f, disposal_method: e.target.value }))}
          placeholder="e.g. Sold as scrap, Recycled, Discarded"
          required
        />
        <Textarea
          label="Notes"
          value={form.disposal_notes}
          onChange={e => setForm(f => ({ ...f, disposal_notes: e.target.value }))}
          rows={2}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            Mark Disposed
          </Button>
        </div>
      </form>
    </Modal>
  )
}
