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
| `email_search` | Search subject/sender/recipient/CC by keyword (server-side subject/from/to/cc; hits are re-checked against the envelopes, so "match-everything" servers such as QQ are rejected); when nothing believable is returned, it falls back to a body scan of the most recent 30 messages by default (including to/cc) |
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

- **0.13.1 (2026-09-19)**: ships a community public-client registration (thanks [gurio-wine](https://github.com/gurio-wine)), so Outlook / Exchange Online works out of the box; supply your own `clientId` to override it — the card shows which application is in effect. 264 tests.
- **0.13.0 (2026-09-18)**: fixes for bodies truncated to nothing, `email_watch` skipping new mail, and the attachment cache ignoring UIDVALIDITY; all ten tools declare a timeout; reads and body search download text parts only; the scan fallback labels its own semantics. 262 tests.
- **0.12.0 (2026-09-18)**: send-as alias (`senderName` / `authUser` / `authPassword`) and `offset` paging for `email_search`; QQ match-everything searches no longer trusted; popup polling pauses while the tab is hidden.
- **0.11.0 (2026-09-18)**: gurio-wine’s four settings-page PRs (card editor / OAuth2 device-code login / bilingual panel / pinned `authKind`) plus the review fixes for SMTP OAuth2 and same-origin settings routes.
- **0.10.8 and earlier**: see [CHANGELOG.md](CHANGELOG.md).
## Compatibility

Co-load verification was performed on 2026-09-16 with official source builds of Harness `0.1.5-rc.2` and `0.1.6-alpha.1`: all 18 components load alongside ModLens, with passing tool schemas, skill registration and offline read-only calls.

**0.11.0 co-load verification (2026-09-18, locally built Harness `0.1.5-rc.2`, `web` profile)**: the plugin mounted without errors; the settings route answered GET with 200 and no `raw` field in the response; a `text/plain` POST was refused with **415**, proving the same-origin guard holds in the real host; under a `application/json` POST the card projection was correct, and an account pinning `authKind: password` reported both `authKindDeclared` and `authKind` as `password`; the panel actually rendered account cards, the eight provider presets with localized labels, the three-way authentication selector, the application (client) ID field with its hint, the missing-ID warning banner (so `--dsw-alias-state-warn-primary` is genuinely defined in the real host) and the Sign in with Microsoft button; the browser console was clean; save worked end to end, and afterwards `accountsYaml` was restored to empty with the original account intact. Offline tests: 231 green. **Still not done**: an end-to-end OAuth2 run against a real Outlook tenant (the device-code flow needs a human to authorize in a browser) and real sending; the `clientId` paths are covered only against a fake authority. Uses the `cordis.patch.yml` + `dsh.bundle.patch` bundle model. Node requirements are 22.19 or later within 22.x, or 24 or later. Live external-service workflows require separate configuration and validation.

On 2026-09-10, npm `dsh-email@0.10.6` passed real QQ mailbox folder/list/read/search calls, the settings page's connection test and Save & Apply, and separate SMTP authentication. An empty authorization-code field correctly used `DSH_EMAIL_PASSWORD`. This recheck did not connect to a real mailbox or send, modify or delete mail.

Follows the official [plugin packaging and installation requirements](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md): an ESM entry point, prebuilt `lib/`, `dsh.bundle.patch` and a `cordis.patch.yml` layer. The plugin explicitly injects its required services and supplies JSON Schema parameters, canonical output and rendering, with no runtime imports of `@deepseek-ai/*` internals. Use Node 22.19 or later within 22.x, or Node 24 or later. Harness is evolving rapidly; the version above is the tested baseline.

## Installation

```sh
dsh plugin --profile web add dsh-email
```

(Or install from GitHub: `dsh plugin --profile web add github:your-account/dsh-email#<commit>`, then follow the prompt to authorize the `prepare` build in the profile's `pnpm-workspace.yaml`.)

After installing, restart `dsh web`. The plugin ships with an empty config and **won't crash startup**; calling any email tool before configuration returns a clear configuration hint.

**Two configuration methods (pick one):**

1. **Web settings (recommended)**: after restart, open **Settings → Mail (dsh-email)**, fill in the email address and authorization code in an account card — edits auto-save, no button to click; each card also has its own "Test connection" button. Zero YAML, zero restart.
2. **YAML**: hand-write the `accounts` map in the cordis.patch.yml template below. The settings page's `accountsYaml` is written by the card editor (it overrides `accounts` when non-empty); the panel itself no longer provides a raw-YAML textarea. Fields not modeled by cards (e.g. `socketTimeoutMs`, `connectionTimeoutMs`) can still be hand-written in YAML and are preserved in place when cards are saved. Authentication method (`authKind`) has a selector on the card — no need to hand-write it.

The whole settings page follows DSH's light and dark themes: every panel style references the official `--dsw-alias-*` design tokens instead of hard-coded colors, so switching themes takes effect immediately (0.10.8 referenced a border token that does not exist, which produced a glaring light-gray border in dark mode; that is fixed).

Multiple accounts can be edited visually in the settings page: account cards add, edit and delete accounts, rename them, pick the default, and run "Test connection" per account name; a half-filled account never blocks saving — it just gets an "incomplete" badge. Card edits are debounced and auto-saved; there is no longer a "write to YAML text, then click save" step. Version conflicts (settings changed elsewhere) are automatically rebased and re-saved once, rather than repeatedly failing with a stale revision. When a card is saved, an already-stored authorization code is kept by default (leave the password field empty to keep it, type into it to overwrite); comments in the YAML are preserved in place where possible — with an explicit notice when they cannot be. Rename re-keys in place, preserving auth codes and advanced keys, and refuses to overwrite an existing account name. Account-level hand-written imap/smtp endpoints are only cleaned when the **provider actually changes** — runtime resolution prefers the account's own host, so a routine save never silently re-points the connection target.

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

### Full configuration options

| Field | Default | Description |
|---|---|---|
| `provider` | — | Preset name; auto-fills imap/smtp addresses. Explicitly written host/port/secure take precedence |
| `user` | required | Login email address |
| `password` | required* | Authorization code / app-specific password; *can also use the env var `DSH_EMAIL_PASSWORD` |
| `senderName` | — | Display name for the From header; the address itself stays `user` |
| `authUser` | = `user` | Login account. Alias / SMTP-relay setups: `user` is the address mail is sent from, this is the account IMAP/SMTP authenticates with |
| `authPassword` | = `password` | Password for `authUser`; only needed when the login account differs from `user` and has its own password |
| `imap.host/port/secure` | per preset | Incoming server (also `connectionTimeoutMs` / `socketTimeoutMs` for timeouts) |
| `smtp.host/port/secure` | per preset | Outgoing server |
| `inboxFolder` | `INBOX` | Default folder for read/send tools |
| `sendApproval` | `true` | Confirm before sending (strongly recommended) |
| `maxBodyChars` | `20000` | Body truncation limit for `email_read` (1000–200000) |
| `accounts` | — | Named account map; account-level fields override top-level shorthand |
| `accountsYaml` | — | YAML text of the account map, written by the settings-page card editor; overrides `accounts` when non-empty |
| `clientId` | built-in community app (below) | Application (client) ID for OAuth2 accounts: empty uses the plugin's built-in public client, a value overrides it (account-level also overrides the top-level shorthand) |
| `authKind` | derived from provider | Authentication method override: `oauth2` / `password`. When omitted, derived from provider and IMAP host; hybrid or on-premises tenants that still accept app passwords for Exchange Online can pin `password`. The card's "Authentication method" selector writes this key |
| `serverPresets` | — | YAML text of custom provider presets (key = preset name, value has optional `label` + `imap`/`smtp`); endpoints only, no credentials. The settings-page dropdown lists preset names and pre-fills endpoints into account cards; editing a preset does not reconnect established connections |
| `defaultAccount` | auto (single account) | Account used when the `account` argument is omitted (required for multi-account) |
| `downloadDir` | `.dsh-email-downloads` under session workspace (fallback `$DSH_HOME/email-downloads`) | Download directory for `email_attachment`; pinned once explicitly set |
| `maxAttachmentBytes` | 20 MiB | Per-attachment and total size cap (1024–512 MiB) |
| `idleTimeoutMs` | `60000` | IMAP idle connection recycle time (connection reuse; consecutive ops are faster) |
| `bodySearchFallback` | `true` | Fall back to client-side body scan of recent messages when server search returns nothing |
| `bodySearchLimit` | `30` | Number of messages for the body fallback scan (5–200) |

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

## Outlook OAuth2 (device-code login)

Microsoft has disabled username+password basic auth for Exchange Online: personal outlook.com accounts and most tenants now require OAuth2. This plugin supports the device-code flow — IMAP and SMTP share a single token with automatic refresh.

**Where the bundled application ID comes from**: the device-code flow needs an app registration, and making every user register one is a wall nobody should have to climb — so the plugin ships one: `15dcd5aa-00dd-487f-82d7-1d2b2c299e14`, registered by contributor [gurio-wine](https://github.com/gurio-wine) in [PR #13](https://github.com/STARDUSTLC666/dsh-email/pull/13) and used here with their permission — thank you. The cost is stated plainly: the Microsoft consent screen names **their** application (enterprise security teams may refuse it), and the sign-in logs and telemetry land in **their** tenant, including your UPN. If they ever delete the app, every account that did not bring its own id stops signing in at once, with no better error than "clientId may be wrong". **Registering your own (free, ~10 minutes) keeps you independent — paste it into the card to override the built-in value; leaving the field empty keeps using the bundled one.**

**Using your own application instead (optional, free, ~10 minutes)**:

1. Open the [Entra admin center](https://entra.microsoft.com/) → **App registrations** → **New registration**.
2. Under **Supported account types**, select "Accounts in any organizational directory and personal Microsoft accounts" — this determines whether personal outlook.com accounts can sign in. Choosing incorrectly yields `AADSTS700016` or `AADSTS50020`.
3. Leave the **Redirect URI** blank (the device-code flow does not need one). Click Register.
4. On the Overview page, copy the **Application (client) ID** — this is the `clientId` you will supply.
5. In the left sidebar, go to **Authentication** → scroll to the bottom → set **Allow public client flows** to **Yes** and save. Without this, login fails with an `AADSTS700028`-style "device-code flow not enabled" error.
6. In the left sidebar, go to **API permissions** → Add a permission → Microsoft Graph → **Delegated permissions** → check `IMAP.AccessAsUser.All`, `SMTP.Send`, and `offline_access` (the last one is essential for obtaining a refresh token — without it, every expiry forces a fresh login). Personal tenants generally need no admin consent; enterprise tenants may require an admin to click "Grant admin consent" once.

**Filling it into the plugin (overrides the built-in value)**: Settings → Mail (dsh-email) → the account card's "Application (client) ID" field (the card shows which application is in effect; empty keeps the bundled community app); or in YAML (account-level `clientId`, which can also be set at the top level as a default for all accounts).

**Login flow**: click "Sign in to Microsoft account" on the card → the panel shows a `microsoft.com/devicelogin` link and a code → open the link in a browser, enter the code, and complete authorization → the panel polls until it shows "Signed in: your@email". Both receiving and sending then use this token.

**Caveats**:

- Enterprise tenants may additionally require an admin to enable **IMAP** and **SMTP AUTH** for the mailbox in the Exchange admin center. The typical symptom of SMTP AUTH being off: receiving works fine, sending is rejected.
- The token is bound to the application ID that issued it: changing `clientId` is treated as "switched apps" and requires re-login (this is intentional — it prevents using the old app's credentials against the new one). The bundled app is shared by every account that names none: a future release that replaces it with the project's own registration will ask those accounts to sign in once more.
- If your tenant is hybrid or on-premises and SMTP AUTH is still enabled, app passwords work: select "Password / authorization code" in the card's "Authentication method" selector — no OAuth2 needed.

## Known limitations

- **OAuth2 covers Outlook / Exchange Online only, and works out of the box (your own app ID optional)**: device-code login supports both IMAP and SMTP and defaults to the bundled community application (see "Outlook OAuth2" above), so no registration is needed to sign in; if your organisation refuses third-party apps, paste your own `clientId` into the card to override it. Other environments that mandate OAuth (e.g. Google Workspace) remain unusable; use the provider's app-specific password / authorization code instead.
- **Search match counts**: server hits are re-checked against the envelopes (see `email_search` above); when they hold up, "N matches" is the count the server reported while every listed row really carries the keyword. The local body-scan fallback only looked at the newest `bodySearchLimit` messages, so it renders "N rows on this page (only the newest N scanned)" instead of "N matches".
- **Body search**: the server side only searches subject / from / to / cc. Most servers (e.g. QQ) have unreliable IMAP `TEXT` / `HEADER` search, so with no results it falls back to a body scan of the most recent `bodySearchLimit` messages (slower; disable with `bodySearchFallback`).
- **Attachments**: inline images aren't downloadable separately yet; a failed attachment match errors instead of downloading the wrong file (safe default).
- **Password storage**: the authorization code saved in the settings page is written in plaintext to the local `settings.yaml` (the secret mark only keeps it out of logs / exports / diagnostics; no disk encryption). Don't hand `settings.yaml` to untrusted people.
- **OAuth2 token storage**: access / refresh tokens are stored as plaintext JSON at `$DSH_HOME/data/dsh-email/oauth2-tokens.json` (deliberately kept out of `settings.yaml`, so they are not included in settings exports). The file is written with `mode: 0o600`, but that permission bit only takes effect **at file creation** and is **effectively a no-op on Windows** — do not hand this file to untrusted people. Tokens are bound to the issuing application ID; changing `clientId` requires re-login. Deleting an account cleans up its tokens.
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
