import { Worker } from 'node:worker_threads';
import { parentPort, workerData, isMainThread } from 'node:worker_threads';
export function validateTaskRules(value) {
    if (!Array.isArray(value) || value.length > 8)
        throw new Error('任务规则最多 8 条 / At most 8 rules');
    for (const raw of value) {
        if (!raw || typeof raw !== 'object' || !['all', 'any'].includes(raw.mode) || !Array.isArray(raw.conditions) || !raw.conditions.length || raw.conditions.length > 6 || typeof raw.workspace !== 'string' || raw.workspace.length > 200 || raw.prompt !== undefined && (typeof raw.prompt !== 'string' || raw.prompt.length > 4000) || raw.session !== undefined && (typeof raw.session !== 'string' || raw.session.length > 200))
            throw new Error('任务规则格式无效 / Invalid task rule');
        for (const c of raw.conditions)
            if (!c || !['subject', 'body', 'from', 'to', 'cc'].includes(c.field) || !['contains', 'equals', 'regex'].includes(c.op) || typeof c.value !== 'string' || !c.value || c.value.length > 300)
                throw new Error('任务条件格式无效 / Invalid task condition');
    }
    return value;
}
function evaluate(data) {
    const template = (s, groups) => s.replace(/\$\{([a-zA-Z][a-zA-Z0-9_]{0,63})\}/g, (_, key) => groups[key] ?? '');
    for (const rule of data.rules) {
        let groups = {}, matched = 0;
        for (const c of rule.conditions) {
            const source = data.fields[c.field] || '';
            const match = c.op === 'regex' ? new RegExp(c.value, 'iu').exec(source) : undefined;
            const ok = c.op === 'regex' ? !!match : c.op === 'equals' ? source.toLowerCase() === c.value.toLowerCase() : source.toLowerCase().includes(c.value.toLowerCase());
            if (ok) {
                matched++;
                if (match?.groups)
                    groups = { ...groups, ...match.groups };
            }
        }
        if (rule.mode === 'all' ? matched === rule.conditions.length : matched > 0)
            return { workspace: template(rule.workspace, groups), prompt: rule.prompt ? template(rule.prompt, { ...groups, body: data.fields.body, subject: data.fields.subject }) : data.fields.body, ...(rule.session ? { sessionId: template(rule.session, groups) } : {}) };
    }
}
/** User regexes never run on the host's main thread. */
export async function matchTaskRules(rules, fields, signal) {
    if (!rules.length)
        return;
    signal?.throwIfAborted();
    const worker = new Worker(new URL(import.meta.url), { workerData: { rules, fields }, resourceLimits: { maxOldGenerationSizeMb: 32, maxYoungGenerationSizeMb: 8, stackSizeMb: 2 } });
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (error, result) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            signal?.removeEventListener('abort', abort);
            void worker.terminate();
            error ? reject(error) : resolve(result);
        };
        const abort = () => finish(new Error('Task matching cancelled'));
        const timer = setTimeout(() => finish(new Error('规则匹配超时，请简化正则表达式 / Rule timed out; simplify regex')), 500);
        signal?.addEventListener('abort', abort, { once: true });
        worker.once('error', () => finish(new Error('任务规则无效 / Invalid task regex')));
        worker.once('exit', code => {
            if (!settled)
                finish(new Error('Task rule worker stopped: ' + code));
        });
        worker.once('message', value => value.error ? finish(new Error('任务规则无效 / Invalid task regex')) : finish(undefined, value.result));
    });
}
if (!isMainThread && parentPort) {
    try {
        parentPort.postMessage({ result: evaluate(workerData) });
    }
    catch {
        parentPort.postMessage({ error: true });
    }
}
