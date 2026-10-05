export interface RecipientPolicy {
    skipApproval: boolean;
    addresses: string[];
    domains: string[];
    denyAddresses?: string[];
    denyDomains?: string[];
}
export interface RecipientMatch {
    field: 'to' | 'cc';
    address: string;
    matched: boolean;
    blocked: boolean;
    rule: 'address' | 'domain' | '';
    value: string;
}
export declare class RecipientPolicyError extends Error {
    readonly code = "recipient-denied";
    constructor(addresses: string[]);
}
export declare function canonicalDomain(value: string): string;
export declare function canonicalAddress(value: string): string;
/** The public Nodemailer JSON transport compiles the same recipient envelope without delivery. */
export declare function normalizeRecipients(to: string, cc?: string): Promise<Array<{
    field: 'to' | 'cc';
    address: string;
}>>;
export declare function parseRecipientPolicies(text?: string): Map<string, RecipientPolicy>;
export declare function serializeRecipientPolicies(policies: Map<string, RecipientPolicy>): string;
export declare function matchRecipients(to: string, cc: string, policy?: RecipientPolicy): Promise<{
    rows: RecipientMatch[];
    allTrusted: boolean;
    skipsApproval: boolean;
    blocked: boolean;
}>;
export declare function assertRecipientsAllowed(to: string, cc: string, policy?: RecipientPolicy): Promise<void>;
