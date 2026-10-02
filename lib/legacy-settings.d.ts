/** No backup is edited or deleted; the completion marker lives beside imported values. */
export declare function importLegacySettings(ctx: any, config: Record<string, any>, namespace: string, entryId: string, fields: readonly string[], home?: string): Promise<boolean>;
/** Defer persistence until the entry and settings provider are active. */
export declare function installLegacySettingsImport(ctx: any, config: Record<string, any>, namespace: string, entryId: string, fields: readonly string[]): void;
