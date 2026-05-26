import { useRef, useState } from 'react'
import type { SampleImage } from '../../lib/analysis/types'
import { analyzeImageColours } from '../../lib/imageColourAnalysis'
import ColourSwatchList from './ColourSwatchList'

interface Props {
  images: SampleImage[]
  onChange: (images: SampleImage[]) => void
  overrideColourCount: number | null
  onOverride: (count: number | null) => void
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILES = 5

export default function ImageUploadAnalyzer({ images, onChange, overrideColourCount, onOverride }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const addFiles = async (files: FileList | null) => {
    if (!files) return
    const valid = Array.from(files)
      .filter(f => ACCEPTED.includes(f.type))
      .slice(0, MAX_FILES - images.length)

    if (valid.length === 0) return

    const newImages: SampleImage[] = await Promise.all(
      valid.map(async file => {
        const dataUrl = await readAsDataUrl(file)
        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          dataUrl,
          analysis: null,
          analysing: false,
        }
      })
    )

    const updated = [...images, ...newImages]
    onChange(updated)

    // Auto-select the first new image
    if (newImages.length > 0) setActiveId(newImages[0].id)
  }

  const removeImage = (id: string) => {
    const next = images.filter(img => img.id !== id)
    onChange(next)
    if (activeId === id) setActiveId(next[0]?.id ?? null)
  }

  const analyzeImage = async (id: string) => {
    const img = images.find(i => i.id === id)
    if (!img) return

    onChange(images.map(i => (i.id === id ? { ...i, analysing: true } : i)))

    try {
      const result = await analyzeImageColours(img.file)
      onChange(
        images.map(i => (i.id === id ? { ...i, analysis: result, analysing: false } : i))
      )
    } catch (e) {
      onChange(
        images.map(i =>
          i.id === id
            ? {
                ...i,
                analysing: false,
                analysis: {
                  dominantColours: [],
                  estimatedColourCount: 1,
                  suggestedPrintMode: '1-colour',
                  confidence: 'low',
                  notes: `Analysis failed: ${e instanceof Error ? e.message : String(e)}`,
                },
              }
            : i
        )
      )
    }
  }

  const activeImage = images.find(i => i.id === activeId) ?? null

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
          dragging ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-red-400 bg-gray-50'
        }`}
      >
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm text-gray-600 font-medium">
          {images.length === 0 ? 'Drop sample images here or click to upload' : 'Add more images'}
        </p>
        <p className="text-xs text-gray-400">JPG, PNG, WEBP — up to {MAX_FILES} images</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map(img => (
            <div key={img.id} className="relative">
              <button
                type="button"
                onClick={() => setActiveId(img.id)}
                className={`block w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  activeId === img.id ? 'border-red-600' : 'border-gray-200 hover:border-red-400'
                }`}
              >
                <img src={img.dataUrl} alt={img.file.name} className="w-full h-full object-cover" />
              </button>
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-700 text-white rounded-full flex items-center justify-center text-xs leading-none hover:bg-red-700"
                title="Remove"
              >
                ×
              </button>
              {img.analysis && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500 rounded-b-lg" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Active image detail */}
      {activeImage && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {/* Preview */}
          <div className="bg-gray-100 flex justify-center p-4">
            <img
              src={activeImage.dataUrl}
              alt={activeImage.file.name}
              className="max-h-52 object-contain rounded-lg shadow"
            />
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-medium text-gray-800">{activeImage.file.name}</p>
                <p className="text-xs text-gray-400">
                  {(activeImage.file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                type="button"
                disabled={activeImage.analysing}
                onClick={() => analyzeImage(activeImage.id)}
                className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60 transition-colors"
              >
                {activeImage.analysing ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Analysing…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Analyse Colours
                  </>
                )}
              </button>
            </div>

            {/* Analysis result */}
            {activeImage.analysis && (
              <ColourSwatchList
                result={activeImage.analysis}
                overrideColourCount={overrideColourCount}
                onOverride={onOverride}
              />
            )}

            {!activeImage.analysis && !activeImage.analysing && (
              <p className="text-xs text-gray-400 italic">
                Click "Analyse Colours" to detect dominant colours in this sample.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
