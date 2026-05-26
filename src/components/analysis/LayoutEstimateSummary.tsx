import type { CuttingLayoutResult, AdminOverrides } from '../../lib/analysis/types'

interface Props {
  result: CuttingLayoutResult
  overrides: AdminOverrides
  quantity: number
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function fmt(n: number) {
  return n.toLocaleString('en-US')
}

export default function LayoutEstimateSummary({ result, overrides, quantity }: Props) {
  const flatW = overrides.flatWidthMm ?? result.flatWidthMm
  const flatH = overrides.flatHeightMm ?? result.flatHeightMm
  const pps = overrides.piecesPerSheet ?? result.piecesPerSheet
  const wastage = overrides.wastagePercentage ?? result.wastagePercentage
  const sheets = pps > 0 ? Math.ceil(quantity / pps) : 0

  const hasOverride =
    overrides.flatWidthMm !== null ||
    overrides.flatHeightMm !== null ||
    overrides.piecesPerSheet !== null ||
    overrides.wastagePercentage !== null

  return (
    <div className="space-y-4">
      {hasOverride && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800">
          ✎ Some values below have been overridden by admin.
        </div>
      )}

      {/* Key stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          label="Estimated flat size"
          value={`${fmt(flatW)} × ${fmt(flatH)} mm`}
          sub="Width × Height (dieline)"
        />
        <Stat
          label="Piece size (with bleed)"
          value={`${fmt(result.pieceWidthMm)} × ${fmt(result.pieceHeightMm)} mm`}
          sub="Includes bleed + trim allowance"
        />
        <Stat
          label="Pieces per sheet"
          value={fmt(pps)}
          sub={result.orientation === 'rotated' ? 'Rotated 90° orientation' : 'Normal orientation'}
        />
        <Stat
          label="Sheets required"
          value={sheets > 0 ? fmt(sheets) : '—'}
          sub={`for ${fmt(quantity)} pieces`}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat
          label="Wastage"
          value={`${wastage}%`}
          sub="of total sheet area"
        />
        <Stat
          label="Sheet size"
          value={`${fmt(result.sheetWidthMm)} × ${fmt(result.sheetHeightMm)} mm`}
          sub="Board / sheet input"
        />
        <Stat
          label="Dieline area"
          value={`${fmt(Math.round(result.areaPerPieceSqMm / 100))} cm²`}
          sub="Per piece (flat, excl. bleed)"
        />
      </div>

      {/* Formula notes */}
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-1">
        <p className="text-xs font-semibold text-gray-600">Formula notes</p>
        {result.notes.map((n, i) => (
          <p key={i} className="text-xs text-gray-500">{n}</p>
        ))}
      </div>

      {/* Production warnings */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
        <p className="font-semibold">⚠ Production warnings</p>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>Flat size is an estimate. Confirm with structural packaging or production.</li>
          <li>Cutting layout may change depending on die, grain direction, and machine margin.</li>
          <li>Board thickness affects folded size and is not included in this estimate.</li>
          <li>Final quotation values must be verified by the production team.</li>
        </ol>
      </div>
    </div>
  )
}
