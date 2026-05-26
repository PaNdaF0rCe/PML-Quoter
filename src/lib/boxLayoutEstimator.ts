/**
 * Box flat-size estimator and cutting layout calculator.
 *
 * ⚠ Produces ESTIMATES only. These are simplified formulas based on standard
 *   carton construction. Final dieline dimensions must be confirmed by a
 *   structural packaging engineer or production team.
 */

import type {
  LayoutConfig,
  CuttingLayoutResult,
  LayoutItem,
  DimensionUnit,
  ProductType,
} from './analysis/types'

// ─── Unit conversion ─────────────────────────────────────────────────────────

export function toMm(value: number, unit: DimensionUnit): number {
  switch (unit) {
    case 'cm':     return value * 10
    case 'inches': return value * 25.4
    default:       return value
  }
}

// ─── Flat size formula ───────────────────────────────────────────────────────

/**
 * Estimate the flat (unfolded/dieline) dimensions of a box in mm.
 *
 * Formulas are based on common carton constructions. They do not account for
 * board thickness, grain direction, or machine-specific tolerances.
 *
 * Variable names:
 *   L = external length
 *   W = external width
 *   H = external height
 *   G = glue flap
 */
export function estimateFlatSize(
  L: number,
  W: number,
  H: number,
  G: number,
  productType: ProductType,
): { flatW: number; flatH: number; formulaNote: string } {
  switch (productType) {
    case 'straight-tuck-end':
      // flatW = 2L + 2W + G
      // flatH = H + 2W  (tuck flaps folded into the panel)
      return {
        flatW: 2 * L + 2 * W + G,
        flatH: H + 2 * W,
        formulaNote: 'Straight-tuck-end: flatW = 2L+2W+G  |  flatH = H+2W',
      }

    case 'reverse-tuck-end':
      // Same panel widths; tucks go opposite directions but same dieline area
      return {
        flatW: 2 * L + 2 * W + G,
        flatH: H + 2 * W,
        formulaNote: 'Reverse-tuck-end: flatW = 2L+2W+G  |  flatH = H+2W',
      }

    case 'lock-bottom':
      // Lock bottom adds ~15 mm to the height for lock tabs
      return {
        flatW: 2 * L + 2 * W + G,
        flatH: H + 2 * W + 15,
        formulaNote: 'Lock-bottom: flatW = 2L+2W+G  |  flatH = H+2W+15 (lock tabs)',
      }

    case 'pizza-box':
      // Open-style flat box: flatW = 2L + 2H + G  |  flatH = 2W + 2H
      return {
        flatW: 2 * L + 2 * H + G,
        flatH: 2 * W + 2 * H,
        formulaNote: 'Pizza-box: flatW = 2L+2H+G  |  flatH = 2W+2H',
      }

    case 'sleeve':
      // Wrap-around sleeve: flatW = 2L + 2W  |  flatH = H + G
      return {
        flatW: 2 * L + 2 * W,
        flatH: H + G,
        formulaNote: 'Sleeve: flatW = 2(L+W)  |  flatH = H+G',
      }

    case 'tray':
      // Open tray: flatW = L + 2H + G  |  flatH = W + 2H
      return {
        flatW: L + 2 * H + G,
        flatH: W + 2 * H,
        formulaNote: 'Tray: flatW = L+2H+G  |  flatH = W+2H',
      }

    case 'custom':
    default:
      // Generic fallback — same as straight-tuck
      return {
        flatW: 2 * L + 2 * W + G,
        flatH: H + 2 * W,
        formulaNote: 'Custom (generic fallback): flatW = 2L+2W+G  |  flatH = H+2W',
      }
  }
}

// ─── Cutting layout calculator ───────────────────────────────────────────────

/**
 * Given a piece size and sheet size, calculate how many pieces fit per sheet
 * and generate layout items for the SVG preview.
 * Both normal and rotated orientations are tested; the better one is used.
 */
