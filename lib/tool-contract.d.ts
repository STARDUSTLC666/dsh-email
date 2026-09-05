/** Model-facing parameters, input normalization, output schemas and text rendering. */
import type { EmailAttachmentResult, EmailFoldersResult, EmailListResult, EmailMarkAction, EmailMarkResult, EmailReadResult, EmailReplyMode, EmailReplyResult, EmailSearchResult, EmailSendResult, EmailWatchResult } from './types.js';
export type TextBlock = {
    type: 'text';
    text: string;
};
export declare const MAX_LIMIT = 100;
export declare const ACCOUNT_HINT = "\u8D26\u53F7\u540D\uFF08\u914D\u7F6E\u4E86 accounts \u591A\u4E2A\u8D26\u53F7\u65F6\u9009\u62E9\uFF09\uFF0C\u7701\u7565\u65F6\u7528 defaultAccount\u3002\u53EF\u7528\u8D26\u53F7\u89C1 email_folders \u7684\u62A5\u9519\u6216\u63D2\u4EF6 README";
/** Parse date-only or ISO input; an inclusive end date maps to the next UTC day. */
export declare function parseEmailDay(input: string, label: string, endInclusive?: boolean): Date;
export declare function executionSignal(exec: unknown): AbortSignal | undefined;
interface ParameterProperty {
    type?: string;
    required?: boolean;
    description?: string;
    items?: {
        type?: string;
    } | null;
}
export declare function compileParameters(spec: Record<string, ParameterProperty>): Record<string, unknown>;
export declare function normalizeAttachmentPaths(value: unknown): string[] | undefined;
export declare const strArray: {
    type: string;
    items: {
        type: string;
    };
};
export declare const addrArray: {
    type: string;
    items: {
        type: string;
        additionalProperties: boolean;
    };
};
export declare const messageShape: {
    uid: {
        type: string;
    };
    date: {
        type: string;
    };
    from: {
        type: string;
        items: {
            type: string;
            additionalProperties: boolean;
        };
    };
    subject: {
        type: string;
    };
    seen: {
        type: string;
    };
    flagged: {
        type: string;
    };
    size: {
        type: string;
    };
    hasAttachments: {
        type: string;
    };
};
export declare const listSchema: {
    type: string;
    properties: {
        account: {
            type: string;
        };
        count: {
            type: string;
        };
        folder: {
            type: string;
        };
        messages: {
            type: string;
            items: {
                type: string;
                properties: {
                    uid: {
                        type: string;
                    };
                    date: {
                        type: string;
                    };
                    from: {
                        type: string;
                        items: {
                            type: string;
                            additionalProperties: boolean;
                        };
                    };
                    subject: {
                        type: string;
                    };
                    seen: {
                        type: string;
                    };
                    flagged: {
                        type: string;
                    };
                    size: {
                        type: string;
                    };
                    hasAttachments: {
                        type: string;
                    };
                };
                additionalProperties: boolean;
            };
        };
    };
    additionalProperties: boolean;
};
export declare const readSchema: {
    type: string;
    properties: {
        account: {
            type: string;
        };
        uid: {
            type: string;
        };
        folder: {
            type: string;
        };
        date: {
            type: string;
        };
        from: {
            type: string;
            items: {
                type: string;
                additionalProperties: boolean;
            };
        };
        to: {
            type: string;
            items: {
                type: string;
                additionalProperties: boolean;
            };
        };
        cc: {
            type: string;
            items: {
                type: string;
                additionalProperties: boolean;
            };
        };
        subject: {
            type: string;
        };
        text: {
            type: string;
        };
        attachments: {
            type: string;
            items: {
                type: string;
                additionalProperties: boolean;
            };
        };
        truncated: {
            type: string;
        };
    };
    additionalProperties: boolean;
};
export declare const sendSchema: {
    type: string;
    properties: {
        account: {
            type: string;
        };
        messageId: {
            type: string;
        };
        accepted: {
            type: string;
            items: {
                type: string;
            };
        };
        rejected: {
            type: string;
            items: {
                type: string;
            };
        };
        response: {
            type: string;
        };
    };
    additionalProperties: boolean;
};
export declare const foldersSchema: {
    type: string;
    properties: {
        account: {
            type: string;
        };
        folders: {
            type: string;
            items: {
                type: string;
                properties: {
                    name: {
                        type: string;
                    };
                    path: {
                        type: string;
                    };
                    specialUse: {
                        type: string;
                    };
                    subscribed: {
                        type: string;
                    };
                };
                additionalProperties: boolean;
            };
        };
    };
    additionalProperties: boolean;
};
export declare const attachmentSchema: {
    type: string;
    properties: {
        account: {
            type: string;
        };
        uid: {
            type: string;
        };
        filename: {
            type: string;
        };
        contentType: {
            type: string;
        };
        size: {
            type: string;
        };
        path: {
            type: string;
        };
    };
    additionalProperties: boolean;
};
export declare const markSchema: {
    type: string;
    properties: {
        account: {
            type: string;
        };
        uid: {
            type: string;
        };
        folder: {
            type: string;
        };
        action: {
            type: string;
        };
        seen: {
            type: string;
        };
        flagged: {
            type: string;
        };
        movedTo: {
            type: string;
        };
        movedUid: {
            type: string;
        };
    };
    additionalProperties: boolean;
};
export declare const MARK_ACTIONS: EmailMarkAction[];
export declare const REPLY_MODES: EmailReplyMode[];
export declare const MARK_LABELS: Record<EmailMarkAction, string>;
export declare const REPLY_LABELS: Record<EmailReplyMode, string>;
export declare function oneText(text: string): TextBlock[];
export declare function describeMessage(message: EmailListResult['messages'][number]): string;
export declare function renderList(value: EmailListResult): TextBlock[];
export declare function renderRead(value: EmailReadResult): TextBlock[];
export declare function renderSearch(value: EmailSearchResult): TextBlock[];
export declare function renderSend(value: EmailSendResult): TextBlock[];
export declare function renderFolders(value: EmailFoldersResult): TextBlock[];
export declare function renderAttachment(value: EmailAttachmentResult): TextBlock[];
export declare function renderMark(value: EmailMarkResult): TextBlock[];
export declare function renderReply(value: EmailReplyResult): TextBlock[];
export declare function renderWatch(value: EmailWatchResult): TextBlock[];
export declare const renderHealth: (_args: unknown, value: unknown) => TextBlock[];
export declare const replySchema: {
    type: string;
    properties: {
        account: {
            type: string;
        };
        mode: {
            type: string;
        };
        originalUid: {
            type: string;
        };
        messageId: {
            type: string;
        };
        accepted: {
            type: string;
            items: {
                type: string;
            };
        };
        rejected: {
            type: string;
            items: {
                type: string;
            };
        };
        response: {
            type: string;
        };
        to: {
            type: string;
            items: {
                type: string;
            };
        };
        subject: {
            type: string;
        };
    };
    additionalProperties: boolean;
};
export declare const watchSchema: {
    type: string;
    properties: {
        account: {
            type: string;
        };
        folder: {
            type: string;
        };
        firstRun: {
            type: string;
        };
        newCount: {
            type: string;
        };
        totalUnread: {
            type: string;
        };
        messages: {
            type: string;
            items: {
                type: string;
                properties: {
                    uid: {
                        type: string;
                    };
                    date: {
                        type: string;
                    };
                    from: {
                        type: string;
                        items: {
                            type: string;
                            additionalProperties: boolean;
                        };
                    };
                    subject: {
                        type: string;
                    };
                    seen: {
                        type: string;
                    };
                    flagged: {
                        type: string;
                    };
                    size: {
                        type: string;
                    };
                    hasAttachments: {
                        type: string;
                    };
                };
                additionalProperties: boolean;
            };
        };
    };
    additionalProperties: boolean;
};
export declare const descriptions: {
    email_list: string;
    email_read: string;
    email_mark: string;
    email_search: string;
    email_send: string;
    email_reply: string;
    email_folders: string;
    email_health: string;
    email_attachment: string;
    email_watch: string;
};
export declare const parameters: {
    email_list: Record<string, unknown>;
    email_read: Record<string, unknown>;
    email_mark: Record<string, unknown>;
    email_search: Record<string, unknown>;
    email_send: Record<string, unknown>;
    email_reply: Record<string, unknown>;
    email_folders: Record<string, unknown>;
    email_health: Record<string, unknown>;
    email_attachment: Record<string, unknown>;
    email_watch: Record<string, unknown>;
};
export {};
