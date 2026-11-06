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
                return { kind: 'deny', reason: '草稿已改变，请重新打开后确认时间。' };
            const preview: any = await backend.action({ action: 'preview', id: draft.id, revision: draft.revision }, exec.signal);
            if (preview.matching.blocked)
                return { kind: 'deny', reason: '定时邮件包含禁止收件人，未安排发送。' };
            const approval = ctx.get('approval');
            if (!approval)
                return { kind: 'deny', reason: '定时发送需要确认；当前没有审批界面，请在邮件草稿页预览并确认时间。' };
            const decision = await approval.request({ agent: exec.agent, toolName: exec.name, callId: exec.callId, signal: exec.signal, reason: '定时发送 ' + sendAt + '，账号 ' + draft.account + '，收件人 ' + draft.to + (draft.cc ? '，抄送 ' + draft.cc : '') + '，主题「' + draft.subject + '」；DSH 必须保持运行。正文预览：\n' + String(preview.body?.text || draft.text).slice(0, 2000) });
            if (decision !== 'allowed-once')
                return { kind: 'deny', reason: '定时发送未获确认，未安排发送。可在草稿页预览后手动确认。' };
            approved.set(args, { id: draft.id, preview: preview.id, sendAt, expires: Date.now() + 60000 });
            return next();
        }
        catch {
            return { kind: 'deny', reason: '无法核对定时邮件，请检查草稿、账号与包含时区的未来时间；未安排发送。' };
        }
    }, { prepend: true });
}
export function scheduleTool(backend: Backend): EmailToolDefinition {
    return {
        name: 'email_schedule', description: 'Manage confirmed scheduled emails on this DSH host. First create an email_draft, then schedule its id at an explicit ISO 8601 timezone-qualified sendAt. Scheduling always asks for approval; list/cancel never send. DSH must stay running; missed times after restart require a new confirmation. Never retry an uncertain send automatically.',
        parameters: { type: 'object', properties: { action: { type: 'string', enum: ['schedule', 'list', 'cancel'] }, id: { type: 'string' }, revision: { type: 'integer' }, sendAt: { type: 'string', description: 'ISO 8601 with explicit timezone, at least 30 seconds ahead' } }, required: ['action'], additionalProperties: false },
        output: { schema: { type: 'object', additionalProperties: true }, render: (_args: any, value: any) => [{ type: 'text', text: value.draft?.state === 'scheduled' ? '已确认定时发送：' + value.draft.sendAt + '。请保持 DSH 运行。' : value.draft?.state === 'draft' ? '定时已取消，邮件未发送。' : '定时邮件：' + JSON.stringify(value.drafts || []) }] },
        timeoutMs: 60000,
        async execute(input: any, exec: any) {
            if (input.action === 'list')
                return { drafts: (await backend.store.list()).filter(d => ['scheduled', 'sending', 'uncertain'].includes(d.state)).map(d => ({ id: d.id, revision: d.revision, state: d.state, sendAt: d.sendAt, account: d.account, to: d.to, subject: d.subject, error: d.error })) };
            if (input.action === 'cancel') {
                const d = await backend.store.get(input.id);
                return { draft: await backend.action({ action: 'cancelSchedule', id: d.id, revision: input.revision ?? d.revision }, exec?.signal) };
            }
            if (input.action !== 'schedule')
                throw new Error('请选择 schedule、list 或 cancel');
            const grant = approved.get(input);
            approved.delete(input);
            if (!grant || grant.expires < Date.now())
                throw new Error('定时发送尚未确认或确认已过期；请重试，或在草稿页确认');
            return backend.action({ action: 'schedule', id: grant.id, preview: grant.preview, sendAt: grant.sendAt, confirmed: true }, exec?.signal);
        },
    };
}
