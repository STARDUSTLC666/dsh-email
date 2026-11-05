# Formatted mail, threaded replies and Trash

Available in dsh-email 0.22.1, under **Email → Mailbox**. UI language follows DSH.

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

## Move to Trash

This workbench feature supports **IMAP**. Select one message in the reader, or select up to 20 on the current page, then choose **Move to Trash**.

1. The dialog shows the account, source, destination and message subjects. It uses the server's `\Trash` folder when available. Otherwise explicitly choose an existing folder; the plugin does not create or empty one.
2. Cancel makes no changes. Confirmation expires in 90 seconds and must be renewed if the account or mailbox identity changes.
3. Confirming performs a scoped move. It does not permanently delete messages or empty the folder. The server must support MOVE or UIDPLUS; otherwise the operation is refused.
4. When the server returns complete destination UIDs and UIDVALIDITY, a **one-use Undo is available for 5 minutes**. Without that mapping, restore through your mail client.

If the connection fails during a move, the outcome may be uncertain. Refresh both folders and check before retrying. Undo also validates message identity. POP3 and AgentMail do not yet expose workbench Trash; organize those messages in the original client.

Automatic installation remains off by default. Users choose when to upgrade and restart.
