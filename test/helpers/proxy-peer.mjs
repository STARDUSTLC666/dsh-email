import { connect, createServer } from 'node:net'

function closeAll(server, sockets) {
  for (const socket of sockets) socket.destroy()
  return new Promise(resolve => server.close(resolve))
}

/**
 * Local HTTP CONNECT + plain HTTP forward proxy for tests.
 *
 * Records every CONNECT / absolute-URI request line and headers, enforces
 * optional Basic `Proxy-Authorization`, and optionally rewrites the dialled
 * upstream `{ host, port }` so tests can intercept public OAuth hostnames
 * without touching the real internet.
 */
export async function startHttpProxy({ auth, rewriteTarget, status = 200 } = {}) {
  const seen = []
  const sockets = new Set()
  const expectedAuth = auth
    ? 'Basic ' + Buffer.from(`${auth.user}:${auth.pass}`).toString('base64')
    : undefined

  const server = createServer(client => {
    sockets.add(client)
    client.on('error', () => {})
    client.on('close', () => sockets.delete(client))

    let buffered = Buffer.alloc(0)
    const onData = chunk => {
      buffered = Buffer.concat([buffered, chunk])
      const end = buffered.indexOf('\r\n\r\n')
      if (end < 0) return
      client.off('data', onData)
      const head = buffered.subarray(0, end).toString('latin1')
      const rest = buffered.subarray(end + 4)
      const lines = head.split('\r\n')
      const [method = '', target = '', version = 'HTTP/1.1'] = lines[0].split(' ')
      const headers = {}
      for (const line of lines.slice(1)) {
        const sep = line.indexOf(':')
        if (sep > 0) headers[line.slice(0, sep).trim().toLowerCase()] = line.slice(sep + 1).trim()
      }
      seen.push({ method, target, headers, raw: head })

      if (expectedAuth && headers['proxy-authorization'] !== expectedAuth) {
        client.end('HTTP/1.1 407 Proxy Authentication Required\r\nContent-Length: 0\r\n\r\n')
        return
      }
      if (status !== 200) {
        client.end(`HTTP/1.1 ${status} Refused\r\nContent-Length: 0\r\n\r\n`)
        return
      }

      if (method === 'CONNECT') {
        const match = /^(?:\[([^\]]+)\]|([^:]+)):(\d+)$/.exec(target)
        if (!match) { client.end('HTTP/1.1 400 Bad Request\r\n\r\n'); return }
        const requested = { host: match[1] || match[2], port: Number(match[3]) }
        const dest = rewriteTarget ? rewriteTarget(requested) : requested
        if (!dest) { client.end('HTTP/1.1 502 Bad Gateway\r\n\r\n'); return }
        const upstream = connect({ host: dest.host, port: dest.port })
        sockets.add(upstream)
        upstream.on('close', () => sockets.delete(upstream))
        upstream.once('error', () => {
          if (!client.destroyed) client.end('HTTP/1.1 502 Bad Gateway\r\n\r\n')
        })
        upstream.once('connect', () => {
          client.write('HTTP/1.1 200 Connection Established\r\n\r\n', 'latin1')
          if (rest.length > 0) upstream.write(rest)
          client.pipe(upstream)
          upstream.pipe(client)
        })
        return
      }

      // Plain HTTP absolute-URI forwarding.
      let parsed
      try { parsed = new URL(target) } catch { client.end('HTTP/1.1 400 Bad Request\r\n\r\n'); return }
      const requested = { host: parsed.hostname.replace(/^\[|\]$/g, ''), port: Number(parsed.port || 80) }
      const dest = rewriteTarget ? rewriteTarget(requested) : requested
      if (!dest) { client.end('HTTP/1.1 502 Bad Gateway\r\n\r\n'); return }
      const forwardLines = [`${method} ${parsed.pathname}${parsed.search} ${version}`]
      for (const line of lines.slice(1)) {
        if (!/^proxy-/i.test(line)) forwardLines.push(line)
      }
      const upstream = connect({ host: dest.host, port: dest.port })
      sockets.add(upstream)
      upstream.on('close', () => sockets.delete(upstream))
      upstream.once('error', () => {
        if (!client.destroyed) client.end('HTTP/1.1 502 Bad Gateway\r\n\r\n')
      })
      upstream.once('connect', () => {
        upstream.write(forwardLines.join('\r\n') + '\r\n\r\n', 'latin1')
        if (rest.length > 0) upstream.write(rest)
        client.pipe(upstream)
        upstream.pipe(client)
      })
    }
    client.on('data', onData)
  })

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  return {
    port,
    url: `http://127.0.0.1:${port}`,
    seen,
    close: () => closeAll(server, sockets),
  }
}

