import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchPricing, savePricing } from '../firebase/pricing'
import { defaultPricing } from '../data/defaults/pricing'
import type { PricingConfig } from '../lib/pricingTypes'

interface PricingContextValue {
  pricing: PricingConfig
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  update: (p: PricingConfig) => Promise<void>
}

const PricingContext = createContext<PricingContextValue | null>(null)

export function PricingProvider({ children }: { children: ReactNode }) {
  const [pricing, setPricing] = useState<PricingConfig>(defaultPricing)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const p = await fetchPricing()
      setPricing(p)
    } catch (e) {
      console.error('Pricing load failed, using defaults', e)
      const detail = e instanceof Error ? e.message : String(e)
      setError(`Could not load pricing from server. Using defaults. (${detail})`)
      setPricing(defaultPricing)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const update = async (p: PricingConfig) => {
    await savePricing(p)
    setPricing(p)
  }

  return (
    <PricingContext.Provider value={{ pricing, loading, error, reload: load, update }}>
      {children}
    </PricingContext.Provider>
  )
}

export function usePricing() {
  const ctx = useContext(PricingContext)
  if (!ctx) throw new Error('usePricing must be used within PricingProvider')
  return ctx
}
