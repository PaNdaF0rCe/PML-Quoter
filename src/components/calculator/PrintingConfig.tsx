import Label from '../ui/Label'
import Select from '../ui/Select'
import type { PricingConfig } from '../../lib/pricing/types'

interface PrintingConfigProps {
  colours: number
  printAreaId: string
  pricing: PricingConfig
  onChange: (field: 'printColours' | 'printAreaId', value: number | string) => void
}

export default function PrintingConfig({ colours, printAreaId, pricing, onChange }: PrintingConfigProps) {
  return (
    <div className="mt-4 ml-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Printing Configuration</p>

      <div>
        <Label htmlFor="printColours">Number of Colours</Label>
        <Select
          id="printColours"
          value={colours}
          onChange={e => onChange('printColours', Number(e.target.value))}
        >
          {pricing.printColourRates.map(r => (
            <option key={r.colours} value={r.colours}>{r.label}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="printArea">Print Area / Size</Label>
        <Select
          id="printArea"
          value={printAreaId}
          onChange={e => onChange('printAreaId', e.target.value)}
        >
          {pricing.printAreaRates.map(r => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </Select>
      </div>
    </div>
  )
}
