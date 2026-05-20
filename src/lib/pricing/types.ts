export interface ProductTypePrice {
  id: string
  label: string
  basePrice: number
}

export interface ReelSizePrice {
  id: string
  label: string
  price: number
}

export interface QuantityTier {
  qty: number
  label: string
}

export interface PrintColourRate {
  colours: number
  label: string
  ratePerUnit: number
}

export interface PrintAreaRate {
  id: string
  label: string
  ratePerUnit: number
}

export interface MaterialRate {
  twoply: number
  threeply: number
  lamination: number
}

export interface AddOnRates {
  dieCutting: number
  sidePasting: number
  packagingDelivery: number
}

export interface PricingConfig {
  productTypes: ProductTypePrice[]
  reelSizes: ReelSizePrice[]
  quantityTiers: QuantityTier[]
  printColourRates: PrintColourRate[]
  printAreaRates: PrintAreaRate[]
  materialRates: MaterialRate
  addOnRates: AddOnRates
  labourPercentage: number
}

export type MaterialOption = 'twoply' | 'threeply' | 'lamination' | ''

export interface QuoteInput {
  productTypeId: string
  reelSizeId: string
  requestedQty: number
  printing: boolean
  printColours: number
  printAreaId: string
  material: MaterialOption
  dieCutting: boolean
  sidePasting: boolean
  packagingDelivery: boolean
}

export interface QuoteBreakdown {
  requestedQty: number
  costingQty: number
  basePrice: number
  printingCost: number
  materialCost: number
  addOnCosts: {
    dieCutting: number
    sidePasting: number
    packagingDelivery: number
  }
  labourCharge: number
  total: number
  perUnit: number
}
