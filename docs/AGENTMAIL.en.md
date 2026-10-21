# AgentMail and the mailbox workbench

[Overview](../README.en.md) · [中文](AGENTMAIL.md) · [Validation](validation/0.18.0.md)

## Setup

Create or select an inbox and obtain its regional API key in AgentMail. In Settings → Email → Accounts, select **AgentMail (US API)** or **AgentMail (EU API)**, enter the email address and API key, and run **Test connection**. The test reads the selected inbox without sending mail.

US uses `https://api.agentmail.to`; EU uses `https://api.agentmail.eu`. Custom API endpoints are not accepted. Keys are stored in local account configuration, separately from model and IMAP credentials. A blank key in the card retains the saved key. Switching between an API and an IMAP provider clears the previous authentication data.

```yaml
bot:
  provider: agentmail
  user: assistant@agentmail.to
  apiKey: YOUR_AGENTMAIL_API_KEY
defaultAccount: bot
```

Single-account setup may use `DSH_AGENTMAIL_API_KEY`. Named accounts do not inherit that environment fallback. Existing IMAP/SMTP accounts retain numeric UIDs; AgentMail uses opaque string `message_id` values returned as `uid`. Pass them unchanged. AgentMail manages the sender display name on the inbox itself.

## Read and send

Mailbox provides account/folder selection, Inbox/Sent shortcuts, paging, search, plain-text reading, read/star flags, and attachment downloads. Views are INBOX, Sent, Starred, Archive and All. HTML/scripts are never executed as mail content. UI downloads go to the browser; `email_attachment` still returns a local file path to tools.

Compose and reply buttons create local drafts. Save, inspect the preview, check recipients/content/attachments, then explicitly confirm. Reply drafts retain their account, subject and thread; create a new message to change account or subject. Cancelling review never submits. Submitted drafts never retry automatically. Tool sending retains existing approval rules, host permissions and recipient deny rules.

## Limits

- API search ranks by relevance and excludes spam, trash, blocked and unauthenticated mail. There is no IMAP header/body fallback. Use `offset`, not `headerScanOffset`. `count` is not the full mailbox size: inspect `hasMore` and `countExact`.
- List/search is bounded at 201 API pages; narrow the query/date range when exceeded. Mailbox changes can affect paging.
- Sending permits at most 10 files / 4 MiB of raw attachments, or a smaller configured limit; the full JSON request cap is 6 MB. Downloads are capped at 20 MiB per file or a smaller configured limit. Upload/review rejects oversized attachments before confirmation.
- Archive maps only INBOX → Archive using labels, not arbitrary IMAP move/delete/EXPUNGE operations.
- New-mail checks seed a silent baseline, drain backlogs without repeats and keep tool/browser cursors independent. Checks inspect at most 5000 arrivals. A missing baseline is an actionable error; verify the mailbox and reset notifications. `totalUnreadExact:false` reports a lower bound from the scanned window.
- A receipt confirms submission, not final delivery. Check Sent before retrying an uncertain send.
- This release has simulated HTTP/IMAP and real-host browser acceptance, as requested without a real AgentMail account. Regional access, quotas, actual delivery and remote attachment service remain unverified.

References: official [inboxes](https://docs.agentmail.to/inboxes), [messages](https://docs.agentmail.to/messages), [search](https://docs.agentmail.to/api-reference/inboxes/messages/search), [reply](https://docs.agentmail.to/api-reference/inboxes/messages/reply), and [attachments](https://docs.agentmail.to/api-reference/inboxes/messages/get-attachment).
