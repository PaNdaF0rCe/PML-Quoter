import type { QuoteBreakdown } from '../../lib/pricing/types'
import Card from '../ui/Card'

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface QuoteSummaryProps {
  quote: QuoteBreakdown
}

export default function QuoteSummary({ quote }: QuoteSummaryProps) {
  const rows: { label: string; value: string; sub?: boolean }[] = [
    { label: 'Requested Quantity', value: quote.requestedQty.toLocaleString() },
    { label: 'Costing Tier Used', value: quote.costingQty.toLocaleString(), sub: true },
    { label: 'Base Price', value: `LKR ${fmt(quote.basePrice)}` },
    ...(quote.printingCost > 0 ? [{ label: 'Printing Cost', value: `LKR ${fmt(quote.printingCost)}` }] : []),
    ...(quote.materialCost > 0 ? [{ label: 'Material Cost', value: `LKR ${fmt(quote.materialCost)}` }] : []),
    ...(quote.addOnCosts.dieCutting > 0 ? [{ label: 'Die Cutting', value: `LKR ${fmt(quote.addOnCosts.dieCutting)}` }] : []),
    ...(quote.addOnCosts.sidePasting > 0 ? [{ label: 'Side Pasting', value: `LKR ${fmt(quote.addOnCosts.sidePasting)}` }] : []),
    ...(quote.addOnCosts.packagingDelivery > 0 ? [{ label: 'Packaging & Delivery', value: `LKR ${fmt(quote.addOnCosts.packagingDelivery)}` }] : []),
    { label: 'Labour Charge', value: `LKR ${fmt(quote.labourCharge)}` },
  ]

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <h2 className="text-lg font-bold text-blue-900 mb-4">Quote Summary</h2>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
            <span className={`text-sm ${row.sub ? 'text-gray-500 pl-2 italic' : 'text-gray-700'}`}>
              {row.label}
            </span>
            <span className={`text-sm font-medium ${row.sub ? 'text-gray-500' : 'text-gray-900'}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t-2 border-blue-300 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-blue-900">Estimated Total</span>
          <span className="text-xl font-bold text-blue-700">LKR {fmt(quote.total)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Per Unit Price</span>
          <span className="text-base font-semibold text-gray-800">LKR {fmt(quote.perUnit)}</span>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400 italic">
        * This is an estimate based on the costing tier. Final price may vary.
      </p>
    </Card>
  )
}
