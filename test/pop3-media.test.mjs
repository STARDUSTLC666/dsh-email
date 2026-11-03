import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Pop3Client, EmailService, resolveEmailSettings } from '../lib/index.js'
import { createPop3Peer, message } from './helpers/pop3-peer.mjs'
import { fixture } from './helpers/pop3-fixture.mjs'

test('watch seeds each scope once, queues overflow, and does not invent unread totals',async t=>{
 const{client,peer}=await fixture(t);assert.equal((await client.watch('default','INBOX',1,'web')).firstRun,true)
 peer.messages.push(message('three'),message('four'));let value=await client.watch('default','INBOX',1,'web');assert.equal(value.newCount,1);assert.equal(value.totalUnreadExact,false)
 value=await client.watch('default','INBOX',1,'web');assert.equal(value.newCount,1);assert.equal((await client.watch('default','INBOX',1,'web')).newCount,0)
 assert.equal((await client.watch('default','INBOX',1,'tools')).firstRun,true)
})
test('binary attachment bytes and safe exclusive filenames survive POP3 transport',async t=>{
 const bytes=Buffer.from([0,1,128,255,46,13,10]),raw=Buffer.from('From: sender@example.invalid\r\nSubject: Attachment\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=x\r\n\r\n--x\r\nContent-Type: text/plain\r\n\r\nbody\r\n--x\r\nContent-Type: application/octet-stream\r\nContent-Disposition: attachment; filename="../../data.bin"\r\nContent-Transfer-Encoding: base64\r\n\r\n'+bytes.toString('base64')+'\r\n--x--\r\n')
 const{client}=await fixture(t,{messages:[{uid:'binary',raw}]}),workspace=await mkdtemp(join(tmpdir(),'pop3-attachment-'));t.after(()=>rm(workspace,{recursive:true,force:true}))
 const listed=await client.list('default','INBOX',20,0,false),uid=listed.messages[0].uid,body=await client.read('default',uid,'INBOX');assert.equal(body.attachments.length,1)
 const first=await client.downloadAttachment('default','INBOX',uid,0,workspace),second=await client.downloadAttachment('default','INBOX',uid,0,workspace)
 assert.equal(first.filename,'data.bin');assert.notEqual(first.path,second.path);assert.deepEqual(await readFile(first.path),bytes);assert.deepEqual(await readdir(workspace),['.dsh-email-downloads'])
})
test('8-bit MIME bodies retain the declared charset rather than assuming UTF-8',async t=>{
 const raw=Buffer.concat([Buffer.from('From: sender@example.invalid\r\nSubject: Encoding\r\nContent-Type: text/plain; charset=iso-8859-1\r\nContent-Transfer-Encoding: 8bit\r\n\r\ncaf'),Buffer.from([0xe9]),Buffer.from('\r\n')])
 const{client}=await fixture(t,{messages:[{uid:'latin1',raw}]}),list=await client.list('default','INBOX',1,0,false)
 assert.match((await client.read('default',list.messages[0].uid,'INBOX')).text,/café/)
})
test('HTML-only POP3 bodies use MIME HTML conversion and exclude scripts from search',async t=>{
 const raw=Buffer.from('From: sender@example.invalid\r\nSubject: HTML\r\nContent-Type: text/html; charset=utf-8\r\n\r\n<h1>HTML &amp; café</h1><p>Visible text</p><script>hiddenneedle</script>\r\n')
 const{client}=await fixture(t,{messages:[{uid:'html',raw}]}),list=await client.list('default','INBOX',1,0,false)
 const read=await client.read('default',list.messages[0].uid,'INBOX');assert.match(read.text,/HTML & café/i);assert.match(read.text,/Visible text/);assert.ok(!read.text.includes('hiddenneedle'))
 assert.equal((await client.search('default','hiddenneedle','INBOX',20,0)).messages.length,0)
})
test('oversized HTML conversion is omitted explicitly, keeps attachments, and never searches its notice',async t=>{
 const content=Buffer.from([0,128,255]),html=('<script>unclosed\r\n').repeat(130000)
 const raw=Buffer.from('From: sender@example.invalid\r\nSubject: Large HTML\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=h\r\n\r\n--h\r\nContent-Type: text/html; charset=utf-8\r\n\r\n'+html+'\r\n--h\r\nContent-Type: application/octet-stream\r\nContent-Disposition: attachment; filename=data.bin\r\nContent-Transfer-Encoding: base64\r\n\r\n'+content.toString('base64')+'\r\n--h--\r\n')
 const{client}=await fixture(t,{messages:[{uid:'large-html',raw}],fragment:false,deadline:10000}),list=await client.list('default','INBOX',1,0,false)
 const read=await client.read('default',list.messages[0].uid,'INBOX');assert.equal(read.truncated,true);assert.match(read.text,/HTML 正文超过 2 MiB/);assert.equal(read.attachments.length,1)
 const workspace=await mkdtemp(join(tmpdir(),'pop3-large-html-'));t.after(()=>rm(workspace,{recursive:true,force:true}))
 const attachment=await client.downloadAttachment('default','INBOX',list.messages[0].uid,0,workspace);assert.deepEqual(await readFile(attachment.path),content)
 assert.equal((await client.search('default','未转换为文字','INBOX',20,0)).messages.length,0)
})
test('deeply nested HTML is bounded and its structural omission notice is excluded from search',async t=>{
 const raw=Buffer.from('From: sender@example.invalid\r\nSubject: Nested\r\nContent-Type: text/html; charset=utf-8\r\n\r\n<p>Visible prefix</p>'+'<div>'.repeat(200)+'nestedneedle'+'</div>'.repeat(200)+'\r\n')
 const{client}=await fixture(t,{messages:[{uid:'nested',raw}]}),list=await client.list('default','INBOX',1,0,false)
 const read=await client.read('default',list.messages[0].uid,'INBOX');assert.match(read.text,/Visible prefix/);assert.equal(read.truncated,true);assert.match(read.text,/HTML 结构超过转换上限/)
 assert.equal((await client.search('default','结构超过转换上限','INBOX',20,0)).messages.length,0)
})
test('the POP3 HTML conversion limit counts UTF-8 bytes rather than characters',async t=>{
 const html=('鲸'.repeat(1000)+'\r\n').repeat(800);assert.ok(html.length<2*1024*1024);assert.ok(Buffer.byteLength(html)>2*1024*1024)
 const raw=Buffer.from('From: sender@example.invalid\r\nSubject: UTF-8 HTML\r\nContent-Type: text/html; charset=utf-8\r\n\r\n'+html)
 const{client}=await fixture(t,{messages:[{uid:'utf8-html',raw}],fragment:false}),list=await client.list('default','INBOX',1,0,false)
 const read=await client.read('default',list.messages[0].uid,'INBOX');assert.equal(read.truncated,true);assert.match(read.text,/HTML 正文超过 2 MiB/)
})
test('TLS verifies certificates and succeeds with an explicit trusted CA',async t=>{
 const{client,settings}=await fixture(t,{tls:true});assert.equal((await client.test('default')).messages,2)
 const untrusted=new Pop3Client(settings,{timeoutMs:2000});t.after(()=>untrusted.clear());await assert.rejects(untrusted.test('default'),/POP3/)
})
test('auth rejection never reveals echoed credentials',async t=>{
 const{client}=await fixture(t,{authFailure:true});await assert.rejects(client.test('default'),error=>{assert.ok(!String(error).includes('fixture-secret'));return /POP3/.test(String(error))})
})
test('cancel, disposal and absolute deadline close stalled sessions',async t=>{
 const{client,peer}=await fixture(t,{hang:'UIDL',deadline:2000}),controller=new AbortController(),pending=client.test('default',controller.signal)
 setTimeout(()=>controller.abort(new Error('synthetic cancel')),40);await assert.rejects(pending,/synthetic cancel/)
 const second=await fixture(t,{hang:'UIDL',deadline:150});await assert.rejects(second.client.test('default'),/aborted|timeout/i)
 const third=await fixture(t,{hang:'UIDL'}),operation=third.client.test('default');setTimeout(()=>third.client.clear(),40);await assert.rejects(operation,/关闭/)
 await new Promise(r=>setTimeout(r,20));assert.equal(peer.sockets.size,0)
})
test('oversized advertised messages are rejected before RETR',async t=>{
 const{client,peer}=await fixture(t,{size:40*1024*1024}),list=await client.list('default','INBOX',1,0,false)
 await assert.rejects(client.read('default',list.messages[0].uid,'INBOX'),/32 MiB/);assert.ok(!peer.commands.includes('RETR 2'))
})
