# dsh-email

[中文](README.md)

![dsh-email whale girl plugin cover](https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/cover-whale-girl.png)

Read, send, search and organize email from DSH with multiple accounts.

[![npm](https://img.shields.io/npm/v/dsh-email)](https://www.npmjs.com/package/dsh-email) [![downloads](https://img.shields.io/npm/dm/dsh-email)](https://www.npmjs.com/package/dsh-email)

## What it does

- Read, send, reply and forward using IMAP and SMTP.
- Manage attachments, search results and mailbox organization.
- Configure multiple accounts, Outlook OAuth2 and send approval.
- Prepare and edit local drafts, review To/Cc, content and attachment bytes, then confirm sending.
- Manage trusted recipients per account and preview address, group and Cc matches.

## Install

In DSH Desktop, install `dsh-email` from the Plugins panel. If the bundled dsh command is available:

```bash
dsh plugin --profile desktop add dsh-email
```

For the web version, replace `desktop` with `web`. Restart DSH after installation.

## Start using it

Add an account and test it in Settings → Email. Ask to list recent unread messages or prepare a reply; review recipients and content before sending.

To edit before sending, ask: “Prepare a message with email_draft; do not send yet.” Open Drafts to save edits, inspect attachments and confirm. See [drafts and recipient rules](docs/DRAFTS.en.md).

## Requirements and configuration

Requires mail credentials, an app password or provider OAuth authorization. Mail authentication is separate from the DSH model API key.

Detailed configuration, tool arguments and troubleshooting are in the [usage guide](docs/USAGE.en.md). For standalone development, follow the Node requirement in [package.json](package.json).

## Documentation

- [Usage and troubleshooting](docs/USAGE.en.md)
- [Changelog](CHANGELOG.md)
- [Validation scope and history](docs/VALIDATION.md)
- [Report a problem or suggest a feature](https://github.com/STARDUSTLC666/dsh-email/issues)

## License

[MIT](LICENSE)
