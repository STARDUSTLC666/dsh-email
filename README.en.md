# dsh-email

[中文](README.md)

![dsh-email whale girl plugin cover](https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/cover-whale-girl.png)

Browse, send, search and organize email from DSH with IMAP/SMTP and AgentMail accounts.

[![npm](https://img.shields.io/npm/v/dsh-email)](https://www.npmjs.com/package/dsh-email) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-email-downloads.svg)](https://www.npmjs.com/package/dsh-email)

Feedback and contributions are welcome: report [issues](https://github.com/STARDUSTLC666/dsh-email/issues) or submit [pull requests](https://github.com/STARDUSTLC666/dsh-email/pulls).


See the [0.18.0 validation record](docs/validation/0.18.0.md) for browser and simulated mailbox protocol checks on official DSH `0.2.1-rc.2` and the remaining limits.

Open the new native sidebar workbench after updating and restarting DSH. Settings remains available. See the [workbench guide and validation boundaries](docs/WORKBENCH.md).

## What it does

- Read, send, reply and forward using IMAP and SMTP.
- Add AgentMail US/EU inboxes with an email address and API key, without IMAP/SMTP setup.
- Browse Inbox/Sent, page/search messages, read plain text, download attachments and set read/star flags in Mailbox.
- Manage attachments, search results and mailbox organization.
- Scan headers in batches when server search is unreliable, report coverage and continue into older mail.
- Configure multiple accounts, Outlook OAuth2, encrypted Windows login tokens and send approval.
- Turn new-mail popups off in settings; the preference survives restarts.
- Prepare and edit local drafts, review To/Cc, content and attachment bytes, then confirm sending.
- Manage trusted and blocked recipients per account and preview address, group and Cc matches.

## Install

In DSH Desktop, install `dsh-email` from the Plugins panel. If the bundled dsh command is available:

```bash
dsh plugin --profile desktop add dsh-email
```

For the web version, replace `desktop` with `web`. Restart DSH after installation.

## Start using it

Add and test an account in Settings → Email, then open Mailbox. Ask to list unread messages or prepare a reply. Reply buttons create drafts for review before sending.

To edit before sending, ask: “Prepare a message with email_draft; do not send yet.” Open Drafts to save edits, inspect attachments and confirm. See [drafts and recipient rules](docs/DRAFTS.en.md).

## Requirements and configuration

IMAP accounts require mail credentials, an app password or provider OAuth authorization. AgentMail requires its regional inbox address and API key; see [AgentMail setup](docs/AGENTMAIL.en.md). Mail authentication is separate from the DSH model API key.

Detailed configuration, tool arguments and troubleshooting are in the [usage guide](docs/USAGE.en.md). For standalone development, follow the Node requirement in [package.json](package.json).

## Documentation

- [Usage and troubleshooting](docs/USAGE.en.md)
- [Changelog](CHANGELOG.md)
- [Validation scope and history](docs/VALIDATION.md)
- [Report a problem or suggest a feature](https://github.com/STARDUSTLC666/dsh-email/issues)

## Plugin updates

Requires DSH 0.2.1-rc.3 or newer. Each plugin provides its own check, release-note and confirmed-install controls on its page or in settings. Preferences are independent. Automatic checks are on by default; **automatic installation is off by default**. Explicitly enabled automatic updates only install compatible stable patches while idle with no unsaved changes. Disable, defer or ignore reminders per plugin. DSH is never restarted or upgraded automatically, and local-source installs are preserved. Suite components clearly direct updates through Suite.

Older releases need one manual update in native plugin management to acquire these controls. Publishing to npm does not replace an existing user installation.

## License

[MIT](LICENSE)
