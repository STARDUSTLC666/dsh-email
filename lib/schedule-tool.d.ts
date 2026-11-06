import type { EmailDraftBackend } from './draft-web.js';
import type { EmailToolDefinition } from './tools.js';
type Backend = Pick<EmailDraftBackend, 'action' | 'store'>;
/** Uses the same host approval pipeline as immediate mail; no reusable public grant. */
export declare function installScheduleApproval(ctx: any, backend: Backend): void;
export declare function scheduleTool(backend: Backend): EmailToolDefinition;
export {};
