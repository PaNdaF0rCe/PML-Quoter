import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './config'
import { defaultPricing } from '../data/defaults/pricing'
import type { PricingConfig } from '../lib/pricingTypes'

const REF = () => doc(db, 'config', 'v2')  // v2 separates from the old reel-based structure

export async function fetchPricing(): Promise<PricingConfig> {
  const snap = await getDoc(REF())
  if (snap.exists()) {
    const data = snap.data() as PricingConfig
    // Basic structural validation — fall back to defaults if the doc is from old schema
    if (data.materials && data.boards && data.addons && data.surcharges && data.company) {
      // Deep-merge with defaults so any newly-added fields always have a fallback value.
      // This prevents "undefined" rates when the Firestore doc pre-dates a schema addition.
      return {
        materials:    { ...defaultPricing.materials,    ...data.materials },
        boards: {
          white_back: { ...defaultPricing.boards.white_back, ...(data.boards?.white_back ?? {}) },
          grey_back:  { ...defaultPricing.boards.grey_back,  ...(data.boards?.grey_back  ?? {}) },
          ivory:      { ...defaultPricing.boards.ivory,      ...(data.boards?.ivory      ?? {}) },
        },
        addons:       { ...defaultPricing.addons,       ...data.addons },
        surcharges:   { ...defaultPricing.surcharges,   ...data.surcharges },
        company:      { ...defaultPricing.company,      ...data.company },
        wilkinsSpence: data.wilkinsSpence ?? defaultPricing.wilkinsSpence,
      }
    }
  }
  return defaultPricing
}

export async function savePricing(pricing: PricingConfig): Promise<void> {
  await setDoc(REF(), pricing)
}

export async function seedPricingIfMissing(): Promise<boolean> {
  const snap = await getDoc(REF())
  if (!snap.exists()) {
    await setDoc(REF(), defaultPricing)
    return true
  }
  return false
}
