import type { PricingConfig, QuoteInput, QuoteBreakdown } from './types'

export function getCostingTier(requestedQty: number, tiers: { qty: number }[]): number {
  const sorted = [...tiers].sort((a, b) => a.qty - b.qty)
  const match = sorted.find(t => t.qty >= requestedQty)
  return match ? match.qty : sorted[sorted.length - 1].qty
}

export function calculateQuote(input: QuoteInput, pricing: PricingConfig): QuoteBreakdown | null {
  const reel = pricing.reelSizes.find(r => r.id === input.reelSizeId)

  if (!reel || input.requestedQty <= 0) return null

  const costingQty = getCostingTier(input.requestedQty, pricing.quantityTiers)

  const basePrice = reel.price * costingQty

  // Printing cost
  let printingCost = 0
  if (input.printing) {
    const colourRate = pricing.printColourRates.find(c => c.colours === input.printColours)
    const areaRate = pricing.printAreaRates.find(a => a.id === input.printAreaId)
    const cRate = colourRate?.ratePerUnit ?? 0
    const aRate = areaRate?.ratePerUnit ?? 0
    printingCost = (cRate + aRate) * costingQty
  }

  // Material cost
  let materialCost = 0
  if (input.material === 'twoply') materialCost = pricing.materialRates.twoply * costingQty
  else if (input.material === 'threeply') materialCost = pricing.materialRates.threeply * costingQty
  else if (input.material === 'lamination') materialCost = pricing.materialRates.lamination * costingQty

  // Add-on costs
  const dieCutting = input.dieCutting ? pricing.addOnRates.dieCutting * costingQty : 0
  const sidePasting = input.sidePasting ? pricing.addOnRates.sidePasting * costingQty : 0
  const packagingDelivery = input.packagingDelivery ? pricing.addOnRates.packagingDelivery * costingQty : 0

  const subtotal = basePrice + printingCost + materialCost + dieCutting + sidePasting + packagingDelivery
  const labourCharge = subtotal * (pricing.labourPercentage / 100)
  const total = subtotal + labourCharge
  const perUnit = total / costingQty

  return {
    requestedQty: input.requestedQty,
    costingQty,
    basePrice,
    printingCost,
    materialCost,
    addOnCosts: { dieCutting, sidePasting, packagingDelivery },
    labourCharge,
    total,
    perUnit,
  }
}
