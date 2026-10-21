import { createServer } from 'node:net'

/** Synthetic QQ-like SEARCH failure, with real IMAP envelope FETCH replies. */
export async function createSearchPeer() {
  const messages = Array.from({ length: 2268 }, (_, index) => ({
    seq: index + 1, uid: index + 107,
    from: index + 107 === 2303 ? 'notifications@github.com' : 'other@example.invalid',
    subject: index + 107 === 2211 ? '[project/chenxin] CI failed' : 'Imported message',
  }))
  const commands = [], sockets = new Set()
  const quote = value => '"' + value.replaceAll('\\', '\\\\').replaceAll('"', '\\"') + '"'
  const server = createServer(socket => {
    sockets.add(socket); socket.on('close', () => sockets.delete(socket))
    socket.write('* PREAUTH [CAPABILITY IMAP4rev1] synthetic mailbox\r\n')
    let input = ''
    socket.on('data', data => {
      input += data.toString()
      while (input.includes('\r\n')) {
        const end = input.indexOf('\r\n'), line = input.slice(0, end); input = input.slice(end + 2)
        const cut = line.indexOf(' '), tag = line.slice(0, cut), command = line.slice(cut + 1)
        commands.push(command)
        const send = text => socket.write(text + '\r\n')
        if (/^CAPABILITY/i.test(command)) send('* CAPABILITY IMAP4rev1')
        else if (/^(EXAMINE|SELECT) /i.test(command)) {
          send('* FLAGS (\\Seen)'); send('* 2268 EXISTS'); send('* OK [UIDVALIDITY 1] stable'); send('* OK [UIDNEXT 2375] next')
        } else if (/^LIST /i.test(command)) send('* LIST (\\Noselect) "/" ""')
        else if (/^(UID )?SEARCH /i.test(command)) send('* SEARCH')
        else if (/^(UID )?FETCH /i.test(command)) {
          const match = command.match(/^(UID )?FETCH ([0-9:,*]+) /i)
          if (!match) { send(tag + ' BAD malformed range'); continue }
          const uid = Boolean(match[1])
          const selected = messages.filter(message => match[2].split(',').some(part => {
            const [first, last = first] = part.split(':').map(value => value === '*' ? (uid ? 2374 : 2268) : Number(value))
            const number = uid ? message.uid : message.seq
            return number >= first && number <= last
          }))
          for (const message of selected) {
            const [user, domain] = message.from.split('@')
            const envelope = '("Thu, 01 Jan 2022 00:00:00 +0000" ' + quote(message.subject) + ' ((NIL NIL ' + quote(user) + ' ' + quote(domain) + ')) NIL NIL ((NIL NIL "local" "example.invalid")) NIL NIL NIL "<synthetic-' + message.uid + '>")'
            send('* ' + message.seq + ' FETCH (UID ' + message.uid + ' FLAGS () RFC822.SIZE 100 INTERNALDATE "20-Oct-2026 01:00:00 +0000" ENVELOPE ' + envelope + (command.includes('BODYSTRUCTURE') ? ' BODYSTRUCTURE ("TEXT" "PLAIN" ("CHARSET" "UTF-8") NIL NIL "7BIT" 1 1)' : '') + ')')
          }
        } else if (/^LOGOUT/i.test(command)) { send('* BYE done'); send(tag + ' OK logout'); socket.end(); continue }
        else if (!/^(NOOP|CLOSE|UNSELECT)/i.test(command)) { send(tag + ' BAD unsupported fixture command'); continue }
        send(tag + ' OK' + (/^(EXAMINE|SELECT)/i.test(command) ? ' [READ-ONLY]' : '') + ' completed')
      }
    })
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  return { port: server.address().port, commands, async close() { for (const socket of sockets) socket.destroy(); await new Promise(resolve => server.close(resolve)) } }
}
