import type { CuttingLayoutResult } from '../../lib/analysis/types'

interface Props {
  result: CuttingLayoutResult
  /** Limit how many pieces to render in the SVG (performance guard) */
  maxRender?: number
}

export default function CuttingLayoutPreview({ result, maxRender = 200 }: Props) {
  const { sheetWidthMm, sheetHeightMm, layoutItems, machineMarginVisible } = {
    ...result,
    machineMarginVisible: true,
  }

  if (sheetWidthMm <= 0 || sheetHeightMm <= 0) return null

  // SVG viewBox uses mm directly
  const vw = sheetWidthMm
  const vh = sheetHeightMm

  // Only render up to maxRender pieces for performance
  const visibleItems = layoutItems.slice(0, maxRender)
  const clipped = layoutItems.length > maxRender

  // Detect machine margin from first item's x/y
  const margin = visibleItems[0]
    ? Math.min(visibleItems[0].x, visibleItems[0].y)
    : 0

  // Colour palette
  const PIECE_FILL = '#fde8e8'
  const PIECE_STROKE = '#b91c1c'
  const SHEET_FILL = '#f9fafb'
  const SHEET_STROKE = '#374151'
  const MARGIN_STROKE = '#d1d5db'
  const UNUSED_FILL = '#f3f4f6'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Estimated cutting layout
        </p>
        <span className="text-xs text-gray-400">
          {visibleItems.length} of {layoutItems.length} pieces shown
          {clipped ? ' (preview capped)' : ''}
        </span>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-100 p-2">
        <svg
          viewBox={`0 0 ${vw} ${vh}`}
          className="w-full h-auto max-h-96 block"
          aria-label="Cutting layout preview"
        >
          {/* Sheet background */}
          <rect x={0} y={0} width={vw} height={vh} fill={SHEET_FILL} stroke={SHEET_STROKE} strokeWidth={vw * 0.003} />

          {/* Machine margin dashed guide */}
          {margin > 0 && (
            <rect
              x={margin}
              y={margin}
              width={vw - 2 * margin}
              height={vh - 2 * margin}
              fill="none"
              stroke={MARGIN_STROKE}
              strokeWidth={vw * 0.002}
              strokeDasharray={`${vw * 0.01} ${vw * 0.006}`}
            />
          )}

          {/* Unused fill for a quick visual hint — fill usable area then cut-outs */}
          {visibleItems.length > 0 && (
            <rect
              x={margin}
              y={margin}
              width={vw - 2 * margin}
              height={vh - 2 * margin}
              fill={UNUSED_FILL}
            />
          )}

          {/* Piece rectangles */}
          {visibleItems.map((item, i) => (
            <g key={i}>
              <rect
                x={item.x}
                y={item.y}
                width={item.width}
                height={item.height}
                fill={PIECE_FILL}
                stroke={PIECE_STROKE}
                strokeWidth={vw * 0.003}
                rx={vw * 0.003}
              />
              {/* Fold-line cross inside each piece (decorative) */}
              <line
                x1={item.x + item.width * 0.25}
                y1={item.y + item.height * 0.5}
                x2={item.x + item.width * 0.75}
                y2={item.y + item.height * 0.5}
                stroke={PIECE_STROKE}
                strokeWidth={vw * 0.001}
                strokeOpacity={0.4}
                strokeDasharray={`${vw * 0.005} ${vw * 0.003}`}
              />
              <line
                x1={item.x + item.width * 0.5}
                y1={item.y + item.height * 0.25}
                x2={item.x + item.width * 0.5}
                y2={item.y + item.height * 0.75}
                stroke={PIECE_STROKE}
                strokeWidth={vw * 0.001}
                strokeOpacity={0.4}
                strokeDasharray={`${vw * 0.005} ${vw * 0.003}`}
              />
            </g>
          ))}

          {/* Sheet dimension labels */}
          <text
            x={vw / 2}
            y={vh - vw * 0.01}
            textAnchor="middle"
            fontSize={vw * 0.025}
            fill="#6b7280"
          >
            {Math.round(vw)} mm
          </text>
          <text
            x={vw * 0.015}
            y={vh / 2}
            textAnchor="middle"
            fontSize={vw * 0.025}
            fill="#6b7280"
            transform={`rotate(-90, ${vw * 0.015}, ${vh / 2})`}
          >
            {Math.round(vh)} mm
          </text>

          {/* Piece size label on first piece */}
          {visibleItems[0] && (
            <text
              x={visibleItems[0].x + visibleItems[0].width / 2}
              y={visibleItems[0].y + visibleItems[0].height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={vw * 0.022}
              fill="#991b1b"
            >
              {Math.round(visibleItems[0].width)}×{Math.round(visibleItems[0].height)}
            </text>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded border border-red-700 bg-red-50" />
          Piece (flat+bleed)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-gray-100 border border-gray-300" />
          Unused area
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-5 border-t border-dashed border-gray-400" />
          Machine margin
        </span>
      </div>

      <p className="text-xs text-gray-400 italic">
        * Cutting layout is an estimate. Grain direction, die tolerances, board quality, and
        machine-specific margins may change the final layout.
      </p>
    </div>
  )
}
