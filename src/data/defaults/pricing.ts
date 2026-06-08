import type { PricingConfig } from '../../lib/pricingTypes'

export const defaultPricing: PricingConfig = {
  materials: {
    '2ply_brown':  0.101,
    '2ply_white':  0.140,
    '3ply_brown':  0.135,
    '3ply_white':  0.200,
    '2ply_bflute': 0.080,
    '3ply_bflute': 0.115,
  },
  boards: {
    white_back: { 250: 0.040, 300: 0.048, 350: 0.055, 400: 0.062 },
    grey_back:  { 250: 0.036, 300: 0.044, 350: 0.050, 400: 0.058 },
    ivory:      { 250: 0.055, 300: 0.065, 350: 0.075, 400: 0.085 },
  },
  addons: {
    printingPerColour:      2,
    varnishPerUnit:         2,
    dieCutterPerPunch:      2,
    eFluteLaminatePerSqIn:  0.008,
    hotLaminatePerSqIn:     0.066,
    coldLaminatePerSqIn:    0.030,
    uvLaminatePerSqIn:      0.027,
    pastingPerUnit:         2,
    packingDeliveryPerUnit: 1,
  },
  surcharges: {
    twoPlyPercentage: 15,
  },
  taxes: {
    ssclPercentage: 2.125,
    vatPercentage:  18,
  },
  wilkinsSpence: {
    reel31: 0.30,   // Rs per in² — adjust in admin
    reel35: 0.35,
    reel37: 0.38,
    reel39: 0.42,
  },
  company: {
    companyName:  'Pack Me Lanka',
    legalName:    'Pack Me Lanka (PVT) LTD',
    address:      '34/A, Canal Road, Mihindu Mawatha, Malabe, Sri Lanka',
    phone:        '+94 77 267 1466',
    email:        'packmelanka@gmail.com',
    website:      'N/A',
    brNumber:     'N/A',
    vatNumber:    'N/A',
    footerNote:   'Thank you for choosing Pack Me Lanka.',
    paymentTerms: 'This quotation is subject to final confirmation by production.',
    bankDetails:  'N/A',
  },
}
