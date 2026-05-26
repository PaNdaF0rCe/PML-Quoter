import type { LayoutConfig, DimensionUnit, ProductType, BoardType, FlutType, PrintingSide } from '../../lib/analysis/types'
import { STANDARD_SHEET_SIZES } from '../../lib/analysis/types'
import Label from '../ui/Label'
import Input from '../ui/Input'
import Select from '../ui/Select'

interface Props {
  config: LayoutConfig
  onChange: (config: LayoutConfig) => void
}

const set = <K extends keyof LayoutConfig>(config: LayoutConfig, key: K, value: LayoutConfig[K]): LayoutConfig =>
  ({ ...config, [key]: value })

const setDim = <K extends keyof LayoutConfig['dimensions']>(
  config: LayoutConfig,
  key: K,
  value: LayoutConfig['dimensions'][K],
): LayoutConfig => ({ ...config, dimensions: { ...config.dimensions, [key]: value } })

export default function DimensionInputPanel({ config, onChange }: Props) {
  const handleSheetPreset = (id: string) => {
    const preset = STANDARD_SHEET_SIZES.find(s => s.id === id)
    if (preset && preset.id !== 'custom') {
      onChange({ ...config, sheetWidthMm: preset.widthMm, sheetHeightMm: preset.heightMm })
    }
  }

  const currentPreset =
    STANDARD_SHEET_SIZES.find(
      s => s.widthMm === config.sheetWidthMm && s.heightMm === config.sheetHeightMm,
    )?.id ?? 'custom'

  return (
    <div className="space-y-6">
      {/* Product type + material */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="productType">Product / Box Type</Label>
          <Select
            id="productType"
            value={config.productType}
            onChange={e => onChange(set(config, 'productType', e.target.value as ProductType))}
          >
            <option value="straight-tuck-end">Straight Tuck-End Carton</option>
            <option value="reverse-tuck-end">Reverse Tuck-End Carton</option>
            <option value="lock-bottom">Lock-Bottom Carton</option>
            <option value="pizza-box">Pizza / Lid-and-Base Box</option>
            <option value="sleeve">Sleeve Wrap</option>
            <option value="tray">Open Tray</option>
            <option value="custom">Custom / Other</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="boardType">Board / Material Type</Label>
          <Select
            id="boardType"
            value={config.boardType}
            onChange={e => onChange(set(config, 'boardType', e.target.value as BoardType))}
          >
            <option value="boxboard">Boxboard</option>
            <option value="duplex">Duplex Board</option>
            <option value="triplex">Triplex Board</option>
            <option value="kraft">Kraft Board</option>
            <option value="art-paper">Art Paper / Coated</option>
            <option value="e-flute-board">E-Flute Corrugated</option>
            <option value="nano-flute-board">Nano-Flute Corrugated</option>
            <option value="f-flute-board">F-Flute Corrugated</option>
          </Select>
        </div>
      </div>

      {/* Dimensions */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Box Dimensions (external)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label htmlFor="dimUnit">Unit</Label>
            <Select
              id="dimUnit"
              value={config.dimensions.unit}
              onChange={e => onChange(setDim(config, 'unit', e.target.value as DimensionUnit))}
            >
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="inches">inches</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="dimL">Length</Label>
            <Input
              id="dimL"
              type="number"
              min={0}
              step={0.5}
              value={config.dimensions.length}
              onChange={e => onChange(setDim(config, 'length', Number(e.target.value)))}
            />
          </div>
          <div>
            <Label htmlFor="dimW">Width</Label>
            <Input
              id="dimW"
              type="number"
              min={0}
              step={0.5}
              value={config.dimensions.width}
              onChange={e => onChange(setDim(config, 'width', Number(e.target.value)))}
            />
          </div>
          <div>
            <Label htmlFor="dimH">Height</Label>
            <Input
              id="dimH"
              type="number"
              min={0}
              step={0.5}
              value={config.dimensions.height}
              onChange={e => onChange(setDim(config, 'height', Number(e.target.value)))}
            />
          </div>
        </div>
      </div>

      {/* Quantity + options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            value={config.quantity}
            onChange={e => onChange(set(config, 'quantity', Math.max(1, Number(e.target.value))))}
          />
        </div>
        <div>
          <Label htmlFor="boardGsm">Board GSM / Thickness</Label>
          <Input
            id="boardGsm"
            type="text"
            placeholder="e.g. 350gsm"
            value={config.boardGsm}
            onChange={e => onChange(set(config, 'boardGsm', e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="fluteType">Flute Type</Label>
          <Select
            id="fluteType"
            value={config.fluteType}
            onChange={e => onChange(set(config, 'fluteType', e.target.value as FlutType))}
          >
            <option value="none">None (solid board)</option>
            <option value="e-flute">E-Flute</option>
            <option value="nano-flute">Nano-Flute</option>
            <option value="f-flute">F-Flute</option>
          </Select>
        </div>
      </div>

      {/* Printing + lamination */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="printingSide">Printing Side</Label>
          <Select
            id="printingSide"
            value={config.printingSide}
            onChange={e => onChange(set(config, 'printingSide', e.target.value as PrintingSide))}
          >
            <option value="one-side">One Side</option>
            <option value="two-side">Two Sides</option>
          </Select>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.lamination}
              onChange={e => onChange(set(config, 'lamination', e.target.checked))}
              className="h-4 w-4 rounded border-gray-300 text-red-700 focus:ring-red-500"
            />
            <span className="text-sm font-medium text-gray-700">Lamination</span>
          </label>
        </div>
      </div>

      {/* Sheet size */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Sheet / Board Size</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-3">
            <Label htmlFor="sheetPreset">Standard size</Label>
            <Select
              id="sheetPreset"
              value={currentPreset}
              onChange={e => handleSheetPreset(e.target.value)}
            >
              {STANDARD_SHEET_SIZES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="sheetW">Sheet Width (mm)</Label>
            <Input
              id="sheetW"
              type="number"
              min={1}
              value={config.sheetWidthMm}
              onChange={e => onChange(set(config, 'sheetWidthMm', Number(e.target.value)))}
            />
          </div>
          <div>
            <Label htmlFor="sheetH">Sheet Height (mm)</Label>
            <Input
              id="sheetH"
              type="number"
              min={1}
              value={config.sheetHeightMm}
              onChange={e => onChange(set(config, 'sheetHeightMm', Number(e.target.value)))}
            />
          </div>
          <div>
            <Label htmlFor="machineMargin">Machine Margin (mm)</Label>
            <Input
              id="machineMargin"
              type="number"
              min={0}
              value={config.machineMarginMm}
              onChange={e => onChange(set(config, 'machineMarginMm', Number(e.target.value)))}
            />
          </div>
        </div>
      </div>

      {/* Allowances */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Allowances (mm)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="bleed">Bleed</Label>
            <Input
              id="bleed"
              type="number"
              min={0}
              step={0.5}
              value={config.bleedMm}
              onChange={e => onChange(set(config, 'bleedMm', Number(e.target.value)))}
            />
          </div>
          <div>
            <Label htmlFor="trim">Trim Allowance</Label>
            <Input
              id="trim"
              type="number"
              min={0}
              step={0.5}
              value={config.trimAllowanceMm}
              onChange={e => onChange(set(config, 'trimAllowanceMm', Number(e.target.value)))}
            />
          </div>
          <div>
            <Label htmlFor="glueFlap">Glue Flap</Label>
            <Input
              id="glueFlap"
              type="number"
              min={0}
              value={config.glueFlapMm}
              onChange={e => onChange(set(config, 'glueFlapMm', Number(e.target.value)))}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          rows={2}
          value={config.notes}
          onChange={e => onChange(set(config, 'notes', e.target.value))}
          placeholder="Special instructions, finish details, etc."
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
      </div>
    </div>
  )
}
