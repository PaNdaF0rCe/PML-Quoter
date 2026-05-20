import { useState } from 'react'
import { seedPricingIfMissing } from '../../firebase/pricing'
import Button from '../ui/Button'

interface SeedButtonProps {
  onSeeded: () => void
}

export default function SeedButton({ onSeeded }: SeedButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'exists' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSeed = async () => {
    setStatus('loading')
    setErrorMsg('')
    try {
      const seeded = await seedPricingIfMissing()
      setStatus(seeded ? 'done' : 'exists')
      if (seeded) onSeeded()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setErrorMsg(msg)
      setStatus('error')
      console.error('Seed failed:', e)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Button onClick={handleSeed} variant="secondary" disabled={status === 'loading'}>
          {status === 'loading' ? 'Seeding...' : 'Seed Default Pricing'}
        </Button>
        {status === 'done' && <span className="text-sm text-green-600">Default pricing seeded.</span>}
        {status === 'exists' && <span className="text-sm text-gray-500">Pricing already exists.</span>}
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 max-w-md break-all">
          Error: {errorMsg}
        </p>
      )}
    </div>
  )
}
