import { useState } from 'react'
import { seedPricingIfMissing } from '../../firebase/pricing'
import Button from '../ui/Button'

interface SeedButtonProps {
  onSeeded: () => void
}

export default function SeedButton({ onSeeded }: SeedButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'exists'>('idle')

  const handleSeed = async () => {
    setStatus('loading')
    const seeded = await seedPricingIfMissing()
    setStatus(seeded ? 'done' : 'exists')
    if (seeded) onSeeded()
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleSeed} variant="secondary" disabled={status === 'loading'}>
        {status === 'loading' ? 'Seeding...' : 'Seed Default Pricing'}
      </Button>
      {status === 'done' && <span className="text-sm text-green-600">Default pricing seeded.</span>}
      {status === 'exists' && <span className="text-sm text-gray-500">Pricing already exists.</span>}
    </div>
  )
}
