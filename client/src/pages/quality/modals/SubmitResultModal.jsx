import { useState, useEffect } from 'react'
import { Modal }    from '@/components/ui/Modal'
import { Button }   from '@/components/ui/Button'
import { Input }    from '@/components/ui/Input'
import { Select }   from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { SCRAP_CATEGORY_OPTIONS } from '@/constants/qualityTypes'

export function SubmitResultModal({ open, onClose, onSubmit, saving, check }) {
  const [form, setForm] = useState({
    qty_passed:        '',
    qty_rejected:      '',
    qty_on_hold:       '',
    rejection_reasons: '',
    rejection_notes:   '',
    scrap_category:    'other',
    report_reference:  '',
    notes:             '',
  })

  useEffect(() => {
    if (open && check) {
      setForm({
        qty_passed:        '',
        qty_rejected:      '',
        qty_on_hold:       '',
        rejection_reasons: '',
        rejection_notes:   '',
        scrap_category:    'other',
        report_reference:  check.report_reference || '',
        notes:             check.notes || '',
      })
    }
  }, [open, check])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const qtyInspected = check ? Number(check.qty_inspected ?? 0) : 0
  const qtyPassed    = Number(form.qty_passed    || 0)
  const qtyRejected  = Number(form.qty_rejected  || 0)
  const qtyOnHold    = Number(form.qty_on_hold   || 0)
  const qtyTotal     = qtyPassed + qtyRejected + qtyOnHold
  const overLimit    = qtyTotal > qtyInspected
  const canSubmit    = qtyTotal > 0 && !overLimit

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      qty_passed:        qtyPassed,
      qty_rejected:      qtyRejected,
      qty_on_hold:       qtyOnHold,
      rejection_reasons: form.rejection_reasons
        ? form.rejection_reasons.split('\n').map(s => s.trim()).filter(Boolean)
        : null,
      rejection_notes:   form.rejection_notes || null,
      scrap_category:    form.scrap_category,
      scrap_description: form.rejection_notes || null,
      report_reference:  form.report_reference || null,
      notes:             form.notes || null,
    })
  }

  const passRate = qtyInspected > 0 && qtyPassed > 0
    ? ((qtyPassed / qtyInspected) * 100).toFixed(1)
    : null

  return (
    <Modal open={open} onClose={onClose} title="Submit Inspection Result" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Inspected qty context */}
        <div className="rounded-lg bg-surface-50 border border-surface-200 px-4 py-3 text-sm text-surface-600">
          Qty inspected: <span className="font-semibold text-surface-900">{qtyInspected}</span>
          {passRate && (
            <span className="ml-4 text-green-700">
              Pass rate: <b>{passRate}%</b>
            </span>
          )}
        </div>

        {/* Quantities */}
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Qty Passed"
            type="number"
            min="0"
            step="any"
            value={form.qty_passed}
            onChange={e => set('qty_passed', e.target.value)}
          />
          <Input
            label="Qty Rejected"
            type="number"
            min="0"
            step="any"
            value={form.qty_rejected}
            onChange={e => set('qty_rejected', e.target.value)}
          />
          <Input
            label="Qty On Hold"
            type="number"
            min="0"
            step="any"
            value={form.qty_on_hold}
            onChange={e => set('qty_on_hold', e.target.value)}
          />
        </div>

        {overLimit && (
          <p className="text-sm text-red-600">
            Total ({qtyTotal}) exceeds inspected quantity ({qtyInspected}).
          </p>
        )}

        {/* Rejection details (only if rejected > 0) */}
        {qtyRejected > 0 && (
          <>
            <Select
              label="Scrap Category (for rejected qty)"
              value={form.scrap_category}
              onChange={e => set('scrap_category', e.target.value)}
              options={SCRAP_CATEGORY_OPTIONS}
            />
            <Textarea
              label="Rejection Reasons (one per line)"
              value={form.rejection_reasons}
              onChange={e => set('rejection_reasons', e.target.value)}
              rows={2}
              placeholder="Diameter out of tolerance&#10;Surface scratch"
            />
            <Textarea
              label="Rejection Notes"
              value={form.rejection_notes}
              onChange={e => set('rejection_notes', e.target.value)}
              rows={2}
            />
          </>
        )}

        <Input
          label="Report Reference"
          value={form.report_reference}
          onChange={e => set('report_reference', e.target.value)}
          placeholder="e.g. QC-2024-0012"
        />

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
          <Button type="submit" variant="primary" loading={saving} disabled={!canSubmit}>
            Submit Result
          </Button>
        </div>
      </form>
    </Modal>
  )
}
