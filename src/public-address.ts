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
  return isIP(lower) === 6 && /^[23]/.test(lower) && !lower.startsWith('2001:db8:') && !syntheticAddress6(lower)
}

/** Fake-IP answers are never usable destinations themselves. */
export function syntheticAddress(address: string): boolean {
  if (isIP(address) !== 4) return false
  const [a, b] = address.split('.').map(Number)
  return a === 198 && (b === 18 || b === 19)
}

/** Expand an IPv6 address to its eight 16-bit groups, or undefined when malformed. */
function ipv6Groups(address: string): number[] | undefined {
  const [head, tail] = address.split('::')
  const parse = (parts: readonly string[]) => parts.map(part => Number.parseInt(part, 16))
  if (tail === undefined) {
    const parts = head.split(':')
    return parts.length === 8 ? parse(parts) : undefined
  }
  const left = head === '' ? [] : head.split(':')
  const right = tail === '' ? [] : tail.split(':')
  const fill = 8 - left.length - right.length
  if (fill < 1) return undefined
  return [...parse(left), ...new Array<number>(fill).fill(0), ...parse(right)]
}

function hasIPv6Prefix(groups: readonly number[], prefix: readonly number[]): boolean {
  return prefix.every((value, index) => groups[index] === value)
}

/**
 * Fake-IP IPv6 placeholders. Only ranges that can never be a legitimate public
 * destination qualify: 2001:2::/48 is the benchmarking prefix and the default
 * mihomo/Clash fake-ip-range6, fdfe:dcba:9876::/48 is sing-box's fake IPv6 marker.
 * A real unique-local (fc00::/7) answer stays private instead of triggering DoH.
 */
export function syntheticAddress6(address: string): boolean {
  if (isIP(address) !== 6) return false
  const groups = ipv6Groups(address.toLowerCase())
  if (groups === undefined || groups.some(value => Number.isNaN(value))) return false
  return hasIPv6Prefix(groups, [0x2001, 0x0002, 0x0000]) || hasIPv6Prefix(groups, [0xfdfe, 0xdcba, 0x9876])
}

export function validPublicRecords(records: readonly PublicAddress[]): boolean {
  return records.length > 0 && records.length <= 32 && records.every(row =>
    row.family === isIP(row.address) && publicAddress(row.address))
}
