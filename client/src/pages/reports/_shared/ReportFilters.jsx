/**
 * Reusable filter bar for all report pages.
 * Renders a row of labelled inputs; calls onChange whenever any field changes.
 *
 * Props
 *   fields  – array of { key, label, type: 'date'|'text'|'select', options?: [{value,label}] }
 *   values  – current filter state object  { [key]: value }
 *   onChange – (newValues) => void
 *   onClear  – () => void  (optional)
 */
export function ReportFilters({ fields, values, onChange, onClear }) {
  function handleChange(key, val) {
    onChange({ ...values, [key]: val })
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-surface-200 bg-surface-50 px-4 py-3">
      {fields.map(f => (
        <div key={f.key} className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-xs font-medium text-surface-500">{f.label}</label>
          {f.type === 'select' ? (
            <select
              value={values[f.key] ?? ''}
              onChange={e => handleChange(f.key, e.target.value)}
              className="rounded-lg border border-surface-300 bg-white px-2.5 py-1.5
                         text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="">All</option>
              {(f.options ?? []).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={f.type}
              value={values[f.key] ?? ''}
              onChange={e => handleChange(f.key, e.target.value)}
              placeholder={f.placeholder ?? ''}
              className="rounded-lg border border-surface-300 bg-white px-2.5 py-1.5
                         text-sm text-surface-800 placeholder-surface-400
                         focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          )}
        </div>
      ))}

      {onClear && (
        <button
          onClick={onClear}
          className="mt-auto rounded-lg border border-surface-300 bg-white px-3 py-1.5
                     text-sm text-surface-600 hover:bg-surface-100 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  )
}
