import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
const logo = '/logo.webp'
import { usePricing } from '../context/PricingContext'
import { defaultPricing } from '../data/defaults/pricing'
import type { PricingConfig } from '../lib/pricingTypes'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import SeedButton from '../components/admin/SeedButton'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
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

  const setBoard = (key: keyof typeof local.boards, v: number) =>
    setLocal(p => ({ ...p, boards: { ...p.boards, [key]: v } }))

  const setAddon = (key: keyof typeof local.addons, v: number) =>
    setLocal(p => ({ ...p, addons: { ...p.addons, [key]: v } }))

  const setCompany = (key: keyof typeof local.company, v: string) =>
    setLocal(p => ({ ...p, company: { ...p.company, [key]: v } }))

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
          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </SectionCard>

        {/* ── 2. Board Rates ── */}
        <SectionCard title="Board Rates (Rs per in²)">
          <div className="grid grid-cols-2 gap-4">
            <RateField
              label="250 GSM Board"
              value={local.boards['250gsm']}
              onChange={v => setBoard('250gsm', v)}
            />
            <RateField
              label="300 GSM Board"
              value={local.boards['300gsm']}
              onChange={v => setBoard('300gsm', v)}
            />
          </div>
          <p className="mt-3 text-xs text-gray-400">"None" option has no cost and requires no rate.</p>
        </SectionCard>

        {/* ── 3. Add-on Rates ── */}
        <SectionCard title="Add-on Rates">
          <div className="grid grid-cols-2 gap-4">
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
              label="P&D / Side Pasting"
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
            <div className="grid grid-cols-3 gap-4">
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

        {/* ── 5. Company / PDF Settings ── */}
        <SectionCard title="Company / PDF Settings">
          <div className="grid grid-cols-2 gap-4">
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
