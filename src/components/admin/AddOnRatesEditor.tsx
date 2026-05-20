import type { AddOnRates } from '../../lib/pricing/types'
import Input from '../ui/Input'

interface AddOnRatesEditorProps {
  rates: AddOnRates
  onChange: (rates: AddOnRates) => void
}

const fields: { key: keyof AddOnRates; label: string }[] = [
  { key: 'dieCutting', label: 'Die Cutting (LKR per unit)' },
  { key: 'sidePasting', label: 'Side Pasting (LKR per unit)' },
  { key: 'packagingDelivery', label: 'Packaging & Delivery (LKR per unit)' },
]

export default function AddOnRatesEditor({ rates, onChange }: AddOnRatesEditorProps) {
  const update = (key: keyof AddOnRates, value: number) => {
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
