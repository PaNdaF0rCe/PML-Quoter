import type { MaterialRate } from '../../lib/pricing/types'
import Input from '../ui/Input'

interface MaterialRatesEditorProps {
  rates: MaterialRate
  onChange: (rates: MaterialRate) => void
}

const fields: { key: keyof MaterialRate; label: string }[] = [
  { key: 'twoply', label: '2 Ply (LKR per unit)' },
  { key: 'threeply', label: '3 Ply (LKR per unit)' },
  { key: 'lamination', label: 'Lamination (LKR per unit)' },
]

export default function MaterialRatesEditor({ rates, onChange }: MaterialRatesEditorProps) {
  const update = (key: keyof MaterialRate, value: number) => {
    onChange({ ...rates, [key]: value })
  }

  return (
    <div className="space-y-3">
      {fields.map(({ key, label }) => (
        <div key={key} className="grid grid-cols-12 gap-2 items-center">
          <span className="col-span-6 text-sm text-gray-700">{label}</span>
          <Input
            className="col-span-4"
            type="number"
            step="0.001"
            value={rates[key]}
            onChange={e => update(key, Number(e.target.value))}
          />
          <span className="col-span-2 text-xs text-gray-400">LKR/unit</span>
        </div>
      ))}
    </div>
  )
}
