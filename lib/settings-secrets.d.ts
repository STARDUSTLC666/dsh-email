/** An opaque, authenticated reference; the browser never needs the YAML itself. */
export declare function sealSettingsText(field: string, text: string): string;
/** Plain input remains accepted for existing callers and newly typed drafts. */
export declare function openSettingsText(field: string, text: string): string;
export declare function publicSettingsValue<T extends object>(value: T): T;
export declare function openSettingsValue<T extends object>(value: T, previous?: object): T;
