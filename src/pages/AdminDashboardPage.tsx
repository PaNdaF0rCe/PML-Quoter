import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
const logo = '/logo.webp'
import { usePricing } from '../context/PricingContext'
import { defaultPricing } from '../data/defaults/pricing'
import type { PricingConfig, SpecialRateCompany, SpecialRateItem } from '../lib/pricingTypes'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import SeedButton from '../components/admin/SeedButton'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="px-4 sm:px-6 py-5">{children}</div>
    </div>
  )
}

interface FieldProps {
  label: string
  hint?: string
  value: number
  step?: number
  min?: number
  onChange: (v: number) => void
}

function RateField({ label, hint, value, step = 0.001, min = 0, onChange }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
        {hint && <span className="ml-1 text-gray-400 font-normal">{hint}</span>}
      </label>
      <Input
        type="number"
        step={step}
        min={min}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  )
}

interface TextFieldProps {
  label: string
  value: string
  multiline?: boolean
  onChange: (v: string) => void
}

function TextField({ label, value, multiline = false, onChange }: TextFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
        />
      ) : (
        <Input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { logout, user } = useAuth()
  const { pricing, update, reload } = usePricing()
  const [local, setLocal] = useState<PricingConfig>(pricing)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  // Sync when context pricing changes (e.g. after reload/seed)
  useEffect(() => { setLocal(pricing) }, [pricing])

  const handleSave = async () => {
    setSaving(true)
    setSavedMsg('')
    try {
      await update(local)
      setSavedMsg('Settings saved to Firestore.')
    } catch {
      setSavedMsg('Save failed — check console.')
    } finally {
      setSaving(false)
      setTimeout(() => setSavedMsg(''), 3000)
    }
  }

  const handleReset = () => {
    if (!window.confirm('Reset all settings to factory defaults? This will NOT save automatically.')) return
    setLocal(defaultPricing)
    setSavedMsg('Defaults loaded — click Save Changes to persist.')
    setTimeout(() => setSavedMsg(''), 4000)
  }

  const setMaterial = (key: keyof typeof local.materials, v: number) =>
    setLocal(p => ({ ...p, materials: { ...p.materials, [key]: v } }))

  const setBoard = (type: 'white_back' | 'grey_back' | 'ivory', gsm: 250 | 300 | 350 | 400, v: number) =>
    setLocal(p => ({ ...p, boards: { ...p.boards, [type]: { ...p.boards[type], [gsm]: v } } }))

  const setAddon = (key: keyof typeof local.addons, v: number) =>
    setLocal(p => ({ ...p, addons: { ...p.addons, [key]: v } }))

  const setTax = (key: 'ssclPercentage' | 'vatPercentage', v: number) =>
    setLocal(p => ({ ...p, taxes: { ...p.taxes, [key]: v } }))

  const setCompany = (key: keyof typeof local.company, v: string) =>
    setLocal(p => ({ ...p, company: { ...p.company, [key]: v } }))

  // ── Special rate companies ──
  const specialRates: SpecialRateCompany[] = (() => {
    if (local.specialRates && local.specialRates.length > 0) return local.specialRates
    return defaultPricing.specialRates!
  })()

  const setSpecialRates = (companies: SpecialRateCompany[]) =>
    setLocal(p => ({ ...p, specialRates: companies }))

  const updateCompanyName = (id: string, name: string) =>
    setSpecialRates(specialRates.map(c => c.id === id ? { ...c, name } : c))

  const updateCompanyRates = (id: string, rates: SpecialRateItem[]) =>
    setSpecialRates(specialRates.map(c => c.id === id ? { ...c, rates } : c))

  const removeCompany = (id: string) =>
    setSpecialRates(specialRates.filter(c => c.id !== id))

  // New company form state
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanyRates, setNewCompanyRates] = useState<SpecialRateItem[]>([{ label: '', rate: 0 }])

  const addRateRow = () => setNewCompanyRates(r => [...r, { label: '', rate: 0 }])
  const updateNewRate = (i: number, field: keyof SpecialRateItem, value: string | number) =>
    setNewCompanyRates(r => r.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  const removeNewRateRow = (i: number) =>
    setNewCompanyRates(r => r.filter((_, idx) => idx !== i))

  const addCompany = async () => {
    if (!newCompanyName.trim()) return
    const id = newCompanyName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const rates = newCompanyRates.filter(r => r.label.trim())
    const newCompanies = [...specialRates, { id, name: newCompanyName.trim(), rates }]
    const newLocal = { ...local, specialRates: newCompanies }
    setLocal(newLocal)
    setNewCompanyName('')
    setNewCompanyRates([{ label: '', rate: 0 }])
    setSaving(true)
    setSavedMsg('')
    try {
      await update(newLocal)
      setSavedMsg('Company added and saved.')
    } catch {
      setSavedMsg('Added locally — click Save Changes to persist.')
    } finally {
      setSaving(false)
      setTimeout(() => setSavedMsg(''), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Pack Me Lanka" className="h-10 w-auto" />
            <div>
              <p className="text-xs font-semibold text-gray-800 leading-none">Admin Dashboard</p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
            >
              ← Calculator
            </Link>
            <Button variant="secondary" size="sm" onClick={() => logout()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Top actions ── */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Pricing &amp; Settings</h2>
          <SeedButton onSeeded={() => reload()} />
        </div>

        {/* ── 1. Material Rates ── */}
        <SectionCard title="Material Rates (Rs per in²)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RateField
              label="2 Ply Brown"
              value={local.materials['2ply_brown']}
              onChange={v => setMaterial('2ply_brown', v)}
            />
            <RateField
              label="2 Ply White"
              value={local.materials['2ply_white']}
              onChange={v => setMaterial('2ply_white', v)}
            />
            <RateField
              label="3 Ply Brown"
              value={local.materials['3ply_brown']}
              onChange={v => setMaterial('3ply_brown', v)}
            />
            <RateField
              label="3 Ply White"
              value={local.materials['3ply_white']}
              onChange={v => setMaterial('3ply_white', v)}
            />
            <RateField
              label="2 Ply B-Flute"
              value={local.materials['2ply_bflute']}
              onChange={v => setMaterial('2ply_bflute', v)}
            />
            <RateField
              label="3 Ply B-Flute"
              value={local.materials['3ply_bflute']}
              onChange={v => setMaterial('3ply_bflute', v)}
            />
          </div>
        </SectionCard>

        {/* ── 2. Board Rates ── */}
        <SectionCard title="Board Rates (Rs per in²)">
          {(['white_back', 'grey_back', 'ivory'] as const).map(type => (
            <div key={type} className="mb-5 last:mb-0">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                {type === 'white_back' ? 'White Back' : type === 'grey_back' ? 'Grey Back' : 'Ivory'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([250, 300, 350, 400] as const).map(gsm => (
                  <RateField
                    key={gsm}
                    label={`${gsm} GSM`}
                    value={local.boards[type][gsm]}
                    onChange={v => setBoard(type, gsm, v)}
                  />
                ))}
              </div>
            </div>
          ))}
          <p className="mt-3 text-xs text-gray-400">"No Board" option has no cost and requires no rate.</p>
        </SectionCard>

        {/* ── 3. Add-on Rates ── */}
        <SectionCard title="Add-on Rates">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RateField
              label="Printing"
              hint="Rs per colour per unit"
              step={0.5}
              value={local.addons.printingPerColour}
              onChange={v => setAddon('printingPerColour', v)}
            />
            <RateField
              label="Varnish"
              hint="Rs per unit"
              step={0.5}
              value={local.addons.varnishPerUnit}
              onChange={v => setAddon('varnishPerUnit', v)}
            />
            <RateField
              label="Die Cutting"
              hint="Rs per unit"
              step={0.5}
              value={local.addons.dieCutterPerPunch}
              onChange={v => setAddon('dieCutterPerPunch', v)}
            />
            <RateField
              label="E-Flute Lamination"
              hint="Rs per in²"
              step={0.001}
              value={local.addons.eFluteLaminatePerSqIn}
              onChange={v => setAddon('eFluteLaminatePerSqIn', v)}
            />
            <RateField
              label="Side Pasting"
              hint="Rs per unit"
              step={0.5}
              value={local.addons.pastingPerUnit}
              onChange={v => setAddon('pastingPerUnit', v)}
            />
            <RateField
              label="Packing &amp; Delivery"
              hint="Rs per unit"
              step={0.5}
              value={local.addons.packingDeliveryPerUnit}
              onChange={v => setAddon('packingDeliveryPerUnit', v)}
            />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">External Laminate Rates (Rs per in²)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <RateField
                label="Hot Laminate"
                step={0.001}
                value={local.addons.hotLaminatePerSqIn}
                onChange={v => setAddon('hotLaminatePerSqIn', v)}
              />
              <RateField
                label="Cold Laminate"
                step={0.001}
                value={local.addons.coldLaminatePerSqIn}
                onChange={v => setAddon('coldLaminatePerSqIn', v)}
              />
              <RateField
                label="UV"
                step={0.001}
                value={local.addons.uvLaminatePerSqIn}
                onChange={v => setAddon('uvLaminatePerSqIn', v)}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── 4. 2-Ply Surcharge ── */}
        <SectionCard title="2-Ply Surcharge">
          <p className="text-sm text-gray-500 mb-4">
            Applied as a percentage of the subtotal when a 2-ply material is selected.
          </p>
          <div className="flex items-center gap-3 max-w-xs">
            <RateField
              label="Surcharge percentage"
              hint="%"
              step={0.5}
              min={0}
              value={local.surcharges.twoPlyPercentage}
              onChange={v =>
                setLocal(p => ({ ...p, surcharges: { ...p.surcharges, twoPlyPercentage: v } }))
              }
            />
            <span className="text-lg font-semibold text-gray-500 mt-5">%</span>
          </div>
        </SectionCard>

        {/* ── 5. Tax Rates ── */}
        <SectionCard title="Tax Rates">
          <p className="text-sm text-gray-500 mb-4">
            Applied on top of the production cost. Shown as separate line items on quotes — not included in the base cost total.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <RateField
                label="SSCL"
                hint="Social Security Contribution Levy"
                step={0.001}
                min={0}
                value={local.taxes?.ssclPercentage ?? 2.125}
                onChange={v => setTax('ssclPercentage', v)}
              />
              <span className="text-lg font-semibold text-gray-500 mt-5">%</span>
            </div>
            <div className="flex items-center gap-3">
              <RateField
                label="VAT"
                hint="Value Added Tax"
                step={0.5}
                min={0}
                value={local.taxes?.vatPercentage ?? 18}
                onChange={v => setTax('vatPercentage', v)}
              />
              <span className="text-lg font-semibold text-gray-500 mt-5">%</span>
            </div>
          </div>
        </SectionCard>

        {/* ── 6. Special Rate Companies ── */}
        <SectionCard title="Special Rate Companies">
          <p className="text-sm text-gray-500 mb-5">
            Each company has a custom list of named rates (Rs per in²). Add as many as needed — they appear as options on the quote page.
          </p>

          {/* Existing companies */}
          <div className="space-y-4">
            {specialRates.map(c => (
              <div key={c.id} className="border border-gray-200 rounded-xl p-4">
                {/* Name + remove company */}
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={c.name}
                    onChange={e => updateCompanyName(c.id, e.target.value)}
                    className="flex-1 text-sm font-semibold text-gray-800 border-0 border-b border-transparent hover:border-gray-300 focus:border-red-500 focus:outline-none bg-transparent py-0.5 min-w-0"
                  />
                  <button onClick={() => removeCompany(c.id)} className="shrink-0 p-1 text-gray-300 hover:text-red-500 transition-colors text-lg leading-none" title="Remove company">
                    ×
                  </button>
                </div>
                {/* Rate rows */}
                <div className="space-y-2">
                  {c.rates.map((r, i) => (
                    <div key={i} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                      <input
                        type="text"
                        value={r.label}
                        onChange={e => updateCompanyRates(c.id, c.rates.map((row, idx) => idx === i ? { ...row, label: e.target.value } : row))}
                        placeholder='e.g. 31" Reel'
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          step={0.001}
                          value={r.rate}
                          onChange={e => updateCompanyRates(c.id, c.rates.map((row, idx) => idx === i ? { ...row, rate: Number(e.target.value) } : row))}
                          className="flex-1 sm:w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <span className="text-xs text-gray-400 whitespace-nowrap">Rs/in²</span>
                        <button
                          onClick={() => updateCompanyRates(c.id, c.rates.filter((_, idx) => idx !== i))}
                          className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none shrink-0"
                          title="Remove rate"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => updateCompanyRates(c.id, [...c.rates, { label: '', rate: 0 }])}
                  className="mt-3 text-xs text-red-700 hover:text-red-800 font-semibold transition-colors"
                >
                  + Add rate
                </button>
              </div>
            ))}
          </div>

          {/* Add new company */}
          <div className="mt-5 border-t border-gray-100 pt-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Add New Company</p>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Company name"
                value={newCompanyName}
                onChange={e => setNewCompanyName(e.target.value)}
              />
              <div className="space-y-2">
                {newCompanyRates.map((r, i) => (
                  <div key={i} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                    <input
                      type="text"
                      value={r.label}
                      onChange={e => updateNewRate(i, 'label', e.target.value)}
                      placeholder='e.g. 31" Reel'
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        step={0.001}
                        value={r.rate}
                        onChange={e => updateNewRate(i, 'rate', Number(e.target.value))}
                        className="flex-1 sm:w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                      <span className="text-xs text-gray-400 whitespace-nowrap">Rs/in²</span>
                      {newCompanyRates.length > 1 && (
                        <button onClick={() => removeNewRateRow(i)} className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none shrink-0" title="Remove">×</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addRateRow} className="text-xs text-red-700 hover:text-red-800 font-semibold transition-colors">
                + Add rate
              </button>
              <div>
                <Button variant="secondary" size="sm" onClick={addCompany} disabled={!newCompanyName.trim()}>
                  + Add Company
                </Button>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── 6. Company / PDF Settings ── */}
        <SectionCard title="Company / PDF Settings">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Company Name"
              value={local.company.companyName}
              onChange={v => setCompany('companyName', v)}
            />
            <TextField
              label="Legal Name"
              value={local.company.legalName}
              onChange={v => setCompany('legalName', v)}
            />
            <TextField
              label="Phone"
              value={local.company.phone}
              onChange={v => setCompany('phone', v)}
            />
            <TextField
              label="Email"
              value={local.company.email}
              onChange={v => setCompany('email', v)}
            />
            <TextField
              label="Website"
              value={local.company.website}
              onChange={v => setCompany('website', v)}
            />
            <TextField
              label="BR Number"
              value={local.company.brNumber}
              onChange={v => setCompany('brNumber', v)}
            />
            <TextField
              label="VAT Number"
              value={local.company.vatNumber}
              onChange={v => setCompany('vatNumber', v)}
            />
          </div>
          <div className="mt-4 space-y-4">
            <TextField
              label="Address"
              value={local.company.address}
              multiline
              onChange={v => setCompany('address', v)}
            />
            <TextField
              label="Bank Details"
              value={local.company.bankDetails}
              multiline
              onChange={v => setCompany('bankDetails', v)}
            />
            <TextField
              label="Payment Terms (PDF footer)"
              value={local.company.paymentTerms}
              multiline
              onChange={v => setCompany('paymentTerms', v)}
            />
            <TextField
              label="Footer Note"
              value={local.company.footerNote}
              onChange={v => setCompany('footerNote', v)}
            />
          </div>
        </SectionCard>

        {/* ── Save / Reset ── */}
        <div className="flex items-center gap-4 pb-8">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button variant="secondary" size="lg" onClick={handleReset}>
            Reset to Defaults
          </Button>
          {savedMsg && (
            <span
              className={`text-sm font-medium ${
                savedMsg.includes('failed') ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {savedMsg}
            </span>
          )}
        </div>
      </main>
    </div>
  )
}
