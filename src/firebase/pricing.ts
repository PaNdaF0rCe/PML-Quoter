import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './config'
import { defaultPricing } from '../data/defaults/pricing'
import type { PricingConfig } from '../lib/pricing/types'

const PRICING_DOC = 'config/pricing'

export async function fetchPricing(): Promise<PricingConfig> {
  const ref = doc(db, 'config', 'pricing')
  const snap = await getDoc(ref)
  if (snap.exists()) {
    return snap.data() as PricingConfig
  }
  return defaultPricing
}

export async function savePricing(pricing: PricingConfig): Promise<void> {
  const ref = doc(db, 'config', 'pricing')
  await setDoc(ref, pricing)
}

export async function seedPricingIfMissing(): Promise<boolean> {
  const ref = doc(db, 'config', 'pricing')
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, defaultPricing)
    return true
  }
  return false
}

export { PRICING_DOC }
