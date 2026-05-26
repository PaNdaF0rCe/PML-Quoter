import type { ColourAnalysisResult } from '../../lib/analysis/types'
import { PRINT_MODE_LABELS, CONFIDENCE_LABELS } from '../../lib/imageColourAnalysis'

interface Props {
  result: ColourAnalysisResult
  overrideColourCount: number | null
  onOverride: (count: number | null) => void
}

const COLOUR_OPTIONS = [
  { value: 1, label: '1 Colour' },
  { value: 2, label: '2 Colours' },
  { value: 3, label: '3 Colours' },
  { value: 4, label: '4 Colours' },
  { value: 5, label: 'Full Colour / CMYK' },
]

const confidenceBadge: Record<string, string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-red-100 text-red-800',
}

export default function ColourSwatchList({ result, overrideColourCount, onOverride }: Props) {
  const displayCount = overrideColourCount ?? result.estimatedColourCount

  return (
    <div className="space-y-4">
      {/* Detected swatches */}
      {result.dominantColours.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Detected dominant colours
          </p>
          <div className="flex flex-wrap gap-3">
            {result.dominantColours.slice(0, 8).map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm"
                  style={{ backgroundColor: c.hex }}
                  title={`${c.hex} — ${c.percentage}%`}
                />
                <span className="text-xs text-gray-500">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested print mode */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Suggested print mode
          </p>
          <span className="inline-block bg-red-700 text-white text-sm font-semibold px-3 py-1 rounded-full">
            {PRINT_MODE_LABELS[result.suggestedPrintMode]}
          </span>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Confidence
          </p>
          <span
            className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${confidenceBadge[result.confidence]}`}
          >
            {CONFIDENCE_LABELS[result.confidence]}
          </span>
        </div>
      </div>

      {/* Notes */}
      <p className="text-xs text-gray-500 italic">{result.notes}</p>

      {/* Admin override */}
      <div className="pt-3 border-t border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Override colour count
          {overrideColourCount !== null && (
            <span className="ml-2 text-xs text-red-600 font-normal">(overridden)</span>
          )}
        </label>
        <div className="flex items-center gap-2">
          <select
            value={overrideColourCount ?? ''}
            onChange={e => {
              const v = e.target.value
              onOverride(v === '' ? null : Number(v))
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="">Use estimated ({COLOUR_OPTIONS.find(o => o.value === displayCount)?.label ?? displayCount})</option>
            {COLOUR_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {overrideColourCount !== null && (
            <button
              type="button"
              onClick={() => onOverride(null)}
              className="text-xs text-gray-500 hover:text-red-700 underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Always-on production warning */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
        <p className="font-semibold">⚠ Estimate only</p>
        <p>
          Uploaded sample images may not show exact print colours due to lighting, camera quality,
          shadows, and file compression. This colour count is a rough guide.
          Final colour separation and print setup must be confirmed by production.
        </p>
      </div>
    </div>
  )
}
