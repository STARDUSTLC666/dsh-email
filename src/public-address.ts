import { isIP } from 'node:net'

export interface PublicAddress { address: string; family: number }

export function publicAddress(address: string): boolean {
  const lower = address.toLowerCase()
  if (/[\s%]/.test(lower)) return false
  if (isIP(lower) === 4) {
    const [a, b] = lower.split('.').map(Number)
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) || (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && (b === 18 || b === 19)))
  }
  return isIP(lower) === 6 && /^[23]/.test(lower) && !lower.startsWith('2001:db8:')
}

/** Fake-IP answers are never usable destinations themselves. */
export function syntheticAddress(address: string): boolean {
  if (isIP(address) !== 4) return false
  const [a, b] = address.split('.').map(Number)
  return a === 198 && (b === 18 || b === 19)
}

export function validPublicRecords(records: readonly PublicAddress[]): boolean {
  return records.length > 0 && records.length <= 32 && records.every(row =>
    row.family === isIP(row.address) && publicAddress(row.address))
}
