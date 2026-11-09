export interface PublicAddress {
    address: string;
    family: number;
}
export declare function publicAddress(address: string): boolean;
/** Fake-IP answers are never usable destinations themselves. */
export declare function syntheticAddress(address: string): boolean;
/**
 * Fake-IP IPv6 placeholders. Only ranges that can never be a legitimate public
 * destination qualify: 2001:2::/48 is the benchmarking prefix and the default
 * mihomo/Clash fake-ip-range6, fdfe:dcba:9876::/48 is sing-box's fake IPv6 marker.
 * A real unique-local (fc00::/7) answer stays private instead of triggering DoH.
 */
export declare function syntheticAddress6(address: string): boolean;
export declare function validPublicRecords(records: readonly PublicAddress[]): boolean;
