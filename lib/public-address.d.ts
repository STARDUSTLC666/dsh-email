export interface PublicAddress {
    address: string;
    family: number;
}
export declare function publicAddress(address: string): boolean;
/** Fake-IP answers are never usable destinations themselves. */
export declare function syntheticAddress(address: string): boolean;
export declare function validPublicRecords(records: readonly PublicAddress[]): boolean;
