# dsh-email

[中文](README.md)

![dsh-email whale girl plugin cover](https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/cover-whale-girl.png)

Manage IMAP/SMTP and AgentMail accounts in the DSH email workbench. Browse inbox and sent mail, search messages, download attachments and review local drafts before explicitly confirming delivery.

[![npm](https://img.shields.io/npm/v/dsh-email)](https://www.npmjs.com/package/dsh-email) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-email-downloads.svg)](https://www.npmjs.com/package/dsh-email)

Feedback and contributions are welcome: report [issues](https://github.com/STARDUSTLC666/dsh-email/issues) or submit [pull requests](https://github.com/STARDUSTLC666/dsh-email/pulls).

Open the workbench from the native DSH sidebar. See the [workbench guide](docs/WORKBENCH.md) for configuration and operating boundaries.

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

Requires DSH 0.2.1-rc.3 or newer. Update controls sit at the bottom of the existing workbench, or native plugin details for plugins without a workbench. Checks, release notes and preferences expand in place, with no separate update page or settings menu. Automatic checks are on by default; **automatic installation is off by default**. Only explicit opt-in permits compatible stable patches while idle with no unsaved changes. Preferences are independent, with per-plugin disable, deferral and ignore controls. No forced DSH restart or upgrade, and local-source installations stay unchanged. Suite components explain and operate on the whole Suite in the same footer.

Older releases need one manual update in native plugin management to acquire these controls. Publishing to npm does not replace an existing user installation.

## License

[MIT](LICENSE)
