export declare class OAuth2StorageError extends Error {
}
export declare function readOAuth2Document(file: string): unknown;
/** Encrypt before touching the destination, then replace it in one rename. */
export declare function writeOAuth2Document(file: string, doc: unknown): void;
export declare function isLegacyOAuth2Document(doc: unknown): boolean;
