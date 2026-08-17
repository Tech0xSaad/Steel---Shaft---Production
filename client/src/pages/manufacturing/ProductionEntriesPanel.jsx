import { useState, useEffect, useCallback } from 'react'
import toast                               from 'react-hot-toast'
import { Plus, RefreshCw }                 from 'lucide-react'

import { manufacturingService } from '@/services/manufacturingService'
import { Button }               from '@/components/ui/Button'
import { Spinner }              from '@/components/ui/Spinner'
import { Badge }                from '@/components/ui/Badge'
import { ProductionEntryForm }  from './modals/ProductionEntryForm'
import { OP_STATUS }            from '@/constants/operationStatus'

function fmt(n, d = 3) {
  if (n == null || n === 0) return '—'
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: d })
}
function fmtDT(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Inline collapsible panel showing production entries for one operation.
 * Renders inside the OperationsPage OperationCard.
 *
 * @param {object}    operation  — full operation row (with entries already loaded)
 * @param {object[]}  machines   — machine dropdown options
 * @param {Function}  onEntryAdded — callback after successful add (parent re-loads)
 */
export function ProductionEntriesPanel({ operation, machines = [], onEntryAdded }) {
  const entries    = operation?.entries ?? []
  const canAdd     = operation?.status === OP_STATUS.IN_PROGRESS
                  || operation?.status === OP_STATUS.ON_HOLD

  const [formOpen,  setFormOpen]  = useState(false)
  const [loading,   setLoading]   = useState(false)

  async function handleSubmit(payload) {
    setLoading(true)
    try {
      await manufacturingService.addEntry(operation.id, payload)
      toast.success('Production entry recorded.')
      setFormOpen(false)
      if (onEntryAdded) onEntryAdded()
    } catch (err) {
      toast.error(err.userMessage ?? 'Failed to record entry.')
    } finally {
      setLoading(false)
    }
  }

  if (entries.length === 0 && !canAdd) {
    return (
      <div className="mt-3 pt-3 border-t border-surface-100 text-xs text-surface-400 text-center py-3">
        No production entries recorded for this operation.
      </div>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-surface-100 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-surface-600 uppercase tracking-wide">
          Production Entries ({entries.length})
        </p>
        {canAdd && (
          <Button size="sm" variant="secondary"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setFormOpen(true)}>
            Add Entry
          </Button>
        )}
      </div>

      {entries.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-surface-200">
          <table className="w-full text-xs">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                {['Date/Time', 'Shift', 'Machine', 'Operator', 'Produced', 'Rejected', 'Rework', 'Time (min)', 'Notes'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-surface-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 bg-white">
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-surface-50">
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDT(e.entry_time)}</td>
                  <td className="px-3 py-2">{e.shift ?? '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{e.machine?.name ?? '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{e.operator_name ?? '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-green-700">
                    {fmt(e.qty_produced)}
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums font-medium ${Number(e.qty_rejected) > 0 ? 'text-red-600' : 'text-surface-400'}`}>
                    {fmt(e.qty_rejected)}
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums ${Number(e.qty_rework) > 0 ? 'text-amber-600' : 'text-surface-400'}`}>
                    {fmt(e.qty_rework)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {e.time_taken_minutes != null ? Number(e.time_taken_minutes).toFixed(1) : '—'}
                  </td>
                  <td className="px-3 py-2 max-w-[140px] truncate text-surface-500">
                    {e.rejection_reason || e.quality_notes || e.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Totals footer */}
            {entries.length > 1 && (
              <tfoot className="border-t-2 border-surface-200 bg-surface-50">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-xs font-semibold text-surface-600 text-right">
                    Totals
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-green-700">
                    {fmt(entries.reduce((s, e) => s + Number(e.qty_produced ?? 0), 0))}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-red-600">
                    {fmt(entries.reduce((s, e) => s + Number(e.qty_rejected ?? 0), 0))}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-amber-600">
                    {fmt(entries.reduce((s, e) => s + Number(e.qty_rework ?? 0), 0))}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold">
                    {entries.reduce((s, e) => s + Number(e.time_taken_minutes ?? 0), 0).toFixed(1)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      <ProductionEntryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        operation={operation}
        onSubmit={handleSubmit}
        loading={loading}
        machines={machines}
      />
    </div>
  )
}
