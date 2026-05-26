import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.webp'
import Card from '../components/ui/Card'
import ImageUploadAnalyzer from '../components/analysis/ImageUploadAnalyzer'
import DimensionInputPanel from '../components/analysis/DimensionInputPanel'
import CuttingLayoutPreview from '../components/analysis/CuttingLayoutPreview'
import LayoutEstimateSummary from '../components/analysis/LayoutEstimateSummary'
import AdminOverridePanel from '../components/analysis/AdminOverridePanel'
import { calculateCuttingLayout } from '../lib/boxLayoutEstimator'
import type {
  SampleImage,
  LayoutConfig,
  AdminOverrides,
} from '../lib/analysis/types'
import { DEFAULT_LAYOUT_CONFIG, DEFAULT_ADMIN_OVERRIDES } from '../lib/analysis/types'

type ActiveSection = 'samples' | 'dimensions' | 'layout'

const defaultDimensions: LayoutConfig['dimensions'] = {
  length: 150,
  width: 100,
  height: 80,
  unit: 'mm',
}

const defaultConfig: LayoutConfig = {
  ...DEFAULT_LAYOUT_CONFIG,
  dimensions: defaultDimensions,
}

export default function SampleAnalysisPage() {
  const { user } = useAuth()

  const [activeSection, setActiveSection] = useState<ActiveSection>('samples')
  const [images, setImages] = useState<SampleImage[]>([])
  const [overrideColourCount, setOverrideColourCount] = useState<number | null>(null)
  const [config, setConfig] = useState<LayoutConfig>(defaultConfig)
  const [overrides, setOverrides] = useState<AdminOverrides>(DEFAULT_ADMIN_OVERRIDES)
  const [layoutCalculated, setLayoutCalculated] = useState(false)

  // Recalculate layout whenever config changes (if already calculated)
  const layoutResult = useMemo(() => {
    if (!layoutCalculated) return null
    const L = config.dimensions.length
    const W = config.dimensions.width
    const H = config.dimensions.height
    if (L <= 0 || W <= 0 || H <= 0) return null
    return calculateCuttingLayout(config)
  }, [config, layoutCalculated])

  const handleCalculate = () => {
    setLayoutCalculated(true)
    setActiveSection('layout')
  }

  const handleReset = () => {
    setImages([])
    setOverrideColourCount(null)
    setConfig(defaultConfig)
    setOverrides(DEFAULT_ADMIN_OVERRIDES)
    setLayoutCalculated(false)
    setActiveSection('samples')
  }

  const sections: { key: ActiveSection; label: string; icon: string }[] = [
    { key: 'samples', label: 'Sample Images', icon: '📷' },
    { key: 'dimensions', label: 'Dimensions', icon: '📐' },
    { key: 'layout', label: 'Layout Analysis', icon: '🔲' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <img src={logo} alt="Pack Me Lanka" className="h-12 w-auto" />
          <nav className="flex items-center gap-3">
            <Link to="/" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">
              Calculator
            </Link>
            {user && (
              <Link
                to="/admin"
                className="text-xs bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-red-800 transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Page title + global warning */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sample & Layout Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload a product sample, enter box dimensions, and get an estimated cutting layout.
          </p>
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <span className="font-semibold">⚠ Estimates only — not for production use.</span>{' '}
          All colour counts, flat sizes, and cutting layouts produced here are rough estimates.
          Final values must be confirmed by your production and pre-press team.
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1">
          {sections.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveSection(s.key)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                activeSection === s.key
                  ? 'bg-red-700 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="hidden sm:inline">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* ── Section 1: Sample images ───────────────────────────────────────── */}
        {activeSection === 'samples' && (
          <div className="space-y-4">
            <Card title="Upload Sample Images">
              <ImageUploadAnalyzer
                images={images}
                onChange={setImages}
                overrideColourCount={overrideColourCount}
                onOverride={setOverrideColourCount}
              />
            </Card>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveSection('dimensions')}
                className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-800 transition-colors"
              >
                Next: Enter Dimensions →
              </button>
            </div>
          </div>
        )}

        {/* ── Section 2: Dimensions ──────────────────────────────────────────── */}
        {activeSection === 'dimensions' && (
          <div className="space-y-4">
            <Card title="Product Dimensions & Specifications">
              <DimensionInputPanel config={config} onChange={setConfig} />
            </Card>

            <div className="flex justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActiveSection('samples')}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleCalculate}
                className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-800 transition-colors"
              >
                Calculate Layout →
              </button>
            </div>
          </div>
        )}

        {/* ── Section 3: Layout analysis ─────────────────────────────────────── */}
        {activeSection === 'layout' && (
          <div className="space-y-4">
            {!layoutResult && (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <p className="text-gray-500 text-sm mb-4">
                  Enter dimensions and click Calculate Layout to see results.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSection('dimensions')}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-800 transition-colors"
                >
                  ← Go to Dimensions
                </button>
              </div>
            )}

            {layoutResult && (
              <>
                {/* Summary */}
                <Card title="Layout Estimate">
                  <LayoutEstimateSummary
                    result={layoutResult}
                    overrides={overrides}
                    quantity={config.quantity}
                  />
                </Card>

                {/* SVG preview */}
                <Card title="Cutting Layout Preview">
                  <CuttingLayoutPreview result={layoutResult} />
                </Card>

                {/* Admin overrides */}
                <Card title="Admin Overrides">
                  <AdminOverridePanel
                    overrides={overrides}
                    result={layoutResult}
                    onChange={setOverrides}
                  />
                </Card>

                {/* Colour summary from image analysis */}
                {images.some(img => img.analysis !== null) && (
                  <Card title="Colour Analysis Summary">
                    <div className="space-y-2">
                      {images
                        .filter(img => img.analysis !== null)
                        .map(img => (
                          <div
                            key={img.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200"
                          >
                            <img
                              src={img.dataUrl}
                              alt={img.file.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{img.file.name}</p>
                              <p className="text-xs text-gray-500">
                                {img.analysis!.suggestedPrintMode.replace('-', ' ')} suggested —{' '}
                                {img.analysis!.confidence} confidence
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {img.analysis!.dominantColours.slice(0, 5).map((c, i) => (
                                <div
                                  key={i}
                                  className="w-5 h-5 rounded border border-gray-200"
                                  style={{ backgroundColor: c.hex }}
                                  title={c.hex}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      {overrideColourCount !== null && (
                        <p className="text-xs text-red-700 font-medium">
                          ✎ Colour count overridden to: {overrideColourCount}
                        </p>
                      )}
                    </div>
                  </Card>
                )}

                <div className="flex justify-between flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveSection('dimensions')}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    ← Edit Dimensions
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Reset All
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
