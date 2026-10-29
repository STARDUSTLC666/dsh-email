import { createServer } from 'node:net'
import { createServer as createTlsServer } from 'node:tls'
import { readFileSync } from 'node:fs'

export function message(uid, subject='Synthetic POP3', text='A controlled message') {
  return {uid, raw:Buffer.from('From: "Fixture" <sender@example.invalid>\r\nTo: user@example.invalid\r\nMessage-ID: <'+uid+'@example.invalid>\r\nDate: Wed, 28 Oct 2026 10:00:00 +0000\r\nSubject: '+subject+'\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n'+text+'\r\n')}
}
/** Actual wire peer, mutable between transactions, with deliberate terminator fragmentation. */
export async function createPop3Peer(options={}) {
  const messages=options.messages ?? [message('id-one'),message('id-two','Newest POP3','Hello\r\n.line beginning\r\n..two dots')]
  const commands=[],sockets=new Set()
  const onSocket=socket=>{
    sockets.add(socket);socket.setNoDelay(true);socket.on('error',()=>{});socket.on('close',()=>sockets.delete(socket))
    const rows=messages.slice();let buffer='',chain=Promise.resolve()
    const send=text=>socket.write(text+'\r\n')
    send(options.greeting ?? '+OK synthetic maildrop')
    const multiline=async(value)=>{
      const bytes=Buffer.isBuffer(value)?value:Buffer.from(value)
      const stuffed=Buffer.from(bytes.toString('latin1').replace(/(^|\r\n)\./g,'$1..'),'latin1')
      const full=Buffer.concat([Buffer.from('+OK follows\r\n'),stuffed,stuffed.subarray(-2).equals(Buffer.from('\r\n'))?Buffer.alloc(0):Buffer.from('\r\n'),Buffer.from('.\r\n')])
      if(options.fragment===false){socket.write(full);return}
      // Split the end marker at every boundary; do not let one TCP write hide the bug.
      for(const part of [full.subarray(0,-6),...Array.from(full.subarray(-6),x=>Buffer.from([x]))]){
        if(socket.destroyed)return;socket.write(part);await new Promise(r=>setTimeout(r,1))
      }
    }
    socket.on('data',data=>{
      buffer+=data.toString();while(buffer.includes('\r\n')){
        const end=buffer.indexOf('\r\n'),line=buffer.slice(0,end);buffer=buffer.slice(end+2)
        const [cmd,...args]=line.split(' ');commands.push(cmd==='PASS'?'PASS ***':line)
        chain=chain.then(async()=>{
          if(options.hang===cmd)return
          if(cmd==='USER')send('+OK user')
          else if(cmd==='PASS')send(options.authFailure||args.join(' ')!==(options.password??'fixture-secret')?'-ERR POP3 password=fixture-secret rejected':'+OK password')
          else if(cmd==='STAT')send('+OK '+rows.length+' '+rows.reduce((n,m)=>n+m.raw.length,0))
          else if(cmd==='UIDL'){
            if(options.noUidl)send('-ERR UIDL unavailable')
            else await multiline(rows.map((m,i)=>(i+1)+' '+m.uid).join('\r\n'))
          }else if(cmd==='LIST')await multiline(rows.map((m,i)=>(i+1)+' '+(options.size ?? m.raw.length)).join('\r\n'))
          else if(cmd==='TOP'||cmd==='RETR'){
            if(cmd==='TOP'&&options.noTop){send('-ERR TOP unsupported');return}
            const m=rows[Number(args[0])-1]
            if(!m){send('-ERR missing');return}
            const headerEnd=m.raw.indexOf('\r\n\r\n')
            await multiline(cmd==='TOP'?m.raw.subarray(0,headerEnd+4):m.raw)
          }else if(cmd==='QUIT'){send('+OK bye');socket.end()}
          else send('-ERR unsupported fixture command')
        }).catch(()=>socket.destroy())
      }
    })
  }
  const server=options.tls?createTlsServer({key:readFileSync(new URL('../fixtures/smtp-test-key.pem',import.meta.url)),cert:readFileSync(new URL('../fixtures/smtp-test-ca.pem',import.meta.url))},onSocket):createServer(onSocket)
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  return{port:server.address().port,messages,commands,sockets,async close(){for(const s of sockets)s.destroy();await new Promise(resolve=>server.close(resolve))}}
}
