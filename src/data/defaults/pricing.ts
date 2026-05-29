import type { PricingConfig } from '../../lib/pricingTypes'

export const defaultPricing: PricingConfig = {
  materials: {
    '2ply_brown': 0.101,
    '2ply_white': 0.140,
    '3ply_brown': 0.135,
    '3ply_white': 0.200,
  },
  boards: {
    '250gsm': 0.040,
    '300gsm': 0.048,
  },
  addons: {
    printingPerColour:      2,
    varnishPerUnit:         2,
    dieCutterPerPunch:      2,
    laminatePerSqIn:        0.008,
    pastingPerUnit:         2,
    packingDeliveryPerUnit: 1,
  },
  surcharges: {
    twoPlyPercentage: 15,
  },
  company: {
    companyName:  'Pack Me Lanka',
    legalName:    'Pack Me Lanka (PVT) LTD',
    address:      'N/A',
    phone:        'N/A',
    email:        'N/A',
    website:      'N/A',
    brNumber:     'N/A',
    vatNumber:    'N/A',
    footerNote:   'Thank you for choosing Pack Me Lanka.',
    paymentTerms: 'This quotation is subject to final confirmation by production.',
    bankDetails:  'N/A',
  },
}