/**
 * Local RFC 1928 / RFC 1929 SOCKS5 proxy for tests.
 *
 * Supports no-auth (0x00) and username/password (0x02), IPv4 (0x01), domain
 * (0x03) and IPv6 (0x04), records each requested target, and optionally
 * rewrites the upstream destination to a local server.
 */
export async function startSocks5Proxy({ auth, rewriteTarget, failReply } = {}) {
  const seen = []
  const sockets = new Set()

  const server = createServer(client => {
    sockets.add(client)
    client.on('error', () => {})
    client.on('close', () => sockets.delete(client))

    let state = 'greeting'
    let buf = Buffer.alloc(0)
    let authUser = ''

    const process = () => {
      if (state === 'greeting') {
        if (buf.length < 2) return
        const nmethods = buf[1]
        if (buf.length < 2 + nmethods) return
        const methods = buf.subarray(2, 2 + nmethods)
        buf = buf.subarray(2 + nmethods)
        const want = auth ? 0x02 : 0x00
        if (!methods.includes(want)) {
          client.end(Buffer.from([0x05, 0xff]))
          return
        }
        client.write(Buffer.from([0x05, want]))
        state = auth ? 'auth' : 'request'
        if (buf.length > 0) process()
        return
      }

      if (state === 'auth') {
        if (buf.length < 2) return
        const ulen = buf[1]
        if (buf.length < 2 + ulen + 1) return
        const plen = buf[2 + ulen]
        if (buf.length < 3 + ulen + plen) return
        const user = buf.subarray(2, 2 + ulen).toString('utf8')
        const pass = buf.subarray(3 + ulen, 3 + ulen + plen).toString('utf8')
        buf = buf.subarray(3 + ulen + plen)
        authUser = user
        if (user !== auth.user || pass !== auth.pass) {
          client.end(Buffer.from([0x01, 0x01]))
          return
        }
        client.write(Buffer.from([0x01, 0x00]))
        state = 'request'
        if (buf.length > 0) process()
        return
      }

      if (state === 'request') {
        if (buf.length < 4) return
        const atyp = buf[3]
        let host = ''
        let offset = 4
        if (atyp === 0x01) {
          if (buf.length < offset + 4 + 2) return
          host = `${buf[offset]}.${buf[offset + 1]}.${buf[offset + 2]}.${buf[offset + 3]}`
          offset += 4
        } else if (atyp === 0x03) {
          if (buf.length < offset + 1) return
          const len = buf[offset]
          if (buf.length < offset + 1 + len + 2) return
          host = buf.subarray(offset + 1, offset + 1 + len).toString('utf8')
          offset += 1 + len
        } else if (atyp === 0x04) {
          if (buf.length < offset + 16 + 2) return
          const groups = []
          for (let i = 0; i < 16; i += 2) groups.push(buf.readUInt16BE(offset + i).toString(16))
          host = groups.join(':')
          offset += 16
        } else {
          client.end(Buffer.from([0x05, 0x08, 0x00, 0x01, 0, 0, 0, 0, 0, 0]))
          return
        }
        const port = buf.readUInt16BE(offset)
        const rest = buf.subarray(offset + 2)
        buf = Buffer.alloc(0)
        state = 'tunnel'
        client.off('data', onData)

        seen.push({ host, port, atyp, authUser })
        if (failReply) {
          client.end(Buffer.from([0x05, failReply, 0x00, 0x01, 0, 0, 0, 0, 0, 0]))
          return
        }
        const dest = rewriteTarget ? rewriteTarget({ host, port, atyp }) : { host, port }
        if (!dest) {
          client.end(Buffer.from([0x05, 0x05, 0x00, 0x01, 0, 0, 0, 0, 0, 0]))
          return
        }
        const upstream = connect({ host: dest.host, port: dest.port })
        sockets.add(upstream)
        upstream.on('close', () => sockets.delete(upstream))
        upstream.once('error', () => {
          if (!client.destroyed) client.end(Buffer.from([0x05, 0x05, 0x00, 0x01, 0, 0, 0, 0, 0, 0]))
        })
        upstream.once('connect', () => {
          client.write(Buffer.from([0x05, 0x00, 0x00, 0x01, 127, 0, 0, 1, 0, 0]))
          if (rest.length > 0) upstream.write(rest)
          client.pipe(upstream)
          upstream.pipe(client)
        })
      }
    }

    const onData = chunk => {
      buf = Buffer.concat([buf, chunk])
      process()
    }
    client.on('data', onData)
  })

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  return {
    port,
    url: `socks5://127.0.0.1:${port}`,
    seen,
    close: () => closeAll(server, sockets),
  }
}
