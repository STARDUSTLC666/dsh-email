import { realpath } from 'node:fs/promises';
export interface TaskObservation {
    cwd: string;
    cursor: number;
    events: any[];
}
export interface MailTaskNative {
    available(): boolean;
    create(cwd: string): Promise<string>;
    observe(sessionId: string, afterSeq: number, signal: AbortSignal): Promise<TaskObservation>;
    state(sessionId: string, signal: AbortSignal): Promise<{
        running: boolean;
        pendingInput: string[];
        queue?: unknown;
    }>;
    prompt(sessionId: string, requestId: string, text: string, signal: AbortSignal): Promise<void>;
}
/** Public DSH services only: ordinary preset, user prompt admission, passive reads. */
export function nativeMailTasks(ctx: any): MailTaskNative {
    return {
        available: () => typeof ctx.sessionController?.create === 'function' && typeof ctx.sessionQuery?.observeSession === 'function',
        create: async (cwd) => {
            const result = await ctx.sessionController.create({ cwd });
            if (typeof result?.sessionId !== 'string')
                throw new Error('DSH did not create a session');
            return result.sessionId;
        },
        async observe(sessionId, afterSeq, signal) {
            const read = await ctx.sessionQuery.observeSession(sessionId, { signal, projectionMode: 'none' });
            try {
                if (typeof read.header?.cwd !== 'string')
                    throw new Error('Session has no workspace');
                if (afterSeq !== -2 && read.cursor - afterSeq > 4096)
                    throw new Error('会话记录超过自动追踪上限，请在 DSH 中查看 / Session exceeds tracking window');
                const events = [];
                if (afterSeq !== -2)
                    for (let i = Math.max(0, afterSeq + 1); i <= read.cursor; i++)
                        events.push(read.events[i]);
                return { cwd: await realpath(read.header.cwd), cursor: read.cursor, events };
            }
            finally {
                read[Symbol.dispose]?.();
            }
        },
        state: (sessionId, signal) => ctx.sessionController.state({ sessionId }, signal),
        async prompt(sessionId, requestId, text, signal) { await ctx.sessionController.prompt({ sessionId, requestId, content: [{ type: 'text', text }], mode: 'followup' }, signal); },
    };
}
