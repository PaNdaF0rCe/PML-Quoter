import { useState } from 'react'
import type { ReelSizePrice } from '../../lib/pricing/types'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Label from '../ui/Label'

interface ReelSizesEditorProps {
  items: ReelSizePrice[]
  onChange: (items: ReelSizePrice[]) => void
}

export default function ReelSizesEditor({ items, onChange }: ReelSizesEditorProps) {
  const [newLabel, setNewLabel] = useState('')
  const [newPrice, setNewPrice] = useState('')

  const update = (index: number, field: keyof ReelSizePrice, value: string | number) => {
    onChange(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index))

  const add = () => {
    if (!newLabel.trim() || !newPrice) return
    const id = newLabel.toLowerCase().replace(/\s+/g, '-')
    onChange([...items, { id, label: newLabel.trim(), price: Number(newPrice) }])
    setNewLabel('')
    setNewPrice('')
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
          <Input className="col-span-5" value={item.label} onChange={e => update(i, 'label', e.target.value)} />
          <Input className="col-span-4" type="number" step="0.001" value={item.price} onChange={e => update(i, 'price', Number(e.target.value))} />
          <span className="col-span-1 text-xs text-gray-400">LKR/unit</span>
          <Button className="col-span-2" variant="danger" size="sm" onClick={() => remove(i)}>Remove</Button>
        </div>
      ))}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <Label>Add New Reel Size</Label>
        <div className="grid grid-cols-12 gap-2 items-center">
          <Input className="col-span-5" value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Label" />
          <Input className="col-span-4" type="number" step="0.001" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Price" />
          <span className="col-span-1 text-xs text-gray-400">LKR/unit</span>
          <Button className="col-span-2" size="sm" onClick={add}>Add</Button>
        </div>
      </div>
    </div>
  )
}
