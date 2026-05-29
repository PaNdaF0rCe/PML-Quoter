// ─── Material / board IDs ────────────────────────────────────────────────────

export type MaterialId = '2ply_brown' | '2ply_white' | '3ply_brown' | '3ply_white'
export type BoardId = 'none' | '250gsm' | '300gsm'

// ─── Pricing config (stored in Firestore, editable in admin) ─────────────────

export interface MaterialRates {
  '2ply_brown': number   // Rs per in²
  '2ply_white': number
  '3ply_brown': number
  '3ply_white': number
}

export interface BoardRates {
  '250gsm': number       // Rs per in²
  '300gsm': number
}

export interface AddOnRates {
  printingPerColour: number     // Rs per colour per unit
  varnishPerUnit: number        // Rs per unit
  dieCutterPerPunch: number     // Rs per unit
  laminatePerSqIn: number       // Rs per in²
  pastingPerUnit: number        // Rs per unit
  packingDeliveryPerUnit: number // Rs per unit
}

export interface Surcharges {
  twoPlyPercentage: number      // % added to subtotal when material is 2-ply
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
  quotationDate: string   // ISO date string  YYYY-MM-DD
  validUntil: string      // ISO date string  YYYY-MM-DD
  notes: string
}

export interface QuoteInput {
  squareInchesPerUnit: number
  quantity: number
  material: MaterialId
  board: BoardId
  printing: boolean
  colourCount: number    // 1-4; treat 4 as CMYK
  varnish: boolean
  dieCutting: boolean
  lamination: boolean
  pasting: boolean
  packingDelivery: boolean
}

// ─── Quote result ─────────────────────────────────────────────────────────────

export interface QuoteResult {
  totalArea: number
  materialCost: number
  boardCost: number
  printingCost: number
  varnishCost: number
  dieCuttingCost: number
  laminateCost: number
  pastingCost: number
  packingDeliveryCost: number
  subtotal: number
  twoPlySurcharge: number
  twoPlyPercentage: number
  total: number
  perUnitPrice: number
  isTwoPly: boolean
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const MATERIAL_LABELS: Record<MaterialId, string> = {
  '2ply_brown': '2 Ply Brown',
  '2ply_white': '2 Ply White',
  '3ply_brown': '3 Ply Brown',
  '3ply_white': '3 Ply White',
}

export const BOARD_LABELS: Record<BoardId, string> = {
  none: 'None',
  '250gsm': '250 GSM',
  '300gsm': '300 GSM',
}

export const COLOUR_OPTIONS = [
  { value: 1, label: '1 Colour' },
  { value: 2, label: '2 Colours' },
  { value: 3, label: '3 Colours' },
  { value: 4, label: '4 Colours (CMYK)' },
] as const
