import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Pop3Client, EmailService, resolveEmailSettings } from '../lib/index.js'
import { createPop3Peer, message } from './helpers/pop3-peer.mjs'
import { fixture } from './helpers/pop3-fixture.mjs'

test('POP3 defaults are opt-in; existing QQ accounts keep IMAP',()=>{
 assert.equal(resolveEmailSettings({provider:'qq',user:'u@qq.com',password:'x'}).accounts.get('default').transport,undefined)
 const value=resolveEmailSettings({provider:'qq',receiveProtocol:'pop3',user:'u@qq.com',password:'x'}).accounts.get('default')
 assert.deepEqual(value.pop3,{host:'pop.qq.com',port:995,secure:true,connectionTimeoutMs:undefined,socketTimeoutMs:undefined});assert.equal(value.smtp.host,'smtp.qq.com')
})
test('POP3 can receive without SMTP and rejects invalid protocol, OAuth2, port, folder and credential injection',()=>{
 const cfg={receiveProtocol:'pop3',user:'u@test.invalid',password:'x',pop3:{host:'pop.test.invalid'}}
 assert.equal(resolveEmailSettings(cfg).accounts.get('default').smtp.host,'')
 for(const patch of [{receiveProtocol:'other'},{authKind:'oauth2'},{pop3:{host:'pop.test.invalid',port:0}},{inboxFolder:'Sent'},{password:'x\r\nDELE 1'}])assert.throws(()=>resolveEmailSettings({...cfg,...patch}))
})
test('real fragmented POP3 list/read preserves dot-stuffing and opaque UIDL',async t=>{
 const{client,peer}=await fixture(t),list=await client.list('default','INBOX',20,0,false)
 assert.equal(list.count,2);assert.equal(list.countExact,true);assert.equal(list.messages[0].flagsSupported,false);assert.match(list.messages[0].uid,/^pop3:/)
 const read=await client.read('default',list.messages[0].uid,'INBOX');assert.equal(read.subject,'Newest POP3');assert.match(read.text,/\r?\n\.line beginning\r?\n\.\.two dots/)
 assert.ok(peer.commands.includes('TOP 2 0'));assert.ok(!peer.commands.some(c=>c.startsWith('DELE')))
})
test('UIDL resolves again after sequence numbers change and missing messages never select neighbours',async t=>{
 const{client,peer}=await fixture(t),list=await client.list('default','INBOX',20,0,false),uid=list.messages[0].uid
 peer.messages.shift();assert.equal((await client.read('default',uid,'INBOX')).subject,'Newest POP3');assert.ok(peer.commands.includes('RETR 1'))
 peer.messages.length=0;await assert.rejects(client.read('default',uid,'INBOX'),/原邮件已不存在/)
})
test('duplicate and missing UIDL fail rather than issuing unstable numeric message references',async t=>{
 const{client}=await fixture(t,{messages:[message('same'),message('same')]});await assert.rejects(client.list('default','INBOX',20,0,false),/标识重复/)
 const second=await fixture(t,{noUidl:true});await assert.rejects(second.client.test('default'),/UIDL/)
})
test('TOP is optional; fallback RETR is bounded and leaves messages on server',async t=>{
 const{client,peer}=await fixture(t,{noTop:true});assert.equal((await client.list('default','INBOX',1,0,false)).messages.length,1);assert.ok(peer.commands.includes('RETR 2'));assert.equal(peer.messages.length,2)
})
test('empty mailbox remains empty and UIDL numeric text stays opaque',async t=>{
 const empty=await fixture(t,{messages:[]});assert.equal((await empty.client.list('default','INBOX',20,0,false)).count,0)
 const{client}=await fixture(t,{messages:[message('001')]});const list=await client.list('default','INBOX',20,0,false);assert.equal((await client.read('default',list.messages[0].uid,'INBOX')).subject,'Synthetic POP3');await assert.rejects(client.read('default',1,'INBOX'),/完整 uid/)
})
test('unsupported flags/folders fail explicitly before a connection',async t=>{
 const{client,peer,settings}=await fixture(t),service=new EmailService(settings);t.after(()=>service.dispose())
 assert.throws(()=>client.list('default','INBOX',20,0,true),/不提供服务器/);assert.throws(()=>client.read('default','pop3:eA','Sent'),/只提供 INBOX/)
 assert.throws(()=>service.mark('default','INBOX','pop3:eA','read'),/不提供服务器/);assert.equal(peer.commands.length,0)
 assert.deepEqual((await service.folders('default',false)).folders.map(f=>f.path),['INBOX'])
})
test('search exposes header windows and next offset, and bounded body fallback',async t=>{
 const{client}=await fixture(t,{messages:[message('one','Needle older'),message('two','Recent','bodyonly match')]})
 let result=await client.search('default','Needle','INBOX',20,0,undefined,undefined,undefined,{headerScanLimit:1})
 assert.equal(result.count,0);assert.equal(result.countExact,false);assert.equal(result.headerScan.nextScanOffset,1);assert.equal(result.headerScan.complete,false)
 result=await client.search('default','Needle','INBOX',20,0,undefined,undefined,undefined,{headerScanLimit:1,headerScanOffset:1});assert.equal(result.messages.length,1);assert.equal(result.headerScan.complete,true)
 result=await client.search('default','bodyonly','INBOX',20,0);assert.equal(result.searchSource,'local-body');assert.equal(result.bodyScan.scanned,2);assert.equal(result.count,1)
})
test('list pagination and local Date-header filtering report their real count',async t=>{
 const{client}=await fixture(t),first=await client.list('default','INBOX',1,0,false),second=await client.list('default','INBOX',1,1,false)
 assert.equal(first.hasMore,true);assert.equal(second.hasMore,false);assert.notEqual(first.messages[0].uid,second.messages[0].uid)
 assert.equal((await client.list('default','INBOX',20,0,false,new Date('2026-10-29'))).messages.length,0)
})
test('body search never matches its own generated truncation notice',async t=>{
 const{client}=await fixture(t,{messages:[message('long','Long body','x'.repeat(21000))]})
 const result=await client.search('default','正文过长','INBOX',20,0)
 assert.equal(result.messages.length,0);assert.equal(result.bodyScan.scanned,1)
})
