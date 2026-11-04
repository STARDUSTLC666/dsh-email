import type { ImapFlow } from 'imapflow';
import type { EmailMovePreview, EmailMoveResult } from './types.js';
export declare function moveUids(input: unknown): number[];
export declare function previewImapTrash(client: ImapFlow, account: string, folder: string, input: unknown, requested?: string, signal?: AbortSignal): Promise<EmailMovePreview>;
export declare function moveImapMessages(client: ImapFlow, folder: string, input: unknown, target: string, expected: number, signal?: AbortSignal): Promise<EmailMoveResult>;
