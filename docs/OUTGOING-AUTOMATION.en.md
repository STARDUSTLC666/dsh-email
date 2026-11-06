# Rich outgoing mail and optional automation

[README](../README.en.md) · [中文](OUTGOING-AUTOMATION.md)

## Compose, reply and forward

Open mail in the workbench, choose Reply / Reply all / Forward, then edit the draft. Select HTML or plain text. HTML may include a plain-text alternative; one is derived when omitted. Save and review the actual sender, all To/Cc, content and attachments before confirming. Saving or previewing does not send.

Safe paragraphs, links, lists, tables and common inline text/border/spacing styles are preserved. Scripts, events, forms, unsafe links, remote images and CSS URLs are removed. The preview renders inert structured nodes. Delivery uses MIME text/HTML alternatives. Reply drafts retain thread references; forwarded messages are not forced to use In-Reply-To.

Quote language can follow the UI or explicitly use Chinese, English or French. Set an optional IANA timezone. Tools accept locale/timeZone overrides. Account preferences take priority; unknown server-side locale defaults to English. Dates and missing-date placeholders are localized.

`email_send`, `email_reply` and `email_draft` accept optional html, including HTML-only input. A draft's reply object accepts uid/folder/mode for associated replies and forwards. Trusted reply skipping is off by default; opt in separately. Every actual To/Cc must match a saved skipApproval policy. Block rules and DSH permissions still apply. Reviewed reply envelopes are pinned rather than re-resolved after confirmation.

## Schedule after review

Save a draft with a local date/time, review the complete time/timezone and content, then confirm scheduling. Scheduled drafts are read-only; cancel the schedule before editing. `email_schedule` supports schedule/list/cancel and always asks for approval. A draft's sendAt is only a proposal. Tool timestamps require ISO timezone information, from 30 seconds to one year ahead.

Jobs and reviewed attachment copies are persistent. Account, rules and attachment hashes are checked before submission. Keep DSH running: missed times after restart or a delay over five minutes require confirmation again. Uncertain SMTP outcomes are never retried automatically. Receipts mean server acceptance, not final delivery. Cancellation cannot retract a message already entering SMTP.

## Google sign-in

Existing Gmail app-password accounts are unchanged. For OAuth, select OAuth2 on the Gmail account card. Create your own Google Cloud **Desktop app** client and consent configuration, including your test user and Gmail scope. Enter its client ID and client secret if issued. Choose Sign in with Google, open the authorization link, and authorize the same mailbox as configured. Return to DSH, wait for the state update and test the connection.

The plugin uses authorization code + PKCE, random state and a random loopback port. It verifies the signed-in mailbox through Google's userinfo endpoint. Scopes are full Gmail mail access plus openid/email for identity checking. Tokens are separate from account YAML; Windows storage uses current-user DPAPI. No borrowed Google client registration is bundled. Cancellation and account changes prevent stale flows from restoring deleted credentials. Google controls testing-token lifetimes, consent verification and organization restrictions. App passwords remain available to eligible accounts.

References: [native OAuth](https://developers.google.com/identity/protocols/oauth2/native-app), [Gmail mail OAuth](https://developers.google.com/workspace/gmail/imap/imap-smtp), [app passwords](https://support.google.com/mail/answer/185833). Protocol and loopback callback testing used simulated responses; no live Google application/mailbox authorization was completed.

## Tencent enterprise mail

Select exmail for IMAP imap.exmail.qq.com:993, SMTP smtp.exmail.qq.com:465 or POP3 pop.exmail.qq.com:995, with TLS. Use your full enterprise address and provider-required credentials. Admin protocol settings still apply. Custom presets and explicit endpoints remain available. Configuration/protocol paths are covered; no real enterprise account was used.

## Mail-triggered DSH tasks

This feature is off by default. Choose the receiving account/folder, whitelist exact sender addresses (empty means only the mailbox itself), and save aliases pointing to existing absolute workspace directories. Generate and privately store the task key, displayed once; only its verifier is stored. Rotation disables tasks and invalidates the previous key. Enable explicitly and save. The first scan establishes a baseline without executing old mail.

The subject prefix defaults to dsh and is configurable in the same panel. Automatic result delivery asks the model for a safe HTML fragment and sanitizes it, with a plain-text alternative.

Send new mail with subject dsh:alias and begin its body with `DSH-Key: your-task-key`, followed by the task. Both sender and key must match. Tasks run in ordinary DSH sessions using the default preset/model and normal permission questions. This may incur model usage. Open the session from the task list to handle approvals. Continue an idle session with subject dsh:alias:sessionId; its workspace must match the alias.

The key authorizes whitelisted senders to initiate work in approved directories. Keep it private. Key material and quoted history are removed before model admission; the task ledger does not store prompts, while normal DSH sessions do. Automatic final-result email is a separate opt-in: only the authorized sender receives a safe HTML/plain-text response, with no Cc, no original secret-bearing quote and recipient blocks enforced. It preserves threading and includes a copyable continuation subject containing the session ID. SMTP also sets that subject. AgentMail's reply API retains its original subject, so copy the continuation subject from the body for later tasks. Uncertain replies are not retried.

Advanced all/any rules can match subject/body/from/to/cc with contains/equals/regex. Named captures become ${name} placeholders in workspace/session/prompt templates; ${body} is stripped body text. Workspace results must still match an approved alias. Regex evaluation runs in a bounded worker.

Keep DSH running. The ledger holds at most 200 records; finished records can be cleared. Polls inspect the latest 100 messages and pause on a coverage gap. Duplicate mail is not re-executed. Restarted in-progress tasks require attention and are not replayed. Manual takeover, configuration changes, a 30-minute tracking deadline, failure or missing final text stop automatic replies; native sessions can continue in DSH. This is not an always-on unattended service. AgentMail testing remains simulated until a user supplies a real account.
