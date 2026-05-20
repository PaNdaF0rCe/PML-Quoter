import { useState } from 'react'
import type { QuantityTier } from '../../lib/pricing/types'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Label from '../ui/Label'

interface QuantityTiersEditorProps {
  items: QuantityTier[]
  onChange: (items: QuantityTier[]) => void
}

export default function QuantityTiersEditor({ items, onChange }: QuantityTiersEditorProps) {
  const [newQty, setNewQty] = useState('')

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index))

  const add = () => {
    if (!newQty) return
    const qty = Number(newQty)
    if (isNaN(qty) || qty <= 0) return
    const sorted = [...items, { qty, label: qty.toLocaleString() }].sort((a, b) => a.qty - b.qty)
    onChange(sorted)
    setNewQty('')
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Tiers are sorted automatically. The costing engine picks the next tier at or above the requested quantity.</p>
      <div className="flex flex-wrap gap-2">
        {items
          .slice()
          .sort((a, b) => a.qty - b.qty)
          .map((tier, i) => (
            <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-lg px-3 py-1.5">
              <span className="text-sm font-medium">{tier.qty.toLocaleString()}</span>
              <button
                type="button"
                onClick={() => remove(items.findIndex(t => t.qty === tier.qty))}
                className="ml-1 text-gray-400 hover:text-red-500 text-xs leading-none"
              >
                ×
              </button>
            </div>
          ))}
      </div>
      <div className="flex gap-2 items-end mt-4 pt-4 border-t border-gray-100">
        <div className="flex-1">
          <Label>Add Tier Quantity</Label>
          <Input
            type="number"
            min={1}
            value={newQty}
            onChange={e => setNewQty(e.target.value)}
            placeholder="e.g. 5000"
            onKeyDown={e => e.key === 'Enter' && add()}
          />
        </div>
        <Button size="md" onClick={add}>Add Tier</Button>
      </div>
    </div>
  )
}
