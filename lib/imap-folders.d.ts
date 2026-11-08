import type { ImapFlow } from 'imapflow';
export interface FolderMutationSnapshot {
    account: string;
    path: string;
    action: 'delete' | 'purge';
    uidValidity: number;
    uids: number[];
    count: number;
}
interface Folder {
    path: string;
    specialUse?: string;
    delimiter?: string | false;
}
export declare function folderPath(value: unknown): string;
export declare function assertCustomFolder(path: string, rows: Folder[], leaf?: boolean): void;
export declare function previewFolderMutation(client: ImapFlow, account: string, path: string, action: 'delete' | 'purge', signal?: AbortSignal): Promise<FolderMutationSnapshot>;
export declare function purgeConfirmedFolder(client: ImapFlow, expected: FolderMutationSnapshot, signal?: AbortSignal): Promise<{
    count: number;
}>;
export {};
