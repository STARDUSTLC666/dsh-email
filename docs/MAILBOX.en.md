# Formatted mail, threaded replies and Trash

Available in dsh-email 0.22.1, under **Email → Mailbox**. UI language follows DSH.

## Folder tree and unread counts

The folder rail follows the delimiter and parent path returned by the server: system folders come first, custom folders follow by name, and subfolders are indented under their parent with an expand/collapse control. Hovering a folder reveals its full path, and **Manage folders** uses the same nested ordering.

The number after a folder is that folder's own unread count, read from IMAP `STATUS UNSEEN` (returned with `LIST` when the server supports `LIST-STATUS`, otherwise queried folder by folder). Opening a message or changing its read state updates the current folder's badge immediately; reloading the folder list takes the server's value. Servers that cannot report `STATUS` show no badge rather than a fake zero. POP3 and AgentMail have no server-side unread count and therefore no badge.

## Read formatted messages

The reader preserves paragraphs, lists, tables, links and recognized inline images. Switch to plain text at any time. Messages are rendered as allowlisted React data: scripts, forms, embedded pages, event handlers and sender styles never enter the page.

CID images are read from attachments of the current message. PNG, JPEG, GIF and WebP can be displayed, up to 2 MiB per image. SVG and other formats remain download-only. Broken images show a retryable failure. Formatting is bounded to 256 KiB HTML, 32 levels, 5,000 nodes and 40 images, with a visible limit notice. Plain text still respects the account's `maxBodyChars`.

**External images are blocked by default.** Choose **Load external images** for the current open message only. Opening another message or reopening it requires consent again. Loading can reveal your reading time and network address to the sender. The server downloads public HTTPS images without mailbox credentials, browser cookies or referrer headers, rejecting private destinations and unsafe redirects. Network, proxy or server restrictions can prevent loading; retry or use your mail client. Keep any VPN or security settings you need.

When a VPN returns Fake-IP addresses (198.18/15), the plugin verifies the real public addresses using Cloudflare encrypted DNS, pins the connection to validated addresses, and repeats the checks for each redirect. Ordinary public DNS answers keep the system path. Only the hostname of a selected external image or attachment may be queried; the complete URL, mailbox credentials and message body are not sent to the resolver. Local and reserved internal names are not forwarded. Downloads remain blocked when their public destination cannot be verified, with a visible reason. Individual image servers or network failures may still prevent loading.

AgentMail HTTPS/data images work; when its API does not provide a matching Content-ID, CID images retain a placeholder and the original attachment download. POP3 still retrieves complete MIME messages. IMAP prefers individual body and image parts.

## Reply in the original thread

1. Choose **Reply in drafts** or **Reply all in drafts** in the original message. Nothing is sent.
2. Write above the quoted original. Ordinary long messages are no longer cut at 2,000 characters; quotes are capped at 20,000 with an explicit truncation marker.
3. Save and preview the actual To/Cc, account, body and attachments, then confirm sending.

Edits preserve the reply reference. Sending retrieves the original `Message-ID` and `References`. IMAP replies are refused if the folder's UIDVALIDITY changed, preventing a reply to a renumbered message. Recipient deny rules and send confirmation still apply.

## Address book and recipient names

The workbench adds a **Contacts** tab. Contacts stay on this machine in `~/.dsh/data/dsh-email/contacts-v2.sqlite3` (the same path under `DSH_HOME`) and are never uploaded anywhere. A `contacts-v1.json` left by an older version is imported once on the first read or write and the original file is kept.

- **Auto-collected**: opening a message list or a message records its senders plus that message's To/Cc (the account's own addresses are always skipped). Each address is stored once with its usage count and last-seen time. Learned entries are capped at 5,000; the least used, least recently seen and last by name are forgotten first.
- **Search keys**: every entry gets a search string computed on write — the Chinese name, full pinyin syllables, pinyin initials, the mailbox local part (工号) and the department's pinyin, e.g. `张小明(技术二部)` / `100123@example.com` becomes `zhangxiaoming zxm jishuerbu jseb 100123`. Polyphonic surnames are indexed by their surname reading (曾=zeng, 单=shan, 解=xie, 查=zha, 仇=qiu, 区=ou, 朴=piao, 乐=yue, 尉迟=yu chi, 长孙=zhang sun), so 曾伟 is not indexed as `cengwei`.
- **Added manually**: enter a name, address and optional note in the Contacts tab. Editing a learned entry turns it into a curated one, and from then on message display names never override the name you typed.
- **Name rendering**: the reader's sender, To and Cc lines and the message list's sender column show a curated name first; without one they use the message's own display name, and only then the learned name or the bare address. Rendering is `Name <address>`.
- **Safety**: names are stripped of `<`, `>`, quotes, commas, semicolons and control characters before storage so a composed header cannot be injected. A damaged contacts file or database is reported and preserved rather than silently cleared, and it never blocks reading mail.

## Recipient autocomplete while composing

The To and Cc fields of **Compose** use the caret position to identify the one address being edited and suggest contacts for it:

- Type an address prefix (`ali`) or part of a name to filter. Candidates rank as exact address, address prefix, name prefix, pinyin/initials/工号 prefix, then substring, and curated contacts rank before learned ones — so `张小`, `zxm`, `zhangxiaoming` and 工号 `100123` all reach the same colleague.
- Choose with `↑` / `↓` and fill with `Enter` or `Tab`, or click a suggestion. Typing a known address in full and pressing `Enter` / `Tab` also brings the name in. The field is filled with `Name <address>`, so the recipient sees a person instead of a bare mailbox.
- Only the address under the caret is completed: in `a@x.com, b` only `b` is completed. `Esc` closes the list, any address can still be typed by hand, and a missing suggestion never blocks sending.
- Drafts keep storing the plain comma-separated address string, so the existing recipient rules, deny list and send review behave exactly as before.

## Move to Trash

This workbench feature supports **IMAP**. Select one message in the reader, or select up to 20 on the current page, then choose **Move to Trash**.

1. The dialog shows the account, source, destination and message subjects. It uses the server's `\Trash` folder when available. Otherwise explicitly choose an existing folder; the plugin does not create or empty one.
2. Cancel makes no changes. Confirmation expires in 90 seconds and must be renewed if the account or mailbox identity changes.
3. Confirming performs a scoped move. It does not permanently delete messages or empty the folder. The server must support MOVE or UIDPLUS; otherwise the operation is refused.
4. When the server returns complete destination UIDs and UIDVALIDITY, a **one-use Undo is available for 5 minutes**. Without that mapping, restore through your mail client.

If the connection fails during a move, the outcome may be uncertain. Refresh both folders and check before retrying. Undo also validates message identity. POP3 and AgentMail do not yet expose workbench Trash; organize those messages in the original client.

Automatic installation remains off by default. Users choose when to upgrade and restart.
