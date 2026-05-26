import type { AdminOverrides, CuttingLayoutResult } from '../../lib/analysis/types'
import Label from '../ui/Label'
import Input from '../ui/Input'

interface Props {
  overrides: AdminOverrides
  result: CuttingLayoutResult | null
  onChange: (overrides: AdminOverrides) => void
}

const COLOUR_OPTIONS = [
  { value: 1, label: '1 Colour' },
  { value: 2, label: '2 Colours' },
  { value: 3, label: '3 Colours' },
  { value: 4, label: '4 Colours' },
  { value: 5, label: 'Full Colour / CMYK' },
]

function OverrideField({
  label,
  placeholder,
  value,
  onChange,
  onClear,
  type = 'number',
  min,
  max,
  step,
}: {
  label: string
  placeholder: string
  value: number | null
  onChange: (v: number | null) => void
  onClear: () => void
  type?: string
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div>
      <Label>
        {label}
        {value !== null && (
          <button
            type="button"
            onClick={onClear}
            className="ml-2 text-xs text-gray-400 hover:text-red-700 font-normal underline"
          >
            clear
          </button>
        )}
      </Label>
      <div className="relative">
        <input
          type={type}
          min={min}
          max={max}
          step={step ?? 1}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={e => {
            const v = e.target.value
            onChange(v === '' ? null : Number(v))
          }}
          className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
            value !== null
              ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 bg-white focus:border-red-500 focus:ring-red-500'
          }`}
        />
        {value !== null && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-600 font-medium pointer-events-none">
            ✎
          </span>
        )}
      </div>
    </div>
  )
}

export default function AdminOverridePanel({ overrides, result, onChange }: Props) {
  const set = <K extends keyof AdminOverrides>(key: K, v: AdminOverrides[K]) =>
    onChange({ ...overrides, [key]: v })

  const resetAll = () =>
    onChange({ colourCount: null, flatWidthMm: null, flatHeightMm: null, piecesPerSheet: null, wastagePercentage: null })

  const hasAny = Object.values(overrides).some(v => v !== null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Override estimated values. Overridden fields are highlighted in red.
          Leave blank to use the calculated estimate.
        </p>
        {hasAny && (
          <button
            type="button"
            onClick={resetAll}
            className="text-xs text-gray-500 hover:text-red-700 underline shrink-0 ml-3"
          >
            Reset all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Colour count override */}
        <div>
          <Label>
            Colour count
            {overrides.colourCount !== null && (
              <button
                type="button"
                onClick={() => set('colourCount', null)}
                className="ml-2 text-xs text-gray-400 hover:text-red-700 font-normal underline"
              >
                clear
              </button>
            )}
          </Label>
          <select
            value={overrides.colourCount ?? ''}
            onChange={e => set('colourCount', e.target.value === '' ? null : Number(e.target.value))}
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
              overrides.colourCount !== null
                ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 bg-white focus:border-red-500 focus:ring-red-500'
            }`}
          >
            <option value="">Use estimated{result ? ` (${result.piecesPerSheet > 0 ? 'calculated' : '—'})` : ''}</option>
            {COLOUR_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <OverrideField
          label="Flat width (mm)"
          placeholder={result ? `Est. ${result.flatWidthMm}` : 'e.g. 320'}
          value={overrides.flatWidthMm}
          onChange={v => set('flatWidthMm', v)}
          onClear={() => set('flatWidthMm', null)}
          min={1}
        />
        <OverrideField
          label="Flat height (mm)"
          placeholder={result ? `Est. ${result.flatHeightMm}` : 'e.g. 210'}
          value={overrides.flatHeightMm}
          onChange={v => set('flatHeightMm', v)}
          onClear={() => set('flatHeightMm', null)}
          min={1}
        />
        <OverrideField
          label="Pieces per sheet"
          placeholder={result ? `Est. ${result.piecesPerSheet}` : 'e.g. 8'}
          value={overrides.piecesPerSheet}
          onChange={v => set('piecesPerSheet', v)}
          onClear={() => set('piecesPerSheet', null)}
          min={1}
        />
        <OverrideField
          label="Wastage %"
          placeholder={result ? `Est. ${result.wastagePercentage}` : 'e.g. 25'}
          value={overrides.wastagePercentage}
          onChange={v => set('wastagePercentage', v)}
          onClear={() => set('wastagePercentage', null)}
          min={0}
          max={99}
        />
      </div>
    </div>
  )
}
