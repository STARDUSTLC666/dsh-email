import { createServer } from 'node:http'

export async function createAgentMailPeer() {
  const inbox = 'assistant@agentmail.to',
    requests = [],
    sent = []
  const make = (id, flags = ['received', 'unread']) => ({
    inbox_id: inbox,
    message_id: '<message-' + id + '@agent.test>',
    timestamp: new Date(Date.UTC(2026, 9, 21, 0, 0, 100 - id)).toISOString(),
    from: 'Vendor <vendor@example.invalid>',
    to: [inbox],
    cc: [],
    subject: '报价单 ' + id,
    text: '这是报价单正文 ' + id + '\n<script>untrusted mail</script>',
    labels: flags,
    size: 500,
    attachments: [],
  })
  const messages = Array.from({ length: 45 }, (_, i) => make(i))
  messages.push(make(90, ['sent', 'read']))
  messages[0].attachments = [
    {
      attachment_id: 'attachment-1',
      filename: 'quote.txt',
      content_type: 'text/plain',
      size: 5,
    },
  ]
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://fixture'),
      body = []
    for await (const c of req) body.push(c)
    const parsed = body.length ? JSON.parse(Buffer.concat(body)) : undefined
    requests.push({
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      authorization: req.headers.authorization,
      body: parsed,
    })
    const json = (status, value) => {
      res.writeHead(status, { 'content-type': 'application/json' })
      res.end(JSON.stringify(value))
    }
    if (req.headers.authorization !== 'Bearer synthetic-agentmail-key')
      return json(401, { message: 'do not leak credentials' })
    const base = '/v0/inboxes/' + encodeURIComponent(inbox)
    if (url.pathname === base) return json(200, { inbox_id: inbox })
    if (
      url.pathname === base + '/messages' ||
      url.pathname === base + '/messages/search'
    ) {
      const query = url.searchParams.get('q') || '',
        filters = url.searchParams.getAll('labels'),
        offset = Number(url.searchParams.get('page_token') || 0),
        limit = Number(url.searchParams.get('limit') || 100)
      const rows = messages.filter(
          (m) =>
            filters.every((label) => m.labels.includes(label)) &&
            (!query ||
              (m.subject + ' ' + m.text + ' ' + m.from).includes(query)),
        ),
        page = rows.slice(offset, offset + limit)
      return json(200, {
        count: page.length,
        messages: page,
        ...(offset + limit < rows.length
          ? { next_page_token: String(offset + limit) }
          : {}),
      })
    }
    if (
      req.method === 'POST' &&
      (url.pathname === base + '/messages/send' ||
        url.pathname.endsWith('/reply'))
    ) {
      const receipt = {
        message_id: '<sent-' + sent.length + '@agent.test>',
        thread_id: 'thread-1',
      }
      sent.push({ body: parsed, path: url.pathname, ...receipt })
      return json(200, receipt)
    }
    const path = url.pathname.slice((base + '/messages/').length).split('/'),
      id = decodeURIComponent(path[0] || ''),
      message = messages.find((m) => m.message_id === id)
    if (!message) return json(404, { message: 'missing' })
    if (path[1] === 'attachments')
      return json(200, {
        attachment_id: 'attachment-1',
        filename: 'quote.txt',
        size: 5,
        download_url: 'https://files.agentmail.to/synthetic-file',
      })
    if (req.method === 'PATCH') {
      message.labels = [
        ...new Set([
          ...message.labels.filter((l) => !parsed.remove_labels?.includes(l)),
          ...(parsed.add_labels || []),
        ]),
      ]
      return json(200, { message_id: id, labels: message.labels })
    }
    return json(200, message)
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const fetcher = (input, init) => {
    const source = new URL(input)
    if (!['api.agentmail.to', 'api.agentmail.eu'].includes(source.hostname))
      throw new Error('Unexpected API host')
    return fetch(
      'http://127.0.0.1:' +
        server.address().port +
        source.pathname +
        source.search,
      init,
    )
  }
  return {
    inbox,
    requests,
    sent,
    messages,
    make,
    fetcher,
    async close() {
      server.closeAllConnections()
      await new Promise((resolve) => server.close(resolve))
    },
  }
}
