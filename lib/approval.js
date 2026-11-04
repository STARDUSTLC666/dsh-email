import { matchRecipients, parseRecipientPolicies } from './recipient-policy.js';
export function installSendApproval(ctx, runtime) {
    ctx.on('tools/pre-execute', async (exec, next) => {
        if (exec?.name !== 'email_send' && exec?.name !== 'email_reply')
            return next();
        const value = runtime.getSettingsValue();
        try {
            runtime.getEffectiveSettings();
        }
        catch {
            return next(); // unconfigured: let the tool report the actionable hint
        }
        if (exec.name === 'email_send') {
            const args = (exec.arguments ?? {});
            try {
                const settings = runtime.getEffectiveSettings(), account = typeof args.account === 'string' && args.account.trim() ? args.account.trim() : settings.defaultAccount;
                if (settings.accounts.has(account) && typeof args.to === 'string' && (args.cc === undefined || typeof args.cc === 'string')) {
                    const policy = parseRecipientPolicies(value.trustedRecipientsYaml).get(account);
                    if (policy) {
                        const matching = await matchRecipients(args.to, args.cc ?? '', policy);
                        if (matching.blocked)
                            return { kind: 'deny', reason: '收件人被禁止规则拦截，邮件未发送：' + matching.rows.filter(row => row.blocked).map(row => row.address).join(', ') };
                        if (matching.skipsApproval)
                            return next();
                    }
                }
            }
            catch { /* Invalid rules or addresses keep the usual approval; never grant trust on a parse failure. */ }
        }
        if (value.sendApproval === false)
            return next();
        const replyHint = exec.name === 'email_reply' ? ' 可信收件人免审仅适用于 email_send；回复、回复全部和转发仍需确认，可改在草稿页预览收件人并手动发送。' : '';
        let reason;
        if (exec.name === 'email_send') {
            const args = (exec.arguments ?? {});
            const attachCount = Array.isArray(args.attachments) ? args.attachments.length : 0;
            reason = '发送邮件给 ' + args.to + (args.cc ? '，抄送 ' + args.cc : '') + '，主题「' + args.subject + '」' + (attachCount > 0 ? '，附件 ' + attachCount + ' 个' : '');
        }
        else {
            const args = (exec.arguments ?? {});
            const mode = typeof args.mode === 'string' && args.mode.trim() !== '' ? args.mode.trim().toLowerCase() : 'reply';
            const modeLabel = mode === 'forward' ? '转发' : mode === 'reply-all' ? '回复全部' : '回复';
            reason = modeLabel + '邮件（原邮件 uid=' + args.uid + '）' + (mode === 'forward' && typeof args.to === 'string' && args.to.trim() !== '' ? '，收件人 ' + args.to : '');
        }
        // Gate-owned approval: we run the approval round-trip ourselves so the
        // denial reason is always honest and actionable — including the Full
        // Access case where the harness policy answers 'rejected' without ever
        // showing a dialog.
        const approval = ctx.get('approval');
        if (approval === undefined) {
            return {
                kind: 'deny',
                reason: exec.name + ' 需要确认，但当前环境没有审批通道（如 headless）。' + replyHint,
            };
        }
        const outcome = await approval.request({
            agent: exec.agent,
            toolName: exec.name,
            callId: exec.callId,
            reason,
            signal: exec.signal,
        });
        if (outcome === 'allowed-once')
            return next();
        if (outcome === 'cancelled')
            return { kind: 'deny', reason: '发信确认被取消，邮件未发送。' };
        if (outcome === 'unavailable')
            return { kind: 'deny', reason: '发信确认不可用（没有可用的审批界面），邮件未发送。' + replyHint };
        return {
            kind: 'deny',
            reason: '发信未获批准：要么你拒绝了，要么当前会话处于 Full Access（审批策略 never，不会弹框）。可切回支持确认的权限模式，或在草稿页预览并手动发送。' + replyHint,
        };
    }, { prepend: true });
}