export function calculateCuttingLayout(config: LayoutConfig): CuttingLayoutResult {
  const L = toMm(config.dimensions.length, config.dimensions.unit)
  const W = toMm(config.dimensions.width, config.dimensions.unit)
  const H = toMm(config.dimensions.height, config.dimensions.unit)

  // 1. Flat size
  const { flatW, flatH, formulaNote } = estimateFlatSize(
    L,
    W,
    H,
    config.glueFlapMm,
    config.productType,
  )

  // 2. Piece size with bleed + trim
  const allAround = config.bleedMm + config.trimAllowanceMm
  const pieceW = flatW + 2 * allAround
  const pieceH = flatH + 2 * allAround

  // 3. Usable sheet area (subtract machine margin on each side)
  const usableW = config.sheetWidthMm - 2 * config.machineMarginMm
  const usableH = config.sheetHeightMm - 2 * config.machineMarginMm

  if (usableW <= 0 || usableH <= 0 || pieceW <= 0 || pieceH <= 0) {
    return makeEmptyResult(config, flatW, flatH, pieceW, pieceH, [
      '⚠ Invalid dimensions — check that sheet size is larger than piece size.',
    ])
  }

  // 4. Try both orientations
  const normalCols = Math.floor(usableW / pieceW)
  const normalRows = Math.floor(usableH / pieceH)
  const normalPieces = normalCols * normalRows

  const rotCols = Math.floor(usableW / pieceH)
  const rotRows = Math.floor(usableH / pieceW)
  const rotPieces = rotCols * rotRows

  const useRotated = rotPieces > normalPieces
  const cols = useRotated ? rotCols : normalCols
  const rows = useRotated ? rotRows : normalRows
  const piecesPerSheet = Math.max(0, cols * rows)

  if (piecesPerSheet === 0) {
    return makeEmptyResult(config, flatW, flatH, pieceW, pieceH, [
      '⚠ Piece is larger than the usable sheet area. Choose a larger sheet size or reduce piece dimensions.',
      formulaNote,
    ])
  }

  // 5. Sheets required
  const sheetsRequired = Math.ceil(config.quantity / piecesPerSheet)

  // 6. Wastage
  const sheetArea = config.sheetWidthMm * config.sheetHeightMm
  const pw = useRotated ? pieceH : pieceW
  const ph = useRotated ? pieceW : pieceH
  const usedArea = piecesPerSheet * pw * ph
  const wastagePercentage = Math.max(0, Math.min(99, Math.round(((sheetArea - usedArea) / sheetArea) * 100)))

  // 7. Generate layout items for SVG preview (show first-sheet layout only)
  const layoutItems: LayoutItem[] = []
  const marginX = config.machineMarginMm
  const marginY = config.machineMarginMm

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      layoutItems.push({
        x: marginX + c * pw,
        y: marginY + r * ph,
        width: pw,
        height: ph,
        rotated: useRotated,
      })
    }
  }

  const notes: string[] = [
    formulaNote,
    `Orientation: ${useRotated ? 'Rotated 90°' : 'Normal'} — gives more pieces per sheet.`,
    'Flat size does not account for board thickness or grain direction.',
    'Confirm all dimensions with production before ordering.',
  ]

  return {
    flatWidthMm: Math.round(flatW),
    flatHeightMm: Math.round(flatH),
    pieceWidthMm: Math.round(pieceW),
    pieceHeightMm: Math.round(pieceH),
    areaPerPieceSqMm: Math.round(flatW * flatH),
    piecesPerSheet,
    sheetsRequired,
    wastagePercentage,
    layoutItems,
    sheetWidthMm: config.sheetWidthMm,
    sheetHeightMm: config.sheetHeightMm,
    orientation: useRotated ? 'rotated' : 'normal',
    notes,
  }
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function makeEmptyResult(
  config: LayoutConfig,
  flatW: number,
  flatH: number,
  pieceW: number,
  pieceH: number,
  notes: string[],
): CuttingLayoutResult {
  return {
    flatWidthMm: Math.round(Math.max(0, flatW)),
    flatHeightMm: Math.round(Math.max(0, flatH)),
    pieceWidthMm: Math.round(Math.max(0, pieceW)),
    pieceHeightMm: Math.round(Math.max(0, pieceH)),
    areaPerPieceSqMm: 0,
    piecesPerSheet: 0,
    sheetsRequired: 0,
    wastagePercentage: 100,
    layoutItems: [],
    sheetWidthMm: config.sheetWidthMm,
    sheetHeightMm: config.sheetHeightMm,
    orientation: 'normal',
    notes,
  }
}
