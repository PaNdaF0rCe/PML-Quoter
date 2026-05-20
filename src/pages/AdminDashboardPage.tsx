import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.webp'
import { usePricing } from '../context/PricingContext'
import type { PricingConfig } from '../lib/pricing/types'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Label from '../components/ui/Label'
import Input from '../components/ui/Input'
import SeedButton from '../components/admin/SeedButton'
import ReelSizesEditor from '../components/admin/ReelSizesEditor'
import QuantityTiersEditor from '../components/admin/QuantityTiersEditor'
import PrintingRatesEditor from '../components/admin/PrintingRatesEditor'
import MaterialRatesEditor from '../components/admin/MaterialRatesEditor'
import AddOnRatesEditor from '../components/admin/AddOnRatesEditor'

type Section = 'reels' | 'tiers' | 'printing' | 'materials' | 'addons' | 'labour'

export default function AdminDashboardPage() {
  const { logout, user } = useAuth()
  const { pricing, update, reload } = usePricing()
  const [local, setLocal] = useState<PricingConfig>(pricing)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>('reels')

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    await update(local)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const sections: { key: Section; label: string }[] = [
    { key: 'reels', label: 'Reel Sizes' },
    { key: 'tiers', label: 'Quantity Tiers' },
    { key: 'printing', label: 'Printing Rates' },
    { key: 'materials', label: 'Material Rates' },
    { key: 'addons', label: 'Add-on Rates' },
    { key: 'labour', label: 'Labour %' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Pack Me Lanka" className="h-12 w-auto" />
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Dashboard</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">
              Calculator
            </Link>
            <Button variant="secondary" size="sm" onClick={() => logout()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Pricing Settings</h2>
          <SeedButton onSeeded={() => reload().then(() => setLocal(pricing))} />
        </div>

        <div className="flex gap-6">
          {/* Sidebar nav */}
          <nav className="w-44 shrink-0 space-y-1">
            {sections.map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveSection(s.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === s.key
                    ? 'bg-red-700 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>

          {/* Section content */}
          <div className="flex-1">
            {activeSection === 'reels' && (
              <Card title="Reel Sizes">
                <ReelSizesEditor
                  items={local.reelSizes}
                  onChange={items => setLocal(p => ({ ...p, reelSizes: items }))}
                />
              </Card>
            )}

            {activeSection === 'tiers' && (
              <Card title="Quantity Tiers">
                <QuantityTiersEditor
                  items={local.quantityTiers}
                  onChange={items => setLocal(p => ({ ...p, quantityTiers: items }))}
                />
              </Card>
            )}

            {activeSection === 'printing' && (
              <Card title="Printing Rates">
                <PrintingRatesEditor
                  colourRates={local.printColourRates}
                  areaRates={local.printAreaRates}
                  onColourChange={rates => setLocal(p => ({ ...p, printColourRates: rates }))}
                  onAreaChange={rates => setLocal(p => ({ ...p, printAreaRates: rates }))}
                />
              </Card>
            )}

            {activeSection === 'materials' && (
              <Card title="Material Rates">
                <MaterialRatesEditor
                  rates={local.materialRates}
                  onChange={rates => setLocal(p => ({ ...p, materialRates: rates }))}
                />
              </Card>
            )}

            {activeSection === 'addons' && (
              <Card title="Add-on Rates">
                <AddOnRatesEditor
                  rates={local.addOnRates}
                  onChange={rates => setLocal(p => ({ ...p, addOnRates: rates }))}
                />
              </Card>
            )}

            {activeSection === 'labour' && (
              <Card title="Labour Percentage">
                <p className="text-sm text-gray-500 mb-4">
                  Applied as a percentage of (base + printing + material + add-ons).
                </p>
                <div className="flex items-center gap-3 max-w-xs">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={local.labourPercentage}
                    onChange={e => setLocal(p => ({ ...p, labourPercentage: Number(e.target.value) }))}
                  />
                  <span className="text-sm font-semibold text-gray-600">%</span>
                </div>
                <p className="mt-3 text-xs text-gray-400">
                  Default is 30%. Placeholder for rounding rules will appear here in a future update.
                </p>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <Label>Rounding Rules</Label>
                  <p className="text-sm text-gray-400 italic">Reserved — configurable in a future release.</p>
                </div>
              </Card>
            )}

            <div className="mt-4 flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
              {saved && <span className="text-sm text-green-600 font-medium">Saved to Firestore.</span>}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
