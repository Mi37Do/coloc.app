// ISO 3166-1 countries: alpha-2 code -> numeric code. The numeric code is what
// coloc.api stores as users.countryId (e.g. France = 250). Names come from the
// browser via Intl.DisplayNames, so they follow the user's language.
const ISO_NUMERIC: Record<string, number> = {
  AD: 20, AE: 784, AF: 4, AG: 28, AL: 8, AM: 51, AO: 24, AR: 32, AT: 40, AU: 36,
  AZ: 31, BA: 70, BB: 52, BD: 50, BE: 56, BF: 854, BG: 100, BH: 48, BI: 108, BJ: 204,
  BN: 96, BO: 68, BR: 76, BS: 44, BT: 64, BW: 72, BY: 112, BZ: 84, CA: 124, CD: 180,
  CF: 140, CG: 178, CH: 756, CI: 384, CL: 152, CM: 120, CN: 156, CO: 170, CR: 188, CU: 192,
  CV: 132, CY: 196, CZ: 203, DE: 276, DJ: 262, DK: 208, DM: 212, DO: 214, DZ: 12, EC: 218,
  EE: 233, EG: 818, ER: 232, ES: 724, ET: 231, FI: 246, FJ: 242, FM: 583, FR: 250, GA: 266,
  GB: 826, GD: 308, GE: 268, GH: 288, GM: 270, GN: 324, GQ: 226, GR: 300, GT: 320, GW: 624,
  GY: 328, HK: 344, HN: 340, HR: 191, HT: 332, HU: 348, ID: 360, IE: 372, IL: 376, IN: 356,
  IQ: 368, IR: 364, IS: 352, IT: 380, JM: 388, JO: 400, JP: 392, KE: 404, KG: 417, KH: 116,
  KI: 296, KM: 174, KN: 659, KP: 408, KR: 410, KW: 414, KZ: 398, LA: 418, LB: 422, LC: 662,
  LI: 438, LK: 144, LR: 430, LS: 426, LT: 440, LU: 442, LV: 428, LY: 434, MA: 504, MC: 492,
  MD: 498, ME: 499, MG: 450, MH: 584, MK: 807, ML: 466, MM: 104, MN: 496, MO: 446, MR: 478,
  MT: 470, MU: 480, MV: 462, MW: 454, MX: 484, MY: 458, MZ: 508, NA: 516, NE: 562, NG: 566,
  NI: 558, NL: 528, NO: 578, NP: 524, NR: 520, NZ: 554, OM: 512, PA: 591, PE: 604, PG: 598,
  PH: 608, PK: 586, PL: 616, PS: 275, PT: 620, PW: 585, PY: 600, QA: 634, RO: 642, RS: 688,
  RU: 643, RW: 646, SA: 682, SB: 90, SC: 690, SD: 729, SE: 752, SG: 702, SI: 705, SK: 703,
  SL: 694, SM: 674, SN: 686, SO: 706, SR: 740, SS: 728, ST: 678, SV: 222, SY: 760, SZ: 748,
  TD: 148, TG: 768, TH: 764, TJ: 762, TL: 626, TM: 795, TN: 788, TO: 776, TR: 792, TT: 780,
  TV: 798, TW: 158, TZ: 834, UA: 804, UG: 800, US: 840, UY: 858, UZ: 860, VA: 336, VC: 670,
  VE: 862, VN: 704, VU: 548, WS: 882, YE: 887, ZA: 710, ZM: 894, ZW: 716,
}

export type Country = { id: number; code: string; name: string }

let cache: Country[] | undefined

/** All countries, sorted by name in the user's language */
export function getCountries(): Country[] {
  if (cache) return cache
  const names = new Intl.DisplayNames(undefined, { type: 'region' })
  cache = Object.entries(ISO_NUMERIC)
    .map(([code, id]) => ({ id, code, name: names.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name))
  return cache
}

/** Best guess from the browser locale, e.g. "fr-FR" -> 250 */
export function guessCountryId(): number | undefined {
  const region = new Intl.Locale(navigator.language).maximize().region
  return region ? ISO_NUMERIC[region] : undefined
}

/** "FR" -> 🇫🇷 (regional indicator letters) */
export const flagEmoji = (code: string) =>
  String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
