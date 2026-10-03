# Drafts and recipient rules

[Overview](../README.en.md) · [中文](DRAFTS.md)

## Edit before sending

Ask the assistant to use `email_draft`, or create a draft in Settings → Email → Drafts. The tool only saves a local draft; it does not submit mail. Parameters are `to`, `subject`, `text`, with optional `account`, `cc`, and an `attachments` array of local paths.

1. Choose the sender account, edit To/Cc, subject and plain text, then save.
2. Add attachments. Browser uploads become plugin-owned copies; tool-supplied paths remain references to the original files.
3. Review the actual sender and display name, every expanded To/Cc address, content, attachment names and sizes. Download preview attachments to inspect them.
4. Acknowledge the review and confirm sending. Drafts require manual confirmation even when all recipients match trusted rules.

Downloads and sending use the same attachment bytes. A preview lasts 10 minutes; review again after changing the draft, account or saved rules. Closing Settings preserves unsaved edits within the current page session; save before refreshing or closing the application.

## Receipts and uncertainty

Receipts list addresses the SMTP server accepted and rejected. Acceptance confirms submission, not inbox delivery. A partially rejected message is never automatically resent.

A timeout, disconnect or interrupted application without a complete receipt produces an uncertain result. Check the mailbox first. Submitted drafts cannot be directly sent again; explicitly copy to a new draft when needed, then review and confirm. Copies have independent attachment copies.

Version checks prevent one window from overwriting another's changes. Your input remains after a conflict; continue editing or explicitly discard it to reopen the saved version.

## Trusted recipients per account

Save complete addresses or domains, one per line. Matching preserves address local-part case. Domains use lowercase/IDN normalization; `example.com` excludes `sub.example.com`. Display names cannot impersonate mailboxes; every group member and every Cc address is checked.

Approval is the default. Only saved rules with explicit opt-in and a match for every To/Cc address skip this plugin's `email_send` approval. Host permissions still apply. `email_reply` retains its approval flow. If global `sendApproval` is off, these rules do not add another gate.

Check matches tests current edits without sending mail or changing saved rules. When switching accounts, choose whether to save, discard or retain unsaved edits.

The profile field is `trustedRecipientsYaml`, keyed by account name:

```yaml
trustedRecipientsYaml: |
  work:
    skipApproval: true
    addresses:
      - colleague@example.com
    domains:
      - team.example.com
```

Renaming an account does not transfer old rules. Rule changes do not reconnect the mailbox.

## Storage and limits

Drafts live at `DSH_HOME/data/dsh-email/drafts-v1.json`, with uploads under `draft-uploads`. Without DSH_HOME the default is `~/.dsh`. Profiles sharing DSH_HOME share drafts; accounts resolve against the current profile and the actual identity appears in review.

Limits are 50 drafts, 100 KiB of text, and 10 attachments totaling 20 MiB per draft. A smaller `maxAttachmentBytes` setting wins. File locks and atomic replacement protect concurrent processes. Corrupt storage is preserved with an error rather than silently reset.

Deletion removes the local draft and plugin-uploaded copies, retaining original files and mailbox messages. This workbench composes new messages; reply/reply-all/forward retain `email_reply` and its original threading behavior.

See [0.15.0 validation](validation/0.15.0.md) for tested and unverified environments.
