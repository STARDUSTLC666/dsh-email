# Historical release notes

[Current changelog](../CHANGELOG.md) · [Overview](../README.en.md)

These English notes preserve the earlier translations. The main changelog contains the consolidated version history.

## 0.16.2 (2026-10-08)

- Encrypt Windows access / refresh tokens with current-user DPAPI and migrate valid legacy tokens in place, without plaintext backups or secrets in process arguments.
- Preserve corrupt, unsupported or locked stores and fail closed when encryption is unavailable. Save through private atomic replacement; POSIX writes use 0600 files.
- Replace the import-only suggestion in [PR #22](https://github.com/STARDUSTLC666/dsh-email/pull/22) with an implementation in the TypeScript source. See the usage guide for recovery and protection boundaries.

## 0.16.1 (2026-10-08)

- Resolve relative attachments against the current session workspace in both send and draft tools, preserving absolute paths and calls without session context.
- Clarify saved trust, deny rules and Full Access confirmation behavior in both languages and model-facing descriptions; correct the documented deny-rule field names.

## 0.16.0 (2026-10-05)

- Add per-account blocked addresses and domains. Deny rules override trust and stop every sending path before SMTP connection. Draft previews explain the block and preserve editable drafts.

## 0.14.7 (2026-10-02)

- Account cards display the effective IMAP/SMTP endpoints. Changing providers clears stale display values without persisting the endpoint summary into account configuration.
- Upgrade to ImapFlow 2.2.1, Mailparser 3.9.33 and Nodemailer 10.0.13, adapt upstream types and empty responses, and eliminate the production dependency audit findings.
- Give recovery guidance when a message or attachment disappears during a request; empty search responses remain empty lists.
- All 304 tests pass on Windows, including local SMTP TLS, STARTTLS, cancellation and OAuth2 protocol fixtures. Production mailbox login and delivery still require user acceptance.

## 0.14.6 (2026-10-02)

Completes [PR #18](https://github.com/STARDUSTLC666/dsh-email/pull/18): untouched saved form endpoints and partial drafts with empty endpoints preserve explicitly configured row IMAP/SMTP servers. The Outlook 587/STARTTLS fix and deliberate port/TLS overrides remain supported.

All 297 email tests pass on Windows / Node `24.16.0`. Both new server-preservation regressions failed before the fix and pass afterward. This change has not been validated through real mailbox login, OAuth2 authorization or delivery.

## 0.14.5 (2026-10-01)

Fixes [#20](https://github.com/STARDUSTLC666/dsh-email/issues/20): a named account's provider selects its own servers, so Gmail no longer inherits shared Outlook endpoints or becomes an OAuth2 account. Card saves exclude form-derived shared endpoints. Explicit account endpoints and legacy single-account configuration remain supported; top-level sender aliases and login credentials now take effect. Connection failures identify the selected account and actual IMAP host and port, with echoed credentials redacted.

An empty card asks for its email address before testing. Outlook's built-in application ID updates from the saved snapshot, avoiding a false missing-ID warning. Stored separate login passwords are acknowledged without exposing their values.

Validation host: Harness `0.2.0-rc.2` built from the official release tag (commit `639ed01539`), Windows and Node `24.16.0`. All 295 email tests pass; all 18 plugins mount together, with 10 email tools. Native Desktop checks covered adding a card, switching Outlook/Gmail, automatic saving and deletion. The final field-hint fixes have component behavior regressions but have not been retested in the native UI. Successful real-mailbox login, OAuth2 authorization and sending remain unverified.

## 0.13.2 (2026-09-21)

- download attachments by their real MIME section IDs, fixing duplicate filenames selecting the first file. Legacy parsed metadata matches sections one-to-one. Body-only reads and attachment-index caching remain intact; 268 tests pass, including downloaded-file byte checks.

## 0.13.0 (2026-09-19)

- **Fixes**: (1) long bodies could be truncated to nothing (now hard-cut with the body preserved); (2) the `email_watch` / popup cursor permanently skipped new mail beyond one `limit` batch (now oldest-first batching, cursor only advances over what was actually returned); (3) the attachment index cache ignored UIDVALIDITY, so a renumbered mailbox could download the wrong attachment (cache key now includes uidValidity). **Performance**: all ten tools declare `timeoutMs` (120s for search/watch, 60s otherwise); watch/popup polls FETCH only the rows they report (previously up to 100 unread envelopes per poll); reads and body search download text/* parts only instead of the whole message with its attachments. **Semantics**: the body-scan fallback now labels itself as such ("this page only, scanning the newest N messages") instead of claiming a folder-wide match count. **Behaviour change**: `email_read` now lists only downloadable `disposition=attachment` entries (inline images are no longer listed); the fallback scan fetches per message (fewer bytes, slightly more round trips). Tests 237 → 262.

## 0.12.0 (2026-09-18)

- **send-as alias** (`senderName` / `authUser` / `authPassword`): `user` is now only the From address and the mailbox identity, while the login user and password can differ — Gmail / Workspace aliases and SMTP relays where the login is not the From address no longer fail with `535 Username and Password not accepted`, and the From header can carry a display name. The account card gained three fields (same three-state contract as the authorization code: empty keeps the stored value, clearing deletes the key). **New**: `offset` for `email_search`, so results beyond the first page are reachable. **Fixes and optimisations**: a changed folder UIDVALIDITY re-seeds the `email_watch` / popup baseline instead of reporting the renumbered mailbox as new; search verification and the result rows share one FETCH; `email_attachment` reuses the MIME index `email_read` already parsed instead of downloading the whole message again; `email_folders` is cached for 60s; the web new-mail popup pauses while the tab is hidden, backs off on failures and refreshes its skin snapshot less often. **Engineering**: CI now rejects `lib/` drift against `src/` and syntax-checks the hand-written client bundle. Tests 237 → 252. The send-as direction came from [@TianLanDaoRen](https://github.com/TianLanDaoRen)'s [PR #8](https://github.com/STARDUSTLC666/dsh-email/pull/8) (this implementation is a rewrite on top of 0.11.0).

## 0.11.0 (2026-09-18)

- merge gurio-wine's four settings-page PRs ([#11](https://github.com/STARDUSTLC666/dsh-email/pull/11)–[#14](https://github.com/STARDUSTLC666/dsh-email/pull/14)) with post-review fixes. **Added**: ① visual multi-account card editor (add/edit/delete, rename, set-default, per-account connection test — edits auto-save; no "Save & Apply" button) and server-preset management (`serverPresets`, custom provider endpoints, no credentials); ② OAuth2 device-code login for Outlook / Exchange Online (IMAP and SMTP share one token; automatic refresh; password-auth accounts unaffected); ③ bilingual settings-panel copy that follows the host's Settings → General language in real time; ④ accounts can pin `authKind` (auto / oauth2 / password), giving hybrid or on-premises tenants that still accept app passwords an escape hatch. **Review fixes**: SMTP OAuth2 could never send (nodemailer's `XOAuth2` reads only `accessToken`, never `pass` — confirmed `EAUTH`); saving no longer unconditionally wipes account-level hand-written imap/smtp endpoints (runtime prefers the account's own host; the old behavior silently re-pointed custom-server accounts to presets, and accounts without a provider lost connection info entirely); rename preserves stored auth codes and advanced keys and refuses to overwrite an existing account name; settings routes now enforce Host / Origin / Content-Type same-origin checks (previously any web page could cross-origin-write settings; DNS rebinding could read snapshots containing plaintext auth codes); responses no longer echo the resolved account map (a plaintext-password copy the front end never reads); raw server errors are credential-scrubbed before display (IMAP/SMTP echo rejected auth strings containing access tokens); deleting an account cleans its tokens (uncommitted saves do not); version conflicts auto-rebase instead of retrying with a stale revision. **No third-party OAuth2 app registration is bundled**: OAuth2 accounts must supply their own `clientId` — see "Outlook OAuth2" below. Tests: 81 → 237. **`email_search` fix**: servers like QQ answer any keyword with the same unrelated uid list; hits are now re-verified against the envelopes (subject/from/to/cc) and fall back to the local body scan when none survive, so an impossible keyword no longer "matches" 40 messages ([#15](https://github.com/STARDUSTLC666/dsh-email/issues/15)).

## 0.10.8 (2026-09-16)

- integrate GUODnuli's [PR #9](https://github.com/STARDUSTLC666/dsh-email/pull/9), replacing nonexistent text and border variables in settings and notifications with official theme tokens; revalidate Harness 0.1.5-rc.2 and 0.1.6-alpha.1.

## 0.10.7 (2026-09-12)

- revalidate official Harness 0.1.5-rc.1 and refresh suite co-load and live-service evidence; runtime code is unchanged.

## 0.10.6 (2026-09-10)

- fix an empty authorization-code field shadowing `DSH_EMAIL_PASSWORD` in single-account connection tests and saved settings. Explicit passwords still take precedence; named accounts cannot borrow this environment variable. Refresh the settings tool count, multi-account guidance and real QQ mailbox validation notes.

## 0.10.5 (2026-09-08)

- document installation, tool registration and the Web settings endpoint in official Harness 0.1.3-alpha.2; update Node requirements and clarify that `email_health` checks configuration only. Runtime code is unchanged from 0.10.4.

## 0.10.4 (2026-09-07)

- raise the minimum `mailparser` version to `3.9.22` and update the lockfile to use the patched `html-to-text 10.0.1 → deepmerge-ts 8.0.2` dependency chain for [CVE-2026-40345](https://github.com/RebeccaStevens/deepmerge-ts/security/advisories/GHSA-ggr8-5vv4-36mx). This does not rely on root-only `pnpm.overrides`, which cannot fix consumers installing this plugin as a dependency. Add runtime dependency-chain and HTML-message parsing regression tests. An affected dependency is not proof that mail input can trigger this vulnerability.

## 0.9.0 (2026-08-31)

- new `email_watch` incremental new-mail tool (cursor-based, ideal for scheduled notifications); new "whale-girl courier" new-mail popup in the web UI (local skin artwork read at runtime + built-in fallback).

## 0.8.2 (2026-08-31)

- `since` / `until` parameter descriptions unified to English, consistent with the other parameters, so multilingual agents read them correctly.

## 0.8.0/0.8.1

- `email_list` / `email_search` gained `since` / `until` date-range filters; new `email_health` account-configuration self-check; adapted to harness 0.1.2 (removed the deleted client-injection declaration).

## 0.6.2

- server-side search covers `cc` (subject / sender / recipients / CC); the body fallback scan also matches `to` / `cc` and one malformed message no longer aborts the batch; lists are UID-descending (newest first); `email_send` strictly validates attachment paths.
