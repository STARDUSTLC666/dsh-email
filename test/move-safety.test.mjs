import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:net'
import { EmailPool, resolveEmailSettings } from '../lib/index.js'

// A real loopback IMAP peer: global EXPUNGE removes the unrelated deleted mail,
// whereas UID EXPUNGE and MOVE only affect the requested UID.
async function fixture(t, capabilities) {
  const inbox = new Map([[1, new Set()], [2, new Set(['\\Deleted'])], [3, new Set()]])
  const archive = [], commands = [], sockets = new Set()
  const server = createServer(socket => {
    sockets.add(socket); socket.on('close', () => sockets.delete(socket))
    socket.write('* PREAUTH [CAPABILITY IMAP4rev1 ' + capabilities.join(' ') + '] local fixture\r\n')
    let pending = ''
    socket.on('data', data => {
      pending += data.toString()
      while (pending.includes('\r\n')) {
        const cut = pending.indexOf('\r\n'), line = pending.slice(0, cut); pending = pending.slice(cut + 2)
        const space = line.indexOf(' '), tag = line.slice(0, space), command = line.slice(space + 1)
        commands.push(command)
        const send = value => socket.write(value + '\r\n')
        if (/^CAPABILITY/i.test(command)) send('* CAPABILITY IMAP4rev1 ' + capabilities.join(' '))
        else if (/^(SELECT|EXAMINE) /i.test(command)) {
          send('* FLAGS (\\Seen \\Deleted \\Flagged)'); send('* ' + inbox.size + ' EXISTS')
          send('* OK [UIDVALIDITY 1] stable'); send('* OK [UIDNEXT 4] next')
        } else if (/^LIST "" ""$/i.test(command)) send('* LIST (\\Noselect) "/" ""')
        else if (/^LIST /i.test(command)) {
          send('* LIST () "/" "INBOX"'); send('* LIST () "/" "Archive"')
        } else if (/^UID FETCH /i.test(command)) send('* 1 FETCH (UID 1 FLAGS ())')
        else if (/^UID (MOVE|COPY) /i.test(command)) {
          archive.push(1)
          if (/^UID MOVE/i.test(command)) inbox.delete(1)
        } else if (/^UID STORE /i.test(command)) inbox.get(1)?.add('\\Deleted')
        else if (/^(UID )?EXPUNGE/i.test(command)) {
          for (const [uid, flags] of inbox) if (flags.has('\\Deleted') && (!command.startsWith('UID ') || uid === 1)) { inbox.delete(uid); send('* 1 EXPUNGE') }
        } else if (/^LOGOUT/i.test(command)) { send('* BYE done'); send(tag + ' OK logout'); socket.end(); continue }
        else if (!/^(NOOP|CLOSE|UNSELECT|STATUS)/i.test(command)) { send(tag + ' BAD unsupported fixture command'); continue }
        send(tag + ' OK' + (/^(SELECT|EXAMINE)/i.test(command) ? ' [READ-WRITE]' : '') + ' completed')
      }
    })
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const pool = new EmailPool(resolveEmailSettings({ user: 'local@example.invalid', password: 'synthetic', imap: { host: '127.0.0.1', port: server.address().port, secure: false, socketTimeoutMs: 5000 }, smtp: { host: '127.0.0.1', port: 25, secure: false } }))
  t.after(async () => { pool.dispose(); for (const socket of sockets) socket.destroy(); await new Promise(resolve => server.close(resolve)) })
  return { pool, inbox, archive, commands }
}

for (const capabilities of [['MOVE'], ['UIDPLUS'], []]) test('move preserves unrelated deleted mail with capabilities: ' + (capabilities.join(',') || 'neither'), { timeout: 12000 }, async t => {
  const { pool, inbox, archive, commands } = await fixture(t, capabilities)
  if (!capabilities.length) {
    await assert.rejects(pool.mark(undefined, 'INBOX', 1, 'move', 'Archive'), /MOVE.*UIDPLUS/)
    assert.deepEqual([...inbox.keys()], [1, 2, 3])
    assert.deepEqual(archive, [])
    assert.equal(commands.some(command => /\b(COPY|STORE|EXPUNGE)\b/.test(command)), false)
  } else {
    const result = await pool.mark(undefined, 'INBOX', 1, 'move', 'Archive')
    assert.equal(result.movedTo, 'Archive')
    assert.deepEqual([...inbox.keys()], [2, 3])
    assert.deepEqual(archive, [1])
  }
  assert.ok(inbox.has(2), 'moving UID 1 must never expunge unrelated UID 2')
})
