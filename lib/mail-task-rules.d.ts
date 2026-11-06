export interface TaskCondition {
    field: 'subject' | 'body' | 'from' | 'to' | 'cc';
    op: 'contains' | 'equals' | 'regex';
    value: string;
}
export interface TaskRule {
    mode: 'all' | 'any';
    conditions: TaskCondition[];
    workspace: string;
    prompt?: string;
    session?: string;
}
export interface TaskMatch {
    workspace: string;
    prompt: string;
    sessionId?: string;
}
export declare function validateTaskRules(value: unknown): TaskRule[];
/** User regexes never run on the host's main thread. */
export declare function matchTaskRules(rules: TaskRule[], fields: Record<string, string>, signal?: AbortSignal): Promise<TaskMatch | undefined>;
