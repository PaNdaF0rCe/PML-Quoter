import type { PricingConfig } from '../../lib/pricing/types'

export const defaultPricing: PricingConfig = {
  reelSizes: [
    { id: 'small', label: 'Small (100mm)', price: 0.005 },
    { id: 'medium', label: 'Medium (200mm)', price: 0.008 },
    { id: 'large', label: 'Large (300mm)', price: 0.012 },
    { id: 'xlarge', label: 'X-Large (400mm)', price: 0.016 },
  ],
  quantityTiers: [
    { qty: 2000, label: '2,000' },
    { qty: 4000, label: '4,000' },
    { qty: 6000, label: '6,000' },
    { qty: 8000, label: '8,000' },
    { qty: 10000, label: '10,000' },
    { qty: 15000, label: '15,000' },
    { qty: 20000, label: '20,000' },
  ],
  printColourRates: [
    { colours: 1, label: '1 Colour', ratePerUnit: 0.003 },
    { colours: 2, label: '2 Colours', ratePerUnit: 0.005 },
    { colours: 3, label: '3 Colours', ratePerUnit: 0.007 },
    { colours: 4, label: '4 Colours (Full)', ratePerUnit: 0.01 },
  ],
  printAreaRates: [
    { id: 'small', label: 'Small (< 50cm²)', ratePerUnit: 0.002 },
    { id: 'medium', label: 'Medium (50–150cm²)', ratePerUnit: 0.004 },
    { id: 'large', label: 'Large (> 150cm²)', ratePerUnit: 0.006 },
  ],
  materialRates: {
    twoply: 0.008,
    threeply: 0.012,
    lamination: 0.015,
  },
  addOnRates: {
    dieCutting: 0.005,
    sidePasting: 0.005,
    packagingDelivery: 0.005,
  },
  labourPercentage: 30,
}
