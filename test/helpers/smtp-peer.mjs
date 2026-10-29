import { createServer } from 'node:net'

/** Loopback-only SMTP sink; never forwards mail or contacts a real provider. */
export async function createSmtpPeer() {
  const messages=[],sockets=new Set()
  const server=createServer(socket=>{
    sockets.add(socket);socket.on('error',()=>{});socket.on('close',()=>sockets.delete(socket))
    let buffer='',data=false,lines=[]
    socket.write('220 loopback.fixture ESMTP\r\n')
    socket.on('data',chunk=>{
      buffer+=chunk.toString();while(buffer.includes('\r\n')){
        const index=buffer.indexOf('\r\n'),line=buffer.slice(0,index);buffer=buffer.slice(index+2)
        if(data){if(line==='.') {messages.push(lines.join('\r\n'));data=false;lines=[];socket.write('250 2.0.0 synthetic accepted\r\n')}else lines.push(line.startsWith('..')?line.slice(1):line);continue}
        if(/^EHLO/i.test(line))socket.write('250-loopback.fixture\r\n250-AUTH PLAIN\r\n250 8BITMIME\r\n')
        else if(/^AUTH PLAIN/i.test(line))socket.write('235 2.7.0 synthetic authenticated\r\n')
        else if(/^DATA/i.test(line)){data=true;socket.write('354 end with dot\r\n')}
        else if(/^QUIT/i.test(line)){socket.end('221 bye\r\n')}
        else socket.write('250 OK\r\n')
      }
    })
  })
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  return{port:server.address().port,messages,async close(){for(const s of sockets)s.destroy();await new Promise(resolve=>server.close(resolve))}}
}
