import { useState, useEffect } from 'react'
import type { QuoteInput, QuoteBreakdown, PricingConfig, MaterialOption } from '../../lib/pricing/types'
import { calculateQuote } from '../../lib/pricing/calculate'
import Label from '../ui/Label'
import Select from '../ui/Select'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Card from '../ui/Card'
import PrintingConfig from './PrintingConfig'
import QuoteSummary from './QuoteSummary'

const defaultInput = (pricing: PricingConfig): QuoteInput => ({
  reelSizeId: pricing.reelSizes[0]?.id ?? '',
  requestedQty: 2000,
  printing: false,
  printColours: pricing.printColourRates[0]?.colours ?? 1,
  printAreaId: pricing.printAreaRates[0]?.id ?? '',
  material: '',
  dieCutting: false,
  sidePasting: false,
  packagingDelivery: false,
})

interface CalculatorFormProps {
  pricing: PricingConfig
}

export default function CalculatorForm({ pricing }: CalculatorFormProps) {
  const [input, setInput] = useState<QuoteInput>(() => defaultInput(pricing))
  const [quote, setQuote] = useState<QuoteBreakdown | null>(null)

  useEffect(() => {
    setInput(defaultInput(pricing))
  }, [pricing])

  // Recalculate live on every input change
  useEffect(() => {
    setQuote(calculateQuote(input, pricing))
  }, [input, pricing])

  const set = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => {
    setInput(prev => ({ ...prev, [key]: value }))
  }

  const handlePrintingChange = (field: 'printColours' | 'printAreaId', value: number | string) => {
    if (field === 'printColours') set('printColours', value as number)
    else set('printAreaId', value as string)
  }

  const handleMaterial = (m: MaterialOption) => {
    set('material', input.material === m ? '' : m)
  }

  const handleReset = () => {
    setInput(defaultInput(pricing))
  }

  return (
    <div className="space-y-6">
      <Card title="Order Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reelSize">Reel Size</Label>
            <Select
              id="reelSize"
              value={input.reelSizeId}
              onChange={e => set('reelSizeId', e.target.value)}
            >
              {pricing.reelSizes.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="requestedQty">Requested Quantity</Label>
            <Input
              id="requestedQty"
              type="number"
              min={1}
              value={input.requestedQty}
              onChange={e => set('requestedQty', Math.max(1, Number(e.target.value)))}
            />
            {input.requestedQty > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Costing tier:{' '}
                <strong>
                  {(() => {
                    const sorted = [...pricing.quantityTiers].sort((a, b) => a.qty - b.qty)
                    const match = sorted.find(t => t.qty >= input.requestedQty)
                    return match ? match.qty.toLocaleString() : sorted[sorted.length - 1].qty.toLocaleString()
                  })()}
                </strong>
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card title="Material">
        <p className="text-sm text-gray-500 mb-3">Select one material option (optional)</p>
        <div className="flex flex-wrap gap-3">
          {(
            [
              { key: 'twoply', label: '2 Ply' },
              { key: 'threeply', label: '3 Ply' },
              { key: 'lamination', label: 'Lamination' },
            ] as { key: MaterialOption; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleMaterial(key)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                input.material === key
                  ? 'bg-blue-700 border-blue-700 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Printing">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="printing"
            checked={input.printing}
            onChange={e => set('printing', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-500"
          />
          <label htmlFor="printing" className="text-sm font-medium text-gray-700 cursor-pointer">
            Include Printing
          </label>
        </div>

        {input.printing && (
          <PrintingConfig
            colours={input.printColours}
            printAreaId={input.printAreaId}
            pricing={pricing}
            onChange={handlePrintingChange}
          />
        )}
      </Card>

      <Card title="Add-ons">
        <div className="space-y-3">
          {(
            [
              { key: 'dieCutting', label: 'Die Cutting', description: 'Per-unit rate applied to costing qty' },
              { key: 'sidePasting', label: 'Side Pasting', description: 'Per-unit rate applied to costing qty' },
              { key: 'packagingDelivery', label: 'Packaging & Delivery', description: 'Per-unit rate applied to costing qty' },
            ] as { key: 'dieCutting' | 'sidePasting' | 'packagingDelivery'; label: string; description: string }[]
          ).map(({ key, label, description }) => (
            <div key={key} className="flex items-start gap-3">
              <input
                type="checkbox"
                id={key}
                checked={input[key]}
                onChange={e => set(key, e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-500"
              />
              <label htmlFor={key} className="cursor-pointer">
                <span className="block text-sm font-medium text-gray-700">{label}</span>
                <span className="block text-xs text-gray-400">{description}</span>
              </label>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleReset} variant="secondary" size="md">
          Reset
        </Button>
      </div>

      {quote && <QuoteSummary quote={quote} />}
    </div>
  )
}
