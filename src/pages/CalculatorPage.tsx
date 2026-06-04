import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePricing } from '../context/PricingContext'
import Card from '../components/ui/Card'
import Label from '../components/ui/Label'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { calculateQuote, fmtRs, generateQuotationNumber, todayIso, futureIso } from '../utils/calculateQuote'
import { generateQuotationPdf } from '../utils/generateQuotationPdf'
import { saveQuote, updateSavedQuote, getQuote } from '../firebase/quotes'
import type { CustomerDetails, QuoteInput, QuoteResult, MaterialId, BoardType, BoardGsm, LaminateType } from '../lib/pricingTypes'
import { MATERIAL_LABELS, BOARD_TYPE_LABELS, BOARD_GSM_OPTIONS, LAMINATE_LABELS, COLOUR_OPTIONS } from '../lib/pricingTypes'

// ─── Defaults ────────────────────────────────────────────────────────────────

const defaultCustomer = (): CustomerDetails => ({
  customerName: '',
  customerPhone: '',
  customerCompany: '',
  customerAddress: '',
  quotationTitle: '',
  quotationNumber: generateQuotationNumber(),
  quotationDate: todayIso(),
  validUntil: futureIso(14),
  notes: '',
})

const defaultInput: QuoteInput = {
  length: 0,
  width: 0,
  quantity: 0,
  material: '2ply_brown',
  board: 'none',
  boardGsm: 250,
  printing: false,
  colourCount: 1,
  varnish: false,
  dieCutting: false,
  eFluteLamination: false,
  pasting: false,
  laminateType: 'none',
  foilingPerUnit: 0,
  adjustmentPct: 0,
  adjustmentRs: 0,
  roundTo: 0,
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function CostRow({ label, value, highlight, muted }: {
  label: string; value: string; highlight?: boolean; muted?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0`}>
      <span className={`text-sm ${highlight ? 'font-semibold text-gray-900' : muted ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
      </span>
      <span className={`text-sm tabular-nums ${highlight ? 'font-semibold text-gray-900' : muted ? 'text-gray-400' : 'text-gray-700'}`}>
        {value}
      </span>
    </div>
  )
}

function AddonCheckbox({
  id, label, note, checked, onChange, locked,
}: {
  id: string; label: string; note: string; checked: boolean
  onChange: (v: boolean) => void; locked?: boolean
}) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
        locked
          ? 'border-red-300 bg-red-50 cursor-not-allowed'
          : 'border-gray-200 hover:border-red-300 hover:bg-red-50 cursor-pointer'
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => !locked && onChange(e.target.checked)}
        disabled={locked}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-700 focus:ring-red-500 disabled:opacity-60"
      />
      <span>
        <span className="block text-sm font-medium text-gray-800">{label}</span>
        <span className={`block text-xs mt-0.5 ${locked ? 'text-red-600 font-medium' : 'text-gray-400'}`}>{note}</span>
      </span>
    </label>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CalculatorPage() {
  const { id: savedId } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { pricing, loading, error } = usePricing()

  const [customer, setCustomer] = useState<CustomerDetails>(defaultCustomer)
  const [input, setInput] = useState<QuoteInput>(defaultInput)
  const [quote, setQuote] = useState<QuoteResult | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(savedId ?? null)
  const [showCustomer, setShowCustomer] = useState(true)
  const [foilingEnabled, setFoilingEnabled] = useState(false)

  // Load saved quote if URL has an ID
  useEffect(() => {
    if (savedId) {
      getQuote(savedId).then(q => {
        if (q) {
          setCustomer(q.customer)
          setInput(q.input)
          setFoilingEnabled(q.input.foilingPerUnit > 0)
          setCurrentSavedId(savedId)
        }
      })
    }
  }, [savedId])

  // Live calculation
  useEffect(() => {
    setQuote(calculateQuote(input, pricing))
  }, [input, pricing])

  const setIn = useCallback(<K extends keyof QuoteInput>(k: K, v: QuoteInput[K]) => {
    setInput(p => ({ ...p, [k]: v }))
  }, [])

  const setCust = useCallback(<K extends keyof CustomerDetails>(k: K, v: CustomerDetails[K]) => {
    setCustomer(p => ({ ...p, [k]: v }))
  }, [])

  const handlePrintingChange = (checked: boolean) => {
    setIn('printing', checked)
  }

  const handleReset = () => {
    setCustomer(defaultCustomer())
    setInput(defaultInput)
    setCurrentSavedId(null)
    navigate('/calculator', { replace: true })
  }

  const handleSave = async () => {
    if (!quote) return
    setSaving(true)
    setSavedMsg('')
    try {
      if (currentSavedId) {
        await updateSavedQuote(currentSavedId, customer, input, quote)
        setSavedMsg('Quote updated.')
      } else {
        const newId = await saveQuote(customer, input, quote)
        setCurrentSavedId(newId)
        navigate(`/calculator/${newId}`, { replace: true })
        setSavedMsg('Quote saved.')
      }
    } catch (e) {
      console.error('Save failed:', e)
      setSavedMsg('Save failed — check console.')
    } finally {
      setSaving(false)
      setTimeout(() => setSavedMsg(''), 3000)
    }
  }

  const handleDownloadPdf = async () => {
    if (!quote) return
    setPdfLoading(true)
    try {
      await generateQuotationPdf(customer, input, quote, pricing)
    } catch (e) {
      console.error('PDF generation failed:', e)
      alert('PDF generation failed. Please try again.')
    } finally {
      setPdfLoading(false)
    }
  }

  const isValid = input.length > 0 && input.width > 0 && input.quantity > 0
  const boardRequired = input.printing && input.board === 'none'

  const addonNote = (rate: number, unit: string) => `Rs. ${rate} per ${unit}`
  const laminateNote = (type: LaminateType) => {
    if (type === 'none') return ''
    const rates: Record<string, number> = {
      hot: pricing.addons.hotLaminatePerSqIn,
      cold: pricing.addons.coldLaminatePerSqIn,
      uv: pricing.addons.uvLaminatePerSqIn,
    }
    return `Rs. ${rates[type]}/in²`
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.webp" alt="Pack Me Lanka" className="h-12 w-auto" />
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1">
              ← Quotes
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {currentSavedId && (
              <span className="text-xs text-gray-400 italic">ID: {currentSavedId.slice(0, 8)}…</span>
            )}
            {user ? (
              <Link to="/admin" className="text-xs bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-red-800 transition-colors">
                Admin
              </Link>
            ) : (
              <Link to="/admin/login" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-6 pb-28 lg:pb-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
        )}
        {loading && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full" />
            Loading pricing…
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-5">

            {/* Customer & Quotation Details */}
            <Card>
              <button
                type="button"
                onClick={() => setShowCustomer(p => !p)}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="font-semibold text-gray-800">Customer & Quotation Details</h3>
                <span className="text-gray-400 text-lg">{showCustomer ? '▲' : '▼'}</span>
              </button>

              {showCustomer && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="qNum">Quotation Number *</Label>
                      <Input id="qNum" value={customer.quotationNumber} onChange={e => setCust('quotationNumber', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="qTitle">Product / Job Name</Label>
                      <Input id="qTitle" value={customer.quotationTitle} onChange={e => setCust('quotationTitle', e.target.value)} placeholder="e.g. Cheese Box 200g" />
                    </div>
                    <div>
                      <Label htmlFor="qDate">Quotation Date *</Label>
                      <Input id="qDate" type="date" value={customer.quotationDate} onChange={e => setCust('quotationDate', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="qValid">Valid Until</Label>
                      <Input id="qValid" type="date" value={customer.validUntil} onChange={e => setCust('validUntil', e.target.value)} />
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Customer Information (optional)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="cName">Customer Name</Label>
                        <Input id="cName" value={customer.customerName} onChange={e => setCust('customerName', e.target.value)} placeholder="Full name" />
                      </div>
                      <div>
                        <Label htmlFor="cPhone">Phone</Label>
                        <Input id="cPhone" value={customer.customerPhone} onChange={e => setCust('customerPhone', e.target.value)} placeholder="07X XXX XXXX" />
                      </div>
                      <div>
                        <Label htmlFor="cCompany">Company</Label>
                        <Input id="cCompany" value={customer.customerCompany} onChange={e => setCust('customerCompany', e.target.value)} placeholder="Company name" />
                      </div>
                      <div>
                        <Label htmlFor="cAddress">Address</Label>
                        <Input id="cAddress" value={customer.customerAddress} onChange={e => setCust('customerAddress', e.target.value)} placeholder="City / address" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes / Special Instructions</Label>
                    <textarea
                      id="notes"
                      rows={2}
                      value={customer.notes}
                      onChange={e => setCust('notes', e.target.value)}
                      placeholder="Any special production instructions…"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Costing Inputs */}
            <Card title="Dimensions & Quantity">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="len">Length (in)</Label>
                  <Input
                    id="len"
                    type="number"
                    min={0}
                    step={0.5}
                    value={input.length || ''}
                    onChange={e => setIn('length', Math.max(0, Number(e.target.value)))}
                    placeholder="e.g. 15"
                  />
                  {!input.length && <p className="mt-1 text-xs text-red-600">Required</p>}
                </div>
                <div>
                  <Label htmlFor="wid">Width (in)</Label>
                  <Input
                    id="wid"
                    type="number"
                    min={0}
                    step={0.5}
                    value={input.width || ''}
                    onChange={e => setIn('width', Math.max(0, Number(e.target.value)))}
                    placeholder="e.g. 10"
                  />
                  {!input.width && <p className="mt-1 text-xs text-red-600">Required</p>}
                </div>
                <div>
                  <Label htmlFor="qty">Quantity</Label>
                  <Input
                    id="qty"
                    type="number"
                    min={0}
                    step={100}
                    value={input.quantity || ''}
                    onChange={e => setIn('quantity', Math.max(0, Number(e.target.value)))}
                    placeholder="e.g. 1000"
                  />
                  {!input.quantity && <p className="mt-1 text-xs text-red-600">Required</p>}
                </div>
              </div>
              {input.length > 0 && input.width > 0 && (
                <p className="mt-3 text-xs text-gray-500">
                  Area per unit: <strong>{(input.length * input.width).toLocaleString()} in²</strong>
                  {input.quantity > 0 && (
                    <span className="ml-2 text-gray-400">
                      · Total: {(input.length * input.width * input.quantity).toLocaleString()} in²
                    </span>
                  )}
                </p>
              )}
            </Card>

            {/* Material */}
            <Card title="Material">
              <div className="grid grid-cols-2 gap-2">
                {(['2ply_brown', '2ply_white', '3ply_brown', '3ply_white', '2ply_bflute', '3ply_bflute'] as Exclude<MaterialId, 'none'>[]).map(id => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setIn('material', id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      input.material === id
                        ? 'border-red-700 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-red-300'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-gray-900">{MATERIAL_LABELS[id]}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      Rs. {pricing.materials[id]}/in²
                    </span>
                    {(id === '2ply_brown' || id === '2ply_white') && (
                      <span className="block text-xs text-amber-600 mt-0.5">
                        +{pricing.surcharges.twoPlyPercentage}% if 2-ply only
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {/* Board Only — full-width option */}
              <button
                type="button"
                onClick={() => setIn('material', 'none')}
                className={`mt-2 w-full p-3 rounded-xl border-2 text-left transition-all ${
                  input.material === 'none'
                    ? 'border-red-700 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-red-300'
                }`}
              >
                <span className="text-sm font-semibold text-gray-900">Board Only</span>
                <span className="ml-2 text-xs text-gray-400">No 2/3 ply — board cost only</span>
              </button>
            </Card>

            {/* Board */}
            <Card title={input.printing ? 'Board (required for printing)' : 'Board (optional)'}>
              {boardRequired && (
                <div className="mb-3 flex items-center gap-2 p-2 bg-amber-50 border border-amber-300 rounded-lg">
                  <span className="text-amber-700 text-xs font-medium">
                    ⚠️ A board must be selected when printing is enabled.
                  </span>
                </div>
              )}

              {/* Row 1 — type selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* No Board option */}
                <button
                  type="button"
                  onClick={() => setIn('board', 'none')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    input.board === 'none'
                      ? 'border-red-700 bg-red-50'
                      : boardRequired
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-gray-200 bg-white hover:border-red-300'
                  }`}
                >
                  <span className="block text-sm font-semibold text-gray-900">No Board</span>
                  <span className="block text-xs text-gray-400 mt-0.5">No board cost</span>
                </button>

                {/* White Back / Grey Back / Ivory */}
                {(['white_back', 'grey_back', 'ivory'] as Exclude<BoardType, 'none'>[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setIn('board', type)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      input.board === type
                        ? 'border-red-700 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-red-300'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-gray-900">{BOARD_TYPE_LABELS[type]}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">
                      {input.boardGsm} GSM · Rs. {pricing.boards[type][input.boardGsm] ?? '—'}/in²
                    </span>
                  </button>
                ))}
              </div>

              {/* Row 2 — GSM selector (only when a type is chosen) */}
              {input.board !== 'none' && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">GSM weight</p>
                  <div className="flex flex-wrap gap-2">
                    {BOARD_GSM_OPTIONS.map(gsm => (
                      <button
                        key={gsm}
                        type="button"
                        onClick={() => setIn('boardGsm', gsm as BoardGsm)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          (input.boardGsm ?? 250) === gsm
                            ? 'bg-red-700 border-red-700 text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-red-400'
                        }`}
                      >
                        {gsm} GSM
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Printing & Add-ons */}
            <Card title="Printing & Add-ons">
              <div className="space-y-2">

                {/* Printing */}
                <div className={`rounded-xl border-2 transition-colors ${input.printing ? 'border-red-700 bg-red-50' : 'border-gray-200'}`}>
                  <label className="flex items-center gap-3 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={input.printing}
                      onChange={e => handlePrintingChange(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-red-700 focus:ring-red-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-800">Printing required</span>
                      <span className="block text-xs text-gray-400 mt-0.5">
                        {addonNote(pricing.addons.printingPerColour, 'colour per unit')}
                      </span>
                    </span>
                  </label>
                  {input.printing && (
                    <div className="px-4 pb-3 space-y-2">
                      <Label>Number of colours</Label>
                      <div className="flex flex-wrap items-center gap-2">
                        {COLOUR_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setIn('colourCount', opt.value)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                              input.colourCount === opt.value
                                ? 'bg-red-700 border-red-700 text-white'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-red-400'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                        {/* Custom colour count */}
                        <div className="flex items-center gap-1.5 ml-1">
                          <span className={`text-xs font-medium ${
                            !COLOUR_OPTIONS.some(o => o.value === input.colourCount)
                              ? 'text-red-700' : 'text-gray-400'
                          }`}>Other:</span>
                          <input
                            type="number"
                            min={1} max={99} step={1}
                            placeholder="5+"
                            value={COLOUR_OPTIONS.some(o => o.value === input.colourCount) ? '' : input.colourCount}
                            onChange={e => {
                              const v = parseInt(e.target.value, 10)
                              if (!isNaN(v) && v > 0) setIn('colourCount', v)
                            }}
                            className={`w-16 rounded-lg border px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                              !COLOUR_OPTIONS.some(o => o.value === input.colourCount)
                                ? 'border-red-700 bg-red-50 text-red-700 font-medium'
                                : 'border-gray-300 text-gray-600'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <AddonCheckbox
                  id="varnish"
                  label="Varnish"
                  checked={input.varnish}
                  onChange={v => setIn('varnish', v)}
                  note={addonNote(pricing.addons.varnishPerUnit, 'unit')}
                />

                <AddonCheckbox
                  id="dieCutting"
                  label="Die Cutting"
                  checked={input.dieCutting}
                  onChange={v => setIn('dieCutting', v)}
                  note={addonNote(pricing.addons.dieCutterPerPunch, 'punch/unit')}
                />

                <AddonCheckbox
                  id="eFluteLamination"
                  label="E-Flute Lamination"
                  checked={input.eFluteLamination}
                  onChange={v => setIn('eFluteLamination', v)}
                  note={addonNote(pricing.addons.eFluteLaminatePerSqIn, 'in²')}
                />

                <AddonCheckbox
                  id="pasting"
                  label="Side Pasting"
                  checked={input.pasting}
                  onChange={v => setIn('pasting', v)}
                  note={addonNote(pricing.addons.pastingPerUnit, 'unit')}
                />
              </div>
            </Card>

            {/* External Costs */}
            <Card title="External Costs">
              <div className="space-y-2">

                {/* External Laminate — toggle, then choose type */}
                <div className={`rounded-xl border-2 transition-colors ${
                  input.laminateType !== 'none' ? 'border-red-700 bg-red-50' : 'border-gray-200'
                }`}>
                  <label className="flex items-center gap-3 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={input.laminateType !== 'none'}
                      onChange={e => setIn('laminateType', e.target.checked ? 'hot' : 'none')}
                      className="h-4 w-4 rounded border-gray-300 text-red-700 focus:ring-red-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-800">External Laminate</span>
                      <span className="block text-xs text-gray-400 mt-0.5">
                        {input.laminateType !== 'none'
                          ? laminateNote(input.laminateType)
                          : 'Hot / Cold / UV coating on the finished sheet'}
                      </span>
                    </span>
                  </label>
                  {input.laminateType !== 'none' && (
                    <div className="px-3 pb-3">
                      <div className="grid grid-cols-3 gap-2">
                        {(['hot', 'cold', 'uv'] as Exclude<LaminateType, 'none'>[]).map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setIn('laminateType', type)}
                            className={`p-2 rounded-lg border-2 text-center transition-all ${
                              input.laminateType === type
                                ? 'border-red-700 bg-white'
                                : 'border-gray-200 bg-white hover:border-red-300'
                            }`}
                          >
                            <span className="block text-xs font-semibold text-gray-900">{LAMINATE_LABELS[type]}</span>
                            <span className="block text-xs text-gray-400 mt-0.5">{laminateNote(type)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Foiling — toggle, then enter per-unit cost */}
                <div className={`rounded-xl border-2 transition-colors ${
                  foilingEnabled ? 'border-red-700 bg-red-50' : 'border-gray-200'
                }`}>
                  <label className="flex items-center gap-3 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={foilingEnabled}
                      onChange={e => {
                        setFoilingEnabled(e.target.checked)
                        if (!e.target.checked) setIn('foilingPerUnit', 0)
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-red-700 focus:ring-red-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-800">Foiling</span>
                      <span className="block text-xs text-gray-400 mt-0.5">
                        {foilingEnabled && input.foilingPerUnit > 0 && input.quantity > 0
                          ? `Rs. ${input.foilingPerUnit}/unit × ${input.quantity.toLocaleString()} = ${fmtRs(input.foilingPerUnit * input.quantity)}`
                          : 'Enter cost per unit'}
                      </span>
                    </span>
                  </label>
                  {foilingEnabled && (
                    <div className="px-3 pb-3 space-y-1">
                      <Label htmlFor="foilingPerUnit">Cost per unit (Rs)</Label>
                      <Input
                        id="foilingPerUnit"
                        type="number"
                        min={0}
                        step={1}
                        value={input.foilingPerUnit || ''}
                        onChange={e => setIn('foilingPerUnit', Math.max(0, Number(e.target.value)))}
                        placeholder="e.g. 25.00"
                      />
                      {input.quantity > 0 && input.foilingPerUnit > 0 && (
                        <p className="text-xs text-gray-500">
                          Total: <strong>{fmtRs(input.foilingPerUnit * input.quantity)}</strong>
                          <span className="text-gray-400"> ({input.quantity.toLocaleString()} units)</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </Card>

            {/* Price Adjustment */}
            <Card title="Price Adjustment">
              <p className="text-xs text-gray-400 mb-4">
                Fine-tune the final price before quoting. Not shown on the customer PDF.
              </p>
              <div className="space-y-4">

                {/* Percentage tweak */}
                <div>
                  <Label>Percentage Adjustment</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      step={0.5}
                      value={input.adjustmentPct ?? ''}
                      onChange={e => setIn('adjustmentPct', Number(e.target.value))}
                      placeholder="0"
                      className="w-24 text-center"
                    />
                    <span className="text-sm text-gray-500">%</span>
                    {(input.adjustmentPct ?? 0) !== 0 && isValid && quote && (
                      <span className={`text-sm tabular-nums ${quote.adjustmentPctAmount >= 0 ? 'text-gray-600' : 'text-red-600'}`}>
                        {quote.adjustmentPctAmount >= 0 ? '+' : ''}{fmtRs(quote.adjustmentPctAmount)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Positive = mark up · Negative = discount</p>
                </div>

                {/* Flat Rs tweak */}
                <div>
                  <Label>Flat Adjustment (Rs)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      step={100}
                      value={input.adjustmentRs ?? ''}
                      onChange={e => setIn('adjustmentRs', Number(e.target.value))}
                      placeholder="0"
                      className="w-36"
                    />
                    {(input.adjustmentRs ?? 0) !== 0 && isValid && (
                      <span className={`text-sm tabular-nums ${(input.adjustmentRs ?? 0) >= 0 ? 'text-gray-600' : 'text-red-600'}`}>
                        {(input.adjustmentRs ?? 0) >= 0 ? '+' : ''}{fmtRs(input.adjustmentRs ?? 0)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Positive = add · Negative = subtract</p>
                </div>

                {/* Round to nearest */}
                <div>
                  <Label>Round to Nearest</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[
                      { value: 0, label: 'Off' },
                      { value: 1, label: 'Whole number' },
                      { value: 5, label: 'Nearest 5' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setIn('roundTo', value)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          input.roundTo === value
                            ? 'bg-red-700 border-red-700 text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-red-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </Card>

          </div>

          {/* ── RIGHT COLUMN — live summary ─────────────────────────────────── */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-6 space-y-4">

              {!isValid && (
                <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 text-center text-gray-400 text-sm">
                  Enter dimensions and quantity to see your quotation.
                </div>
              )}

              {isValid && quote && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Summary header */}
                  <div className="bg-red-700 px-5 py-4">
                    <p className="text-white text-xs font-semibold uppercase tracking-wide">Quotation Summary</p>
                    <p className="text-white text-3xl font-bold mt-1">{fmtRs(quote.total)}</p>
                    <p className="text-red-200 text-sm mt-0.5">
                      {fmtRs(quote.perUnitPrice)} per unit · {input.quantity.toLocaleString()} units
                    </p>
                  </div>

                  {/* Cost breakdown */}
                  <div className="px-5 py-4 space-y-0.5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Cost Breakdown</p>
                    {quote.materialCost > 0 && (
                      <CostRow label={`Material — ${MATERIAL_LABELS[input.material]}`} value={fmtRs(quote.materialCost)} />
                    )}
                    {quote.boardCost > 0 && (
                      <CostRow label={`Board — ${BOARD_TYPE_LABELS[input.board]} ${input.boardGsm ?? 250} GSM`} value={fmtRs(quote.boardCost)} />
                    )}
                    {quote.printingCost > 0 && (
                      <CostRow label={`Printing (${input.colourCount} colour${input.colourCount > 1 ? 's' : ''})`} value={fmtRs(quote.printingCost)} />
                    )}
                    {quote.varnishCost > 0 && <CostRow label="Varnish" value={fmtRs(quote.varnishCost)} />}
                    {quote.dieCuttingCost > 0 && <CostRow label="Die Cutting" value={fmtRs(quote.dieCuttingCost)} />}
                    {quote.eFluteLaminateCost > 0 && <CostRow label="E-Flute Lamination" value={fmtRs(quote.eFluteLaminateCost)} />}
                    {quote.pastingCost > 0 && <CostRow label="Side Pasting" value={fmtRs(quote.pastingCost)} />}
                    <CostRow label="Packing & Delivery" value={fmtRs(quote.packingDeliveryCost)} />
                  </div>

                  {/* Totals */}
                  <div className="px-5 pb-2 space-y-0.5">
                    <div className="border-t border-gray-200 pt-3 space-y-0.5">
                      <CostRow label="Subtotal" value={fmtRs(quote.subtotal)} highlight />
                      {quote.isTwoPly && (
                        <CostRow
                          label={`2 Ply Surcharge (${quote.twoPlyPercentage}%)`}
                          value={fmtRs(quote.twoPlySurcharge)}
                        />
                      )}
                    </div>
                    {/* External costs */}
                    {(quote.externalLaminateCost > 0 || quote.foilingCost > 0) && (
                      <div className="border-t border-dashed border-gray-200 pt-2 space-y-0.5">
                        <p className="text-xs text-gray-400 uppercase tracking-wide pt-1 pb-0.5">External Costs</p>
                        {quote.externalLaminateCost > 0 && (
                          <CostRow label={LAMINATE_LABELS[input.laminateType]} value={fmtRs(quote.externalLaminateCost)} />
                        )}
                        {quote.foilingCost > 0 && (
                          <CostRow label="Foiling" value={fmtRs(quote.foilingCost)} />
                        )}
                      </div>
                    )}
                    {/* Price adjustments */}
                    {(quote.adjustmentPctAmount !== 0 || quote.adjustmentRsAmount !== 0 || input.roundTo > 0) && (
                      <>
                        <div className="border-t border-dashed border-gray-200 pt-2">
                          <CostRow label="Base Total" value={fmtRs(quote.baseTotal)} highlight />
                        </div>
                        <div className="border-t border-dashed border-gray-200 pt-2 space-y-0.5">
                          <p className="text-xs text-gray-400 uppercase tracking-wide pt-1 pb-0.5">Price Adjustment</p>
                          {quote.adjustmentPctAmount !== 0 && (
                            <CostRow
                              label={`${(input.adjustmentPct ?? 0) > 0 ? '+' : ''}${input.adjustmentPct ?? 0}%`}
                              value={(quote.adjustmentPctAmount >= 0 ? '+' : '') + fmtRs(quote.adjustmentPctAmount)}
                            />
                          )}
                          {quote.adjustmentRsAmount !== 0 && (
                            <CostRow
                              label="Flat adjustment"
                              value={(quote.adjustmentRsAmount >= 0 ? '+' : '') + fmtRs(quote.adjustmentRsAmount)}
                            />
                          )}
                          {input.roundTo > 0 && (
                            <CostRow
                              label={input.roundTo === 1 ? 'Rounded to whole number' : `Rounded to nearest ${input.roundTo}`}
                              value=""
                              muted
                            />
                          )}
                        </div>
                      </>
                    )}
                    <div className="border-t-2 border-red-200 pt-3 flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">Final Total</span>
                      <span className="text-xl font-bold text-red-700">{fmtRs(quote.total)}</span>
                    </div>
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-sm text-gray-500">Per Unit Price</span>
                      <span className="text-sm font-semibold text-gray-800">{fmtRs(quote.perUnitPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-sm text-gray-500">Total Area</span>
                      <span className="text-sm font-semibold text-gray-800">{quote.totalArea.toLocaleString()} in²</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 pb-5 space-y-2 border-t border-gray-100 pt-4">
                    {/* Save */}
                    <Button
                      onClick={handleSave}
                      disabled={saving || !isValid}
                      className="w-full"
                      size="lg"
                    >
                      {saving ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          Saving…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          {currentSavedId ? 'Update Quote' : 'Save Quote'}
                        </span>
                      )}
                    </Button>
                    {savedMsg && (
                      <p className={`text-xs text-center font-medium ${savedMsg.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
                        {savedMsg}
                      </p>
                    )}
                    {/* PDF */}
                    <Button
                      onClick={handleDownloadPdf}
                      disabled={pdfLoading || !isValid}
                      variant="secondary"
                      className="w-full"
                      size="lg"
                    >
                      {pdfLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full" />
                          Generating PDF…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download PDF Quotation
                        </span>
                      )}
                    </Button>
                    <Button onClick={handleReset} variant="secondary" className="w-full" size="md">
                      New Quote
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick reference (when no valid input yet) */}
              {!isValid && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Reference — Material Rates</p>
                  <div className="space-y-1.5">
                    {(['2ply_brown', '2ply_white', '3ply_brown', '3ply_white', '2ply_bflute', '3ply_bflute'] as Exclude<MaterialId, 'none'>[]).map(id => (
                      <div key={id} className="flex justify-between text-xs">
                        <span className="text-gray-600">{MATERIAL_LABELS[id]}</span>
                        <span className="text-gray-900 font-medium">Rs. {pricing.materials[id]}/in²</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* ── Mobile sticky bottom bar ── */}
      {isValid && quote && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 shadow-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Total */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 leading-none">Total</p>
              <p className="text-xl font-bold text-red-700 leading-tight">{fmtRs(quote.total)}</p>
              <p className="text-xs text-gray-400 leading-none mt-0.5">{fmtRs(quote.perUnitPrice)}/unit</p>
            </div>
            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-700 text-white text-xs font-semibold rounded-lg hover:bg-red-800 transition-colors disabled:opacity-60 shrink-0"
            >
              {saving
                ? <span className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
                : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              }
              {currentSavedId ? 'Update' : 'Save'}
            </button>
            {/* PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-white text-xs font-semibold rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-60 shrink-0"
            >
              {pdfLoading
                ? <span className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
                : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              }
              PDF
            </button>
          </div>
          {savedMsg && (
            <p className={`text-xs mt-1 text-center font-medium ${savedMsg.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
              {savedMsg}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
