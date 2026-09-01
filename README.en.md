# dsh-email

![npm](https://img.shields.io/npm/v/dsh-email) ![downloads](https://img.shields.io/npm/dm/dsh-email) ![license](https://img.shields.io/github/license/STARDUSTLC666/dsh-email) ![stars](https://img.shields.io/github/stars/STARDUSTLC666/dsh-email?style=social)

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

![dsh-email banner](https://raw.githubusercontent.com/STARDUSTLC666/dsh-email/main/assets/banner.png)

Email tools for DeepSeek Harness: let the agent **check the inbox, read mail, search mail, send mail on your behalf, and send/receive attachments** through standard IMAP/SMTP — with one-line presets for QQ / 163 / 126 / Sina / Aliyun / Gmail / Outlook / iCloud. Pure plugin implementation, zero core changes, works out of the box.

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
| `email_watch` | Incremental new-mail check: the first call seeds a baseline, every later call reports only unread mail newer than the last check — ideal for scheduled new-mail notifications |

### New-mail notifications (web UI)

Once an account is configured, a "whale-girl courier" popup lives in the bottom-right corner of the main UI: it checks for new mail every 30 seconds and shows a card (sender + subject) when something arrives, auto-dismissing after 12 seconds. The popup shares the cursor logic with `email_watch` but keeps its own counter, so they never consume each other's mail.

The popup artwork prefers the locally installed [dsh-deep-whale](https://github.com/Small-tailqwq/dsh-deep-whale) whale-girl skin assets (**never bundled** — read at runtime from your own installation): the artwork is a derivative of the original whale-girl character by [上善](https://www.pixiv.net/users/62155430) (skin by Small-tailqwq), published under CC BY-NC-SA 4.0 (Attribution-NonCommercial-ShareAlike); the popup shows the full attribution chain. Without the skin, a bundled community whale-girl artwork is used (copyright stays with the original author, personal non-commercial use only; removed on request via issue).

Example:

> Check the 10 newest unread messages in my QQ mailbox and list the ones that need a reply.

### Changelog

- **0.9.0**: new `email_watch` incremental new-mail tool (cursor-based, ideal for scheduled notifications); new "whale-girl courier" new-mail popup in the web UI (local skin artwork read at runtime + built-in fallback).
- **0.8.2**: `since` / `until` parameter descriptions unified to English, consistent with the other parameters, so multilingual agents read them correctly.
- **0.8.0/0.8.1**: `email_list` / `email_search` gained `since` / `until` date-range filters; new `email_health` self-check (account/connection/config in one call); adapted to harness 0.1.2 (removed the deleted client-injection declaration).
- **0.6.2**: server-side search covers `cc` (subject / sender / recipients / CC); the body fallback scan also matches `to` / `cc` and one malformed message no longer aborts the batch; lists are UID-descending (newest first); `email_send` strictly validates attachment paths.


## Compatibility

Verified against `@deepseek-ai/dsh@0.1.2-alpha.3` on 2026-09-01 (settings page / asset route / email_watch fully regression-tested). Built for the cordis patch-bundle plugin model (`cordis.patch.yml` + `dsh.bundle.patch`). No runtime imports of `@deepseek-ai/*` internals.

## Installation

```sh
dsh plugin --profile web add dsh-email
```

(Or install from GitHub: `dsh plugin --profile web add github:your-account/dsh-email#<commit>`, then follow the prompt to authorize the `prepare` build in the profile's `pnpm-workspace.yaml`.)

After installing, restart `dsh web`. The plugin ships with an empty config and **won't crash startup**; calling any email tool before configuration returns a clear configuration hint.

**Two configuration methods (pick one):**

1. **Web settings (recommended)**: after restart, open **Settings → Mail (dsh-email)**, fill in the email address and authorization code, and click "Save & Apply"; a "Test connection" button is also provided. Zero YAML, zero restart.
2. **YAML**: hand-write the cordis.patch.yml template below; the settings page's "Multiple accounts (advanced, YAML)" textbox can also hold the account map (overriding `accounts` in YAML).

Values saved in the settings page live in the `dsh-email` namespace of `settings.yaml` and override the YAML default-account config; password fields are marked secret (they never appear in exports or diagnostics).

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

## Development

```sh
pnpm install
pnpm run build   # tsc → lib/
pnpm test        # 构建 + node --test（配置/解析/注册与审批门，44 个用例，无需真实邮箱）
```

## License

MIT. This is a community plugin, not affiliated with DeepSeek; `@deepseek-ai/*` is an officially reserved namespace.
