// ─── Colour analysis ────────────────────────────────────────────────────────

export interface DominantColour {
  hex: string
  percentage: number
  rgb: [number, number, number]
}

export type SuggestedPrintMode = '1-colour' | '2-colour' | '3-colour' | '4-colour' | 'cmyk'
export type Confidence = 'low' | 'medium' | 'high'

export interface ColourAnalysisResult {
  dominantColours: DominantColour[]
  estimatedColourCount: number
  suggestedPrintMode: SuggestedPrintMode
  confidence: Confidence
  notes: string
}

// ─── Product / dimensions ────────────────────────────────────────────────────

export type DimensionUnit = 'mm' | 'cm' | 'inches'
export type PrintingSide = 'one-side' | 'two-side'
export type FlutType = 'none' | 'e-flute' | 'nano-flute' | 'f-flute'
export type ProductType =
  | 'straight-tuck-end'
  | 'reverse-tuck-end'
  | 'lock-bottom'
  | 'pizza-box'
  | 'sleeve'
  | 'tray'
  | 'custom'

export type BoardType =
  | 'boxboard'
  | 'duplex'
  | 'kraft'
  | 'art-paper'
  | 'triplex'
  | 'e-flute-board'
  | 'nano-flute-board'
  | 'f-flute-board'

export interface BoxDimensions {
  length: number
  width: number
  height: number
  unit: DimensionUnit
}

// ─── Layout config ───────────────────────────────────────────────────────────

export const STANDARD_SHEET_SIZES = [
  { id: 'royal', label: 'Royal  31×43 in (787×1092 mm)', widthMm: 787, heightMm: 1092 },
  { id: 'medium', label: 'Medium  25×36 in (635×914 mm)', widthMm: 635, heightMm: 914 },
  { id: 'demy', label: 'Demy  23×35 in (584×889 mm)', widthMm: 584, heightMm: 889 },
  { id: 'crown', label: 'Crown  20×28 in (508×711 mm)', widthMm: 508, heightMm: 711 },
  { id: 'custom', label: 'Custom size…', widthMm: 0, heightMm: 0 },
] as const

export interface LayoutConfig {
  productType: ProductType
  dimensions: BoxDimensions
  quantity: number
  boardType: BoardType
  boardGsm: string
  fluteType: FlutType
  lamination: boolean
  printingSide: PrintingSide
  notes: string
  // allowances (all in mm)
  glueFlapMm: number
  bleedMm: number
  trimAllowanceMm: number
  machineMarginMm: number
  sheetWidthMm: number
  sheetHeightMm: number
}

export const DEFAULT_LAYOUT_CONFIG: Omit<LayoutConfig, 'dimensions'> = {
  productType: 'straight-tuck-end',
  quantity: 1000,
  boardType: 'boxboard',
  boardGsm: '300',
  fluteType: 'none',
  lamination: false,
  printingSide: 'one-side',
  notes: '',
  glueFlapMm: 20,
  bleedMm: 3,
  trimAllowanceMm: 3,
  machineMarginMm: 15,
  sheetWidthMm: 787,
  sheetHeightMm: 1092,
}

// ─── Layout result ───────────────────────────────────────────────────────────

export interface LayoutItem {
  x: number
  y: number
  width: number
  height: number
  rotated: boolean
}

export interface CuttingLayoutResult {
  flatWidthMm: number
  flatHeightMm: number
  pieceWidthMm: number   // flat + bleed/trim
  pieceHeightMm: number
  areaPerPieceSqMm: number
  piecesPerSheet: number
  sheetsRequired: number
  wastagePercentage: number
  layoutItems: LayoutItem[]
  sheetWidthMm: number
  sheetHeightMm: number
  orientation: 'normal' | 'rotated'
  notes: string[]
}

// ─── Uploaded sample ─────────────────────────────────────────────────────────

export interface SampleImage {
  id: string
  file: File
  dataUrl: string
  analysis: ColourAnalysisResult | null
  analysing: boolean
}

// ─── Admin overrides ─────────────────────────────────────────────────────────

export interface AdminOverrides {
  colourCount: number | null
  flatWidthMm: number | null
  flatHeightMm: number | null
  piecesPerSheet: number | null
  wastagePercentage: number | null
}

export const DEFAULT_ADMIN_OVERRIDES: AdminOverrides = {
  colourCount: null,
  flatWidthMm: null,
  flatHeightMm: null,
  piecesPerSheet: null,
  wastagePercentage: null,
}
