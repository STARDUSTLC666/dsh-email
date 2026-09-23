/** Harness 0.1.7 keeps editable fields in the profile and supplies live references. */
import z from '@deepseek-ai/schemastery';
import type { EmailConfig } from './config.js';
export declare const Config: z;
/** A live view also accepts ordinary values from older hosts and direct callers. */
export declare function liveConfig(config: object): EmailConfig;
