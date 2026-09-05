import type { EmailRuntime } from './runtime.js';
import { type TextBlock } from './tool-contract.js';
export interface EmailToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    output: {
        schema: Record<string, unknown>;
        render(args: unknown, value: unknown): TextBlock[];
    };
    execute(args: unknown, exec?: unknown): Promise<unknown>;
}
export declare function buildEmailTools(runtime: Pick<EmailRuntime, 'getPool' | 'getEffectiveSettings' | 'watch'>): EmailToolDefinition[];
