import { createServer } from 'node:net'

import { deflateSync } from 'node:zlib'
function pngChunk(type, data) {
  const value=Buffer.concat([Buffer.from(type),data]);let crc=0xffffffff;for(const b of value){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}const head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([head,value,tail])
}
function chartPng() {
  const width=240,height=120,pixels=Buffer.alloc((width*4+1)*height),header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*(width*4+1)+1+x*4,bar=x>=30&&x<70&&y>=70&&y<100||x>=100&&x<140&&y>=45&&y<100||x>=170&&x<210&&y>=20&&y<100;pixels.set(bar?[75,120,235,255]:[235,242,255,255],i)}
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk('IHDR',header),pngChunk('IDAT',deflateSync(pixels)),pngChunk('IEND',Buffer.alloc(0))])
}
export const imageBytes = chartPng()
export const originalText = '季度汇报正文\n' + '这是一段需要完整接续的原文。'.repeat(240) + '\n原文结束标记 END-OF-ORIGINAL'
export const originalHtml = '<h2>季度汇报</h2><p>图文正文，支持<strong>重点</strong>与表格。</p><table><tr><th>指标</th><th>数值</th></tr><tr><td>增长</td><td>30%</td></tr></table><p>内嵌图片：</p><img src="cid:chart@fixture" alt="内嵌图表"><p>外部图片：</p><img src="https://images.example.invalid/chart.png?tracking=fixture" alt="外部图表"><script>window.__MAIL_EXECUTED=true</script>'
export function messageSource(subject='季度汇报 · 图文与回复') {
  return Buffer.from(['From: sender@example.invalid','To: local@example.invalid','Subject: '+subject,'Date: Thu, 05 Nov 2026 08:00:00 +0000','Message-ID: <original@fixture.invalid>','References: <earlier@fixture.invalid>','MIME-Version: 1.0','Content-Type: multipart/mixed; boundary="mailbox-fixture"','','--mailbox-fixture','Content-Type: text/plain; charset=utf-8','',originalText,'--mailbox-fixture','Content-Type: text/html; charset=utf-8','',originalHtml,'--mailbox-fixture','Content-Type: image/png; name="chart.png"','Content-ID: <chart@fixture>','Content-Disposition: inline; filename="chart.png"','Content-Transfer-Encoding: base64','',imageBytes.toString('base64'),'--mailbox-fixture--',''].join('\r\n'))
}
const quote = value => '"' + value.replaceAll('\\','\\\\').replaceAll('"','\\"') + '"'
export async function createMailboxPeer({ capabilities=['IMAP4rev1','UIDPLUS','MOVE'], noTrash=false }={}) {
  const commands=[],sockets=new Set(),sent=[],folders=new Map([['INBOX',{validity:11,next:10,messages:[{uid:7,subject:'Quarterly report',source:messageSource('Quarterly report'),seen:false},{uid:8,subject:'Second report',source:messageSource('Second report'),seen:false}]}],...(!noTrash?[['Trash',{validity:22,next:100,messages:[]}]]:[])]);
  const server=createServer(socket=>{
    sockets.add(socket);socket.on('error',()=>{});socket.on('close',()=>sockets.delete(socket));socket.write('* PREAUTH [CAPABILITY '+capabilities.join(' ')+'] mailbox fixture\r\n');let input='',selected='INBOX';
    socket.on('data',chunk=>{input+=chunk.toString();while(input.includes('\r\n')){
      const end=input.indexOf('\r\n'),line=input.slice(0,end);input=input.slice(end+2);const split=line.indexOf(' '),tag=line.slice(0,split),cmd=line.slice(split+1);commands.push(cmd);
      const send=s=>socket.write(s+'\r\n'),box=()=>folders.get(selected);
      const ranges=(range,uid)=>box().messages.filter((m,i)=>range.split(',').some(part=>{const [lo,hi=lo]=part.split(':').map(n=>n==='*'?(uid?box().next-1:box().messages.length):Number(n));return (uid?m.uid:i+1)>=lo&&(uid?m.uid:i+1)<=hi}));
      if(/^CAPABILITY/i.test(cmd))send('* CAPABILITY '+capabilities.join(' '));
      else if(/^LIST /i.test(cmd)){if(/ ""$/.test(cmd))send('* LIST (\\Noselect) "/" ""');else for(const[name]of folders)send('* LIST ('+(name==='INBOX'?'\\Inbox':name==='Trash'?'\\Trash':'')+') "/" '+quote(name))}
      else if(/^(EXAMINE|SELECT) /i.test(cmd)){
        selected=cmd.replace(/^(EXAMINE|SELECT) /i,'').replace(/ .*/,'').replace(/^"|"$/g,'');if(!folders.has(selected)){send(tag+' NO folder missing');continue}
        send('* FLAGS (\\Seen \\Flagged \\Deleted)');send('* '+box().messages.length+' EXISTS');send('* OK [UIDVALIDITY '+box().validity+'] stable');send('* OK [UIDNEXT '+box().next+'] next');
      }else if(/^(UID )?SEARCH /i.test(cmd)){send('* SEARCH '+box().messages.filter(m=>!cmd.includes('UNSEEN')||!m.seen).map(m=>m.uid).join(' '))}
      else if(/^(UID )?FETCH /i.test(cmd)){
        const match=cmd.match(/^(UID )?FETCH ([0-9:,*]+) /i);if(!match){send(tag+' BAD range');continue}
        for(const m of ranges(match[2],!!match[1])){
          const seq=box().messages.indexOf(m)+1,fields=['UID '+m.uid,'FLAGS ('+(m.seen?'\\Seen':'')+')'];
          if(cmd.includes('ENVELOPE'))fields.push('ENVELOPE ("Thu, 05 Nov 2026 08:00:00 +0000" '+quote(m.subject)+' ((NIL NIL "sender" "example.invalid")) NIL NIL ((NIL NIL "local" "example.invalid")) NIL NIL NIL "<original@fixture.invalid>")');
          if(cmd.includes('RFC822.SIZE'))fields.push('RFC822.SIZE '+m.source.length);
          if(cmd.includes('BODYSTRUCTURE'))fields.push('BODYSTRUCTURE (("TEXT" "PLAIN" ("CHARSET" "UTF-8") NIL NIL "8BIT" '+Buffer.byteLength(originalText)+' 3)("TEXT" "HTML" ("CHARSET" "UTF-8") NIL NIL "8BIT" '+Buffer.byteLength(originalHtml)+' 1)("IMAGE" "PNG" ("NAME" "chart.png") "<chart@fixture>" NIL "BASE64" '+imageBytes.toString('base64').length+' NIL ("INLINE" ("FILENAME" "chart.png"))) "MIXED")');
          const parts=[...cmd.matchAll(/BODY(?:\.PEEK)?\[([^\]]*)\](?:<(\d+)\.(\d+)>)?/gi)];
          if(parts.length){socket.write('* '+seq+' FETCH ('+fields.join(' '));for(const part of parts){const section=part[1];let bytes;
            if(/^[123]\.MIME$/.test(section)){const n=section[0];bytes=Buffer.from('Content-Type: '+(n==='3'?'image/png':'text/'+(n==='1'?'plain':'html')+'; charset=utf-8')+'\r\nContent-Transfer-Encoding: '+(n==='3'?'base64':'8bit')+'\r\n\r\n')}
            else bytes=section==='1'?Buffer.from(originalText):section==='2'?Buffer.from(originalHtml):section==='3'?Buffer.from(imageBytes.toString('base64')):section.startsWith('HEADER')?Buffer.from('Message-ID: <original@fixture.invalid>\r\nReferences: <earlier@fixture.invalid>\r\n\r\n'):m.source;
            const offset=Number(part[2]||0),length=Number(part[3]||bytes.length);bytes=bytes.subarray(offset,offset+length);socket.write(' BODY['+section+']'+(part[2]!==undefined?'<'+offset+'>':'')+' {'+bytes.length+'}\r\n');socket.write(bytes);
          }send(')')}else send('* '+seq+' FETCH ('+fields.join(' ')+')');
        }
      }else if(/^UID MOVE /i.test(cmd)){
        const match=cmd.match(/^UID MOVE ([0-9:,*]+) (.+)$/i),target=folders.get(match?.[2].replace(/^"|"$/g,''));if(!target){send(tag+' NO target missing');continue}
        const moving=ranges(match[1],true),from=moving.map(m=>m.uid),to=moving.map(m=>{const next=target.next++;target.messages.push({...m,uid:next});return next});for(const m of moving){send('* '+(box().messages.indexOf(m)+1)+' EXPUNGE');box().messages.splice(box().messages.indexOf(m),1)}send(tag+' OK [COPYUID '+target.validity+' '+from.join(',')+' '+to.join(',')+'] moved');continue;
      }else if(/^UID STORE /i.test(cmd)){const match=cmd.match(/^UID STORE ([0-9:,*]+) ([+-])FLAGS/);for(const m of ranges(match[1],true)){if(cmd.includes('\\Seen'))m.seen=match[2]==='+'}}
      else if(/^LOGOUT/i.test(cmd)){send('* BYE done');send(tag+' OK logout');socket.end();continue}
      else if(!/^(NOOP|CLOSE|UNSELECT)/i.test(cmd)){send(tag+' BAD unsupported fixture command');continue}
      send(tag+' OK'+(/^(EXAMINE|SELECT)/i.test(cmd)?' [READ-WRITE]':'')+' completed')
    }})
  });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const smtp=createServer(socket=>{sockets.add(socket);socket.on('error',()=>{});socket.on('close',()=>sockets.delete(socket));socket.write('220 fixture ESMTP\r\n');let input='',data=false,lines=[];socket.on('data',chunk=>{input+=chunk;while(input.includes('\r\n')){const end=input.indexOf('\r\n'),line=input.slice(0,end);input=input.slice(end+2);const reply=s=>socket.write(s+'\r\n');if(data){if(line==='.'){sent.push(lines.join('\r\n'));data=false;lines=[];reply('250 accepted')}else lines.push(line.replace(/^\.\./,'.'))}else if(/^(EHLO|HELO)/.test(line))reply('250-fixture\r\n250 AUTH PLAIN LOGIN');else if(/^AUTH/.test(line))reply('235 authenticated');else if(line==='DATA'){data=true;reply('354 ready')}else if(line==='QUIT'){reply('221 bye');socket.end()}else reply('250 OK')}})});await new Promise(resolve=>smtp.listen(0,'127.0.0.1',resolve));
  return{port:server.address().port,smtpPort:smtp.address().port,commands,sent,folders,async close(){for(const s of sockets)s.destroy();await Promise.all([new Promise(r=>server.close(r)),new Promise(r=>smtp.close(r))])}}
}
