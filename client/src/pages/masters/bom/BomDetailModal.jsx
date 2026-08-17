import { Modal, ModalBody } from '@/components/ui/Modal'
import { Badge }            from '@/components/ui/Badge'

/**
 * Read-only BOM detail view — shows header + all line items in a table.
 */
export function BomDetailModal({ open, onClose, bom }) {
  if (!bom) return null

  const totalCost = (bom.items ?? []).reduce((sum, item) => {
    const cost    = item.raw_material?.unit_cost ?? 0
    const qty     = item.quantity_required ?? 0
    const scrap   = (item.scrap_allowance_pct ?? 0) / 100
    return sum + cost * qty * (1 + scrap)
  }, 0)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`BOM — ${bom.product?.code ?? ''} v${bom.version}`}
      size="lg"
    >
      <ModalBody className="space-y-5">

        {/* Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Field label="Product"  value={`${bom.product?.code} — ${bom.product?.name}`} />
          <Field label="Version"  value={bom.version} />
          <Field label="Status"   value={<Badge variant={bom.is_active ? 'success' : 'default'}>{bom.is_active ? 'Active' : 'Inactive'}</Badge>} />
          <Field label="Lines"    value={bom.items?.length ?? 0} />
        </div>

        {bom.notes && (
          <p className="text-sm text-surface-600 bg-surface-50 rounded-lg px-4 py-2">{bom.notes}</p>
        )}

        {/* Line items */}
        <div className="overflow-x-auto rounded-xl border border-surface-200">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-surface-500">#</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-surface-500">Material</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-surface-500">Qty</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-surface-500">UOM</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-surface-500">Scrap %</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-surface-500">Unit Cost</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-surface-500">Line Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {(bom.items ?? []).map((item, i) => {
                const cost      = item.raw_material?.unit_cost ?? 0
                const qty       = item.quantity_required ?? 0
                const scrap     = (item.scrap_allowance_pct ?? 0) / 100
                const lineCost  = cost * qty * (1 + scrap)
                return (
                  <tr key={item.id} className="hover:bg-surface-50">
                    <td className="px-4 py-2.5 text-surface-400">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-surface-900">
                      {item.raw_material?.code} — {item.raw_material?.name}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{qty}</td>
                    <td className="px-4 py-2.5">{item.uom}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{item.scrap_allowance_pct ?? 0}%</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      ₹{Number(cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                      ₹{lineCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {totalCost > 0 && (
              <tfoot className="border-t-2 border-surface-200 bg-surface-50">
                <tr>
                  <td colSpan={6} className="px-4 py-2.5 text-sm font-semibold text-right text-surface-700">
                    Est. Total Material Cost
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-surface-900 tabular-nums">
                    ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

      </ModalBody>
    </Modal>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-surface-400 mb-0.5">{label}</p>
      <div className="text-sm font-medium text-surface-900">{value}</div>
    </div>
  )
}
