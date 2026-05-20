import type { PrintColourRate, PrintAreaRate } from '../../lib/pricing/types'
import Input from '../ui/Input'
import Label from '../ui/Label'

interface PrintingRatesEditorProps {
  colourRates: PrintColourRate[]
  areaRates: PrintAreaRate[]
  onColourChange: (rates: PrintColourRate[]) => void
  onAreaChange: (rates: PrintAreaRate[]) => void
}

export default function PrintingRatesEditor({
  colourRates,
  areaRates,
  onColourChange,
  onAreaChange,
}: PrintingRatesEditorProps) {
  const updateColour = (index: number, rate: number) => {
    onColourChange(colourRates.map((r, i) => (i === index ? { ...r, ratePerUnit: rate } : r)))
  }

  const updateArea = (index: number, rate: number) => {
    onAreaChange(areaRates.map((r, i) => (i === index ? { ...r, ratePerUnit: rate } : r)))
  }

  return (
    <div className="space-y-6">
      <div>
        <Label>Colour Rates (LKR per unit)</Label>
        <div className="space-y-2 mt-2">
          {colourRates.map((r, i) => (
            <div key={r.colours} className="grid grid-cols-12 gap-2 items-center">
              <span className="col-span-6 text-sm text-gray-700">{r.label}</span>
              <Input
                className="col-span-4"
                type="number"
                step="0.001"
                value={r.ratePerUnit}
                onChange={e => updateColour(i, Number(e.target.value))}
              />
              <span className="col-span-2 text-xs text-gray-400">LKR/unit</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Print Area Rates (LKR per unit)</Label>
        <div className="space-y-2 mt-2">
          {areaRates.map((r, i) => (
            <div key={r.id} className="grid grid-cols-12 gap-2 items-center">
              <span className="col-span-6 text-sm text-gray-700">{r.label}</span>
              <Input
                className="col-span-4"
                type="number"
                step="0.001"
                value={r.ratePerUnit}
                onChange={e => updateArea(i, Number(e.target.value))}
              />
              <span className="col-span-2 text-xs text-gray-400">LKR/unit</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
