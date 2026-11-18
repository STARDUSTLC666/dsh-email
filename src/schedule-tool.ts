import type { EmailDraftBackend } from './draft-web.js';
import type { EmailToolDefinition } from './tools.js';
import { scheduledTime } from './scheduled-time.js';
type Backend = Pick<EmailDraftBackend, 'action' | 'store'>;
const approved = new WeakMap<object, {
    id: string;
    preview: string;
    sendAt: string;
    expires: number;
}>();
/** Uses the same host approval pipeline as immediate mail; no reusable public grant. */
export function installScheduleApproval(ctx: any, backend: Backend): void {
    ctx.on('tools/pre-execute', async (exec: any, next: () => Promise<any>) => {
        if (exec.name !== 'email_schedule' || exec.arguments?.action !== 'schedule')
            return next();
        const args = exec.arguments;
        try {
            const sendAt = scheduledTime(args.sendAt, Date.now()), draft = await backend.store.get(args.id);
            if (args.revision !== undefined && args.revision !== draft.revision)
                return { kind: 'deny', reason: 'Draft changed; reopen it and confirm the time.' };
            const preview: any = await backend.action({ action: 'preview', id: draft.id, revision: draft.revision }, exec.signal);
            if (preview.matching.blocked)
                return { kind: 'deny', reason: 'The scheduled email includes blocked recipients; nothing was scheduled.' };
            const approval = ctx.get('approval');
            if (!approval)
                return { kind: 'deny', reason: 'Scheduling needs approval, and there is no approval UI here. Preview and confirm the time on the email drafts page.' };
            const decision = await approval.request({ agent: exec.agent, toolName: exec.name, callId: exec.callId, signal: exec.signal, reason: 'Schedule for ' + sendAt + ', account ' + draft.account + ', to ' + draft.to + (draft.cc ? ', cc ' + draft.cc : '') + ', subject "' + draft.subject + '"; DSH must stay running. Body preview:\n' + String(preview.body?.text || draft.text).slice(0, 2000) });
            if (decision !== 'allowed-once')
                return { kind: 'deny', reason: 'Scheduling was not confirmed; nothing was scheduled. Preview on the drafts page and confirm manually.' };
            approved.set(args, { id: draft.id, preview: preview.id, sendAt, expires: Date.now() + 60000 });
            return next();
        }
        catch {
            return { kind: 'deny', reason: 'Cannot verify the scheduled email; check the draft, the account and a future time with an explicit timezone. Nothing was scheduled.' };
        }
    }, { prepend: true });
}
export function scheduleTool(backend: Backend): EmailToolDefinition {
    return {
        name: 'email_schedule', description: 'Manage confirmed scheduled emails on this DSH host. First create an email_draft, then schedule its id at an explicit ISO 8601 timezone-qualified sendAt. Scheduling always asks for approval; list/cancel never send. DSH must stay running; missed times after restart require a new confirmation. Never retry an uncertain send automatically.',
        parameters: { type: 'object', properties: { action: { type: 'string', enum: ['schedule', 'list', 'cancel'] }, id: { type: 'string' }, revision: { type: 'integer' }, sendAt: { type: 'string', description: 'ISO 8601 with explicit timezone, at least 30 seconds ahead' } }, required: ['action'], additionalProperties: false },
        output: { schema: { type: 'object', additionalProperties: true }, render: (_args: any, value: any) => [{ type: 'text', text: value.draft?.state === 'scheduled' ? 'Scheduled: ' + value.draft.sendAt + '. Keep DSH running.' : value.draft?.state === 'draft' ? 'Schedule cancelled; no email sent.' : 'Scheduled emails: ' + JSON.stringify(value.drafts || []) }] },
        timeoutMs: 60000,
        async execute(input: any, exec: any) {
            if (input.action === 'list')
                return { drafts: (await backend.store.list()).filter(d => ['scheduled', 'sending', 'uncertain'].includes(d.state)).map(d => ({ id: d.id, revision: d.revision, state: d.state, sendAt: d.sendAt, account: d.account, to: d.to, subject: d.subject, error: d.error })) };
            if (input.action === 'cancel') {
                const d = await backend.store.get(input.id);
                return { draft: await backend.action({ action: 'cancelSchedule', id: d.id, revision: input.revision ?? d.revision }, exec?.signal) };
            }
            if (input.action !== 'schedule')
                throw new Error('Choose schedule, list or cancel');
            const grant = approved.get(input);
            approved.delete(input);
            if (!grant || grant.expires < Date.now())
                throw new Error('Scheduling was not confirmed, or the confirmation expired; retry, or confirm on the drafts page');
            return backend.action({ action: 'schedule', id: grant.id, preview: grant.preview, sendAt: grant.sendAt, confirmed: true }, exec?.signal);
        },
    };
}
