[简体中文](README.md) · **English**

# Email

> **Manage multi-account mail in DeepSeek Harness and review every draft before immediate or scheduled delivery.**

Opens in the tactile **Letter Desk (`Desk`)** airmail stack with 1-click switch to classic **3-Pane**, featuring full-protocol accounts, local SQLite pinyin Contacts autocomplete, interactive Whale-Girl **Courier**, and 13 bright styles × 8 fonts.

[![npm](https://img.shields.io/npm/v/dsh-email)](https://www.npmjs.com/package/dsh-email) [![downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-email-downloads.svg)](https://www.npmjs.com/package/dsh-email) [![total downloads](https://raw.githubusercontent.com/STARDUSTLC666/dsh-suite/npm-downloads/assets/dsh-email-total-downloads.svg)](https://www.npmjs.com/package/dsh-email)

**[Features](#features) · [Install](#install) · [Workflow](#start-using-it) · [Full guide](https://github.com/STARDUSTLC666/dsh-email/blob/main/docs/REFERENCE.en.md)**

<picture>
  <source media="(prefers-color-scheme: dark) and (max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/workflow-en-mobile-dark.svg">
  <source media="(max-width: 640px)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/workflow-en-mobile-light.svg">
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/workflow-en-dark.svg">
  <img src="https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/workflow-en-light.svg" alt="Handle mail in DSH and review replies before sending. · workflow illustration" width="100%">
</picture>

## Features

| Pillar | Capabilities |
| :--- | :--- |
| **Multi-Protocol Accounts** | IMAP / POP3 / SMTP, Google & Outlook OAuth, AgentMail, Tencent enterprise presets, **one-click server auto-detection** (offline DB / MX / SRV / Autoconfig / ISPDB), plus manual **Custom server** endpoints |
| **Letter Desk (`Desk`) Triage** | Stacked airmail cards (drag left to skip, right to unfold, `Space`/`F` 3D-flip to raw headers) with 1-click switch to classic **3-Pane** folder trees & unread badges |
| **Safe Reading & Delivery** | Blocks external tracking images by default; preview HTML/plain drafts, recipients & attachments before immediate or scheduled send, with undoable IMAP Trash |
| **Local Contacts Autocomplete** | Learns correspondents locally in SQLite and autocompletes To/Cc by name, email, full pinyin, pinyin initials, or employee ID |
| **Courier, Locales & Hooks** | Interactive Whale-Girl **Courier** for live mail checks; 8 UI languages, 13 styles × 8 fonts, in-process `emailTasks` arrivals & opt-in mail-triggered DSH tasks |

<details>
<summary>See a workbench example (Letter Desk)</summary>

![dsh-email Letter Desk workbench example](https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/docs/assets/intro/screen-en.webp)

Captured with `dsh-email 0.32.0` running in Harness Web `0.2.2-rc.3` (Letter Desk + default YouYuan Mono font, sample data).

</details>

## Install

Open **Plugins** in the DSH desktop app and install `dsh-email`, or use the CLI:

```bash
dsh plugin --profile desktop add dsh-email
```

For the web profile, replace `desktop` with `web` and restart DSH. Requires DSH `>=0.2.2-rc.3`.

## Start using it

1. **Connect mailbox**: Open **Email → Accounts**, pick a provider, OAuth, AgentMail, or custom server, run **Test connection**, and save.
2. **Triage on Letter Desk**: Filter by account, folder, unread, or attachments; drag left to skip, right to unfold, or press `Space`/`F` to inspect raw headers (toggle to **3-Pane** anytime).
3. **Draft with Courier & Chat**: Summon **Courier** to check mail or ask Chat to summarize unread tasks and save reply drafts without sending prematurely.
4. **Review & deliver**: Compose with local Contacts autocomplete, verify HTML/plain preview, recipients, and attachments, then confirm **immediate** or **scheduled** send.

### Ready-to-copy prompts

- **Triage unread mail**: `Summarize important unread emails in my work account and list the replies needed without sending anything.`
- **Draft a reply**: `Draft a polite, concise reply to the open message in Drafts so I can review it before sending.`

## Before you start

- Bring your mailbox authorization, OAuth app, or AgentMail API key; add per-account `proxy` or `HTTPS_PROXY` if behind a proxy ([usage guide](https://github.com/STARDUSTLC666/dsh-email/blob/main/docs/USAGE.en.md)).
- Scheduled delivery requires DSH to stay running; mail-triggered tasks and automatic replies are opt-in.
- Detailed operating boundaries: [outgoing automation](docs/OUTGOING-AUTOMATION.en.md) and [mailbox workflow](docs/MAILBOX.en.md).

## Plugin updates

Check updates at the bottom of the workbench or native plugin details. Automatic checks are on by default; **automatic installation is off**. Suite-managed components update with their bundle.

## Documentation & feedback

- [Full usage, configuration and limits](https://github.com/STARDUSTLC666/dsh-email/blob/main/docs/REFERENCE.en.md) · [Release notes](https://github.com/STARDUSTLC666/dsh-email/blob/main/CHANGELOG.md) · [Validation history](https://github.com/STARDUSTLC666/dsh-email/blob/main/docs/VALIDATION.md)
- Stars and [Issues](https://github.com/STARDUSTLC666/dsh-email/issues) are welcome (strip credentials first).

## License

[MIT](https://github.com/STARDUSTLC666/dsh-email/blob/main/LICENSE)

<a id="what-it-does"></a>
<a id="requirements-and-configuration"></a>
