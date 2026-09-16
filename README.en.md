# dsh-email

![npm](https://img.shields.io/npm/v/dsh-email) ![downloads](https://img.shields.io/npm/dm/dsh-email) ![license](https://img.shields.io/github/license/STARDUSTLC666/dsh-email) ![stars](https://img.shields.io/github/stars/STARDUSTLC666/dsh-email?style=social)

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

![dsh-email banner](https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/banner.png)

Email plugin for DeepSeek Harness: **10 IMAP/SMTP tools** cover reading and searching mail, sending, replies and forwarding, attachments, message flags and moves, incremental new-mail checks, and configuration health. Supports multiple accounts, send approval, Web settings and new-mail popups. Configure an account with presets for QQ / 163 / 126 / Sina / Aliyun / Gmail / Outlook / iCloud to get started.

Pure Node, **cross-platform** (one codebase for Windows / macOS / Linux), no shell, no native binaries.

## Tools

| Tool | Purpose |
|---|---|
| `email_list` | List the newest mail in a folder (unread filter, pagination, summaries only, no body) |
| `email_read` | Read one message's full text by uid (HTML auto-converted to plain text, oversized bodies truncated) |
| `email_search` | Search subject/sender/recipient/CC by keyword (server-side subject/from/to/cc); with no results, falls back to a body scan of the most recent 30 messages by default (including to/cc) |
| `email_send` | Send mail on your behalf (attachments supported). **Prompts for confirmation before sending by default**, showing recipients, subject and attachment count; only sends after you approve |
| `email_folders` | List the mailbox folders (INBOX/Sent/Junk/custom…); feed the `path` to other tools |
| `email_attachment` | Download an attachment by index (saved to the session workspace by default so the model can read it directly; size capped by `maxAttachmentBytes`) |
| `email_health` | Check account configuration and IMAP/SMTP host details offline; makes no network connection. Use Test connection in Web settings to verify IMAP connectivity |
| `email_watch` | Incremental new-mail check: the first call seeds a baseline, every later call reports only unread mail newer than the last check — ideal for scheduled new-mail notifications |
| `email_mark` | Mark messages as read/unread, add/remove stars, or move messages to another folder |
| `email_reply` | Reply, reply-all or forward with thread headers and quoted content; uses the same send-approval gate |

### New-mail notifications (web UI)

Once an account is configured, a "whale-girl courier" popup lives in the bottom-right corner of the main UI: it checks for new mail every 30 seconds and shows a card (sender + subject) when something arrives, auto-dismissing after 12 seconds. The popup shares the cursor logic with `email_watch` but keeps its own counter, so they never consume each other's mail.

The popup artwork prefers the locally installed [dsh-deep-whale](https://github.com/Small-tailqwq/dsh-deep-whale) whale-girl skin assets (**never bundled** — read at runtime from your own installation): the artwork is a derivative of the original whale-girl character by [上善](https://www.pixiv.net/users/62155430) (skin by Small-tailqwq), published under CC BY-NC-SA 4.0 (Attribution-NonCommercial-ShareAlike); the popup shows the full attribution chain. Without the skin, a bundled community whale-girl artwork is used (copyright stays with the original author, personal non-commercial use only; removed on request via issue).

Example:

> Check the 10 newest unread messages in my QQ mailbox and list the ones that need a reply.

### Changelog

- **0.10.8-dev (unreleased)**: three settings-page upgrades — ① dark-theme fix: the border token 0.10.8 introduced did not exist (glaring light-gray borders in dark mode); every panel style now references official `--dsw-alias-*` design tokens; ② visual multi-account card editor: add/edit/rename/set-default with per-account connection tests, half-filled accounts never block saving, stored auth codes are kept when left blank, the raw YAML editor remains as an escape hatch (serialization preserves comments when possible and says so when it cannot); ③ server presets: a new `serverPresets` option (custom provider endpoints, no credentials) with visual management, and account provider dropdowns list preset names and pre-fill endpoints. Non-builtin provider values are no longer written to YAML (custom presets expand to endpoints, avoiding an "unknown provider" resolution error). Tests: 127 → 132.
- **0.10.8 (2026-09-16)**: integrate GUODnuli's [PR #9](https://github.com/STARDUSTLC666/dsh-email/pull/9), replacing nonexistent text and border variables in settings and notifications with official theme tokens; revalidate Harness 0.1.5-rc.2 and 0.1.6-alpha.1.
- **0.10.7 (2026-09-11)**: revalidate official Harness 0.1.5-rc.1 and refresh suite co-load and live-service evidence; runtime code is unchanged.
- **0.10.6 (2026-09-10)**: fix an empty authorization-code field shadowing `DSH_EMAIL_PASSWORD` in single-account connection tests and saved settings. Explicit passwords still take precedence; named accounts cannot borrow this environment variable. Refresh the settings tool count, multi-account guidance and real QQ mailbox validation notes.
- **0.10.5 (2026-09-08)**: document installation, tool registration and the Web settings endpoint in official Harness 0.1.3-alpha.2; update Node requirements and clarify that `email_health` checks configuration only. Runtime code is unchanged from 0.10.4.
- **0.10.4 (2026-09-07)**: raise the minimum `mailparser` version to `3.9.22` and update the lockfile to use the patched `html-to-text 10.0.1 → deepmerge-ts 8.0.2` dependency chain for [CVE-2026-40345](https://github.com/RebeccaStevens/deepmerge-ts/security/advisories/GHSA-ggr8-5vv4-36mx). This does not rely on root-only `pnpm.overrides`, which cannot fix consumers installing this plugin as a dependency. Add runtime dependency-chain and HTML-message parsing regression tests. An affected dependency is not proof that mail input can trigger this vulnerability.
- **0.9.0**: new `email_watch` incremental new-mail tool (cursor-based, ideal for scheduled notifications); new "whale-girl courier" new-mail popup in the web UI (local skin artwork read at runtime + built-in fallback).
- **0.8.2**: `since` / `until` parameter descriptions unified to English, consistent with the other parameters, so multilingual agents read them correctly.
- **0.8.0/0.8.1**: `email_list` / `email_search` gained `since` / `until` date-range filters; new `email_health` account-configuration self-check; adapted to harness 0.1.2 (removed the deleted client-injection declaration).
- **0.6.2**: server-side search covers `cc` (subject / sender / recipients / CC); the body fallback scan also matches `to` / `cc` and one malformed message no longer aborts the batch; lists are UID-descending (newest first); `email_send` strictly validates attachment paths.


## Compatibility

Verified with official source builds of Harness `0.1.5-rc.2` and `0.1.6-alpha.1` on 2026-09-16: all 18 components load alongside ModLens, with passing tool schemas, skill registration and offline read-only calls; Email builds and passes 132 tests. Uses the `cordis.patch.yml` + `dsh.bundle.patch` bundle model. Node requirements are 22.19 or later within 22.x, or 24 or later. Live external-service workflows require separate configuration and validation.

On 2026-09-10, npm `dsh-email@0.10.6` passed real QQ mailbox folder/list/read/search calls, the settings page's connection test and Save & Apply, and separate SMTP authentication. An empty authorization-code field correctly used `DSH_EMAIL_PASSWORD`. This recheck did not connect to a real mailbox or send, modify or delete mail.

Follows the official [plugin packaging and installation requirements](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md): an ESM entry point, prebuilt `lib/`, `dsh.bundle.patch` and a `cordis.patch.yml` layer. The plugin explicitly injects its required services and supplies JSON Schema parameters, canonical output and rendering, with no runtime imports of `@deepseek-ai/*` internals. Use Node 22.19 or later within 22.x, or Node 24 or later. Harness is evolving rapidly; the version above is the tested baseline.

## Installation

```sh
dsh plugin --profile web add dsh-email
```

(Or install from GitHub: `dsh plugin --profile web add github:your-account/dsh-email#<commit>`, then follow the prompt to authorize the `prepare` build in the profile's `pnpm-workspace.yaml`.)

After installing, restart `dsh web`. The plugin ships with an empty config and **won't crash startup**; calling any email tool before configuration returns a clear configuration hint.

**Two configuration methods (pick one):**

1. **Web settings (recommended)**: after restart, open **Settings → Mail (dsh-email)**, fill in the email address and authorization code in an account card, and click "Save & Apply"; each card also has its own "Test connection" button. Zero YAML, zero restart.
2. **YAML**: hand-write the cordis.patch.yml template below; the settings page's "Multiple accounts (advanced, YAML)" textbox can also hold the account map (overriding `accounts` in YAML). The cards and that textbox are escape hatches for each other.

The whole settings page follows DSH's light and dark themes: every panel style references the official `--dsw-alias-*` design tokens instead of hard-coded colors, so switching themes takes effect immediately (0.10.8 referenced a border token that does not exist, which produced a glaring light-gray border in dark mode; that is fixed).

Multiple accounts can be edited visually in the settings page: account cards add, edit and delete accounts, rename them, pick the default, and run "Test connection" per account name; a half-filled account never blocks saving — it just gets an "incomplete" badge. Card edits land in the YAML text first and only take effect when the form is saved with "Save & Apply". When a card is saved, an already-stored authorization code is kept by default (leave the password field empty to keep it, type into it to overwrite), and comments in the YAML are preserved in place where possible — with an explicit notice when they cannot be.

Values saved in the settings page live in the `dsh-email` namespace of `settings.yaml` and override the YAML default-account config. Authorization-code fields are marked secret, but saving a filled field still writes its value to the local settings file. For a single account, set `DSH_EMAIL_PASSWORD` and leave the authorization-code field empty to avoid saving it; the environment value is not copied into settings.

## Uninstall

```bash
dsh plugin --profile web remove dsh-email
```

Then restart the web service. To clean up fully, also remove the plugin entry from your profile `cordis.patch.yml` if you overrode it.


## Configuration

In your profile's `cordis.patch.yml` (under `$DSH_HOME/profiles/<name>/`), override the `tool-email` line, then restart:

```yaml
- id: tool-email
  config:
    provider: qq          # qq | 163 | 126 | sina | aliyun | gmail | outlook | icloud
    user: you@qq.com
    password: 你的授权码   # 强烈建议改用环境变量 DSH_EMAIL_PASSWORD，见下
```

No preset needed? Hand-write any IMAP/SMTP server:

```yaml
- id: tool-email
  config:
    user: you@corp.example
    password: 你的授权码
    imap: { host: imap.corp.example, port: 993, secure: true }
    smtp: { host: smtp.corp.example, port: 465, secure: true }
    inboxFolder: INBOX
```

Multiple accounts: one `tool-email` line can hold several mailboxes; select one with the `account` argument when calling a tool:

```yaml
- id: tool-email
  config:
    accounts:
      work: { provider: qq, user: work@qq.com, password: 授权码1 }
      home: { provider: '163', user: home@163.com, password: 授权码2 }
    defaultAccount: work        # 省略 account 参数时用这个
    downloadDir: E:/attachments # 可选，默认 $DSH_HOME/email-downloads
```

Top-level `provider`/`user`/`password`/`imap`/`smtp`/`inboxFolder` remain available as shared defaults for all accounts (the v0.1 single-account style stays fully compatible).

To reuse one set of connection endpoints across accounts, define your own provider presets with `serverPresets` (a YAML map: key = preset name, value has an optional `label` plus `imap`/`smtp`):

```yaml
- id: tool-email
  config:
    serverPresets: |
      corp:
        label: 公司邮箱
        imap: { host: imap.corp.example, port: 993, secure: true }
        smtp: { host: smtp.corp.example, port: 465, secure: true }
```

The settings page's "Server presets" fold-out edits these presets visually, and the account cards' provider dropdown automatically gains the preset names — picking one pre-fills its endpoints into the account. A preset holds connection endpoints only — **never an email address or authorization code**. `port`/`secure` may be omitted (defaults are 993/465 with SSL).

## Presets

| provider | IMAP | SMTP |
|---|---|---|
| `qq` | imap.qq.com:993 (SSL) | smtp.qq.com:465 (SSL) |
| `163` | imap.163.com:993 | smtp.163.com:465 |
| `126` | imap.126.com:993 | smtp.126.com:465 |
| `sina` | imap.sina.com:993 | smtp.sina.com:465 |
| `aliyun` | imap.aliyun.com:993 | smtp.aliyun.com:465 |
| `gmail` | imap.gmail.com:993 | smtp.gmail.com:465 |
| `outlook` | outlook.office365.com:993 | smtp.office365.com:587 (STARTTLS) |
| `icloud` | imap.mail.me.com:993 | smtp.mail.me.com:587 (STARTTLS) |

## Getting an authorization code

Every provider requires an authorization code / app-specific password instead of your login password:

- **QQ Mail**: Settings → Account → enable IMAP/SMTP → generate authorization code
- **163/126**: Settings → POP3/SMTP/IMAP → enable → add authorization code
- **Gmail**: enable 2-Step Verification → Security → App passwords
- **Outlook**: Microsoft account security → App password (some accounts need 2-step verification first)

## Security

- **The authorization code is the key to your mailbox.** It lives on this machine (`cordis.patch.yml` or `settings.yaml` in the profile); never commit it to any Git repo; prefer the `DSH_EMAIL_PASSWORD` env var.
- `email_send` goes through the DSH approval channel by default: every send shows "send mail to xx, subject "xx"" and only sends after you approve. Environments without an approval channel (e.g. headless with no UI) **refuse to send outright** — that is the secure default.
- When the session is in **Full Access** mode, the harness approval policy is never (no confirmation dialogs) — `email_send` is **blocked with a clear hint**. Two ways out: ① switch the access mode back to Read Only / Write; ② turn off `sendApproval` (uncheck "Confirm before sending" in the settings page), explicitly declaring you accept the risk.
- This plugin performs no outbound telemetry; credentials are used in memory only to connect to your mail servers.

## Known limitations

- **No OAuth2**: enterprise environments that force OAuth (some M365 / Google Workspace) aren't usable yet; use an app-specific password / authorization code instead.
- **Body search**: the server side only searches subject / from / to / cc. Most servers (e.g. QQ) have unreliable IMAP `TEXT` / `HEADER` search, so with no results it falls back to a body scan of the most recent `bodySearchLimit` messages (slower; disable with `bodySearchFallback`).
- **Attachments**: inline images aren't downloadable separately yet; a failed attachment match errors instead of downloading the wrong file (safe default).
- **Password storage**: the authorization code saved in the settings page is written in plaintext to the local `settings.yaml` (the secret mark only keeps it out of logs / exports / diagnostics; no disk encryption). Don't hand `settings.yaml` to untrusted people.
- **Local edits are undone by `pnpm install`**: if you deploy by editing files inside `node_modules/dsh-email/`, any `pnpm install` restores the registry version (0.10.7, for example). To keep changes long-term, install from a local path or a Git commit instead.

## Development

```sh
pnpm install
pnpm run build   # tsc → lib/
pnpm test        # build + offline tests; no real mailbox required
```

`src/index.ts` composes the plugin. `runtime.ts` owns live settings, account pools, and separate tool/web watch cursors. `tools.ts` wires the ten tool implementations. `tool-contract.ts` defines parameters, output schemas, and text rendering. `approval.ts` owns the outgoing-mail gate. IMAP/SMTP transport remains in `mail-client.ts`, and browser routes remain in `web.ts` — which also hosts the parsing, serialization (comment-preserving, keeping stored authorization codes) and custom-preset snapshot the account-card editor depends on.

Tests cover pool replacement after live settings changes, unload cleanup, cancellation and workspace propagation, independent tool/web cursors, account-card serialization and preset parsing, and rejected approval preventing send execution. In-memory clients replace mailbox connections.

## License

MIT. This is a community plugin, not affiliated with DeepSeek; `@deepseek-ai/*` is an officially reserved namespace.
