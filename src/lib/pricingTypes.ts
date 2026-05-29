// ─── Material / board / laminate IDs ─────────────────────────────────────────

export type MaterialId = '2ply_brown' | '2ply_white' | '3ply_brown' | '3ply_white' | 'none'
export type BoardId    = 'none' | '250gsm' | '300gsm'
export type LaminateType = 'none' | 'hot' | 'cold' | 'uv'

// ─── Pricing config (stored in Firestore, editable in admin) ─────────────────

export interface MaterialRates {
  '2ply_brown': number   // Rs per in²
  '2ply_white': number
  '3ply_brown': number
  '3ply_white': number
  // 'none' (board-only) has no rate
}

export interface BoardRates {
  '250gsm': number       // Rs per in²
  '300gsm': number
}

export interface AddOnRates {
  printingPerColour:      number   // Rs per colour per unit
  varnishPerUnit:         number   // Rs per unit
  dieCutterPerPunch:      number   // Rs per unit
  eFluteLaminatePerSqIn:  number   // Rs per in²  (internal e-flute lamination)
  hotLaminatePerSqIn:     number   // Rs per in²  (external hot laminate)
  coldLaminatePerSqIn:    number   // Rs per in²  (external cold laminate)
  uvLaminatePerSqIn:      number   // Rs per in²  (external UV laminate)
  pastingPerUnit:         number   // Rs per unit
  packingDeliveryPerUnit: number   // Rs per unit
}

export interface Surcharges {
  twoPlyPercentage: number   // % added to subtotal when material is 2-ply only (no board or add-ons)
}

export interface CompanySettings {
  companyName: string
  legalName: string
  address: string
  phone: string
  email: string
  website: string
  brNumber: string
  vatNumber: string
  footerNote: string
  paymentTerms: string
  bankDetails: string
}

export interface PricingConfig {
  materials: MaterialRates
  boards: BoardRates
  addons: AddOnRates
  surcharges: Surcharges
  company: CompanySettings
}

// ─── Quote inputs ─────────────────────────────────────────────────────────────

export interface CustomerDetails {
  customerName: string
  customerPhone: string
  customerCompany: string
  customerAddress: string
  quotationTitle: string
  quotationNumber: string
  quotationDate: string   // ISO date  YYYY-MM-DD
  validUntil: string      // ISO date  YYYY-MM-DD
  notes: string
}

export interface QuoteInput {
  length: number              // inches — squareInchesPerUnit = length × width
  width: number               // inches
  quantity: number
  material: MaterialId
  board: BoardId
  // ── core add-ons ──
  printing: boolean
  colourCount: number      // 1-N; 4 = CMYK
  varnish: boolean         // compulsory when printing = true
  dieCutting: boolean
  eFluteLamination: boolean // compulsory when printing = true
  pasting: boolean
  packingDelivery: boolean
  // ── external costs ──
  laminateType: LaminateType  // external laminate selection
  foilingPerUnit: number      // foiling cost per unit (Rs); 0 = not selected
}

// ─── Quote result ─────────────────────────────────────────────────────────────

export interface QuoteResult {
  totalArea: number
  materialCost: number
  boardCost: number
  printingCost: number
  varnishCost: number
  dieCuttingCost: number
  eFluteLaminateCost: number
  pastingCost: number
  packingDeliveryCost: number
  subtotal: number
  twoPlySurcharge: number
  twoPlyPercentage: number
  // external costs (not subject to 2-ply surcharge)
  externalLaminateCost: number
  foilingCost: number
  total: number
  perUnitPrice: number
  isTwoPly: boolean
}

// ─── Saved quote (Firestore: collection 'quotes') ────────────────────────────

export interface SavedQuote {
  id: string
  customer: CustomerDetails
  input: QuoteInput
  result: QuoteResult
  savedAt: string   // ISO timestamp
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const MATERIAL_LABELS: Record<MaterialId, string> = {
  '2ply_brown': '2 Ply Brown',
  '2ply_white': '2 Ply White',
  '3ply_brown': '3 Ply Brown',
  '3ply_white': '3 Ply White',
  'none':       'Board Only',
}

export const BOARD_LABELS: Record<BoardId, string> = {
  none:    'None',
  '250gsm': '250 GSM',
  '300gsm': '300 GSM',
}

export const LAMINATE_LABELS: Record<LaminateType, string> = {
  none: 'None',
  hot:  'Hot Laminate',
  cold: 'Cold Laminate',
  uv:   'UV',
}

export const COLOUR_OPTIONS = [
  { value: 1, label: '1 Colour' },
  { value: 2, label: '2 Colours' },
  { value: 3, label: '3 Colours' },
  { value: 4, label: '4 Colours (CMYK)' },
] as const
