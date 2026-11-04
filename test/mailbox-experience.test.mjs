import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { simpleParser } from 'mailparser'
import { EmailService, EmailMailboxBackend, EmailDraftBackend, DraftStore, resolveEmailSettings, parseRawMessage, buildReplyMessage } from '../lib/index.js'
import { richEmailBody, rasterMime } from '../lib/rich-body.js'
import { moveImapMessages, previewImapTrash } from '../lib/imap-trash.js'
import { downloadPublicBytes } from '../lib/public-download.js'
import { createMailboxPeer, messageSource, imageBytes, originalText } from './helpers/mailbox-peer.mjs'

async function fixture(t, options={}) {
  const peer=await createMailboxPeer(options),root=await mkdtemp(join(import.meta.dirname,'.mailbox-experience-'))
  const settings=resolveEmailSettings({user:'local@example.invalid',password:'synthetic',downloadDir:root,maxBodyChars:20000,imap:{host:'127.0.0.1',port:peer.port,secure:false},smtp:{host:'127.0.0.1',port:peer.smtpPort,secure:false,requireTLS:false}}),pool=new EmailService(settings),value={sendApproval:true,trustedRecipientsYaml:''},store=new DraftStore(root),runtime={getPool:()=>pool,getEffectiveSettings:()=>settings,getSettingsValue:()=>value},drafts=new EmailDraftBackend(runtime,{snapshot:async()=>({accounts:['default'],settings:{value,revision:1},writable:true})},{store}), downloads=[];
  const backend=new EmailMailboxBackend(runtime,drafts,async(url,cap)=>{downloads.push(url);return imageBytes});
  t.after(async()=>{pool.dispose();await peer.close();await rm(root,{recursive:true,force:true})});
  const request=body=>backend.fetch(new Request('http://127.0.0.1/api/dsh-email/mailbox',{method:'POST',headers:{'content-type':'application/json','x-dsh-email-mailbox':'1'},body:JSON.stringify({account:'default',folder:'INBOX',...body})}));
  return{peer,pool,settings,backend,drafts,store,request,downloads}
}
test('rich content is inert: active tags, CSS, event attributes and unsafe links are removed',()=>{
  const rich=richEmailBody('<p onclick="evil()">A &amp; B<script>secret()</script><style>body{background:url(https://track.invalid)}</style><svg><image href="x"/></svg><form><input value="x"></form><a href="javascript:evil()">bad</a><a href="https://example.com/a">good</a><img src="http://127.0.0.1/x" alt="blocked"></p>');
  const text=JSON.stringify(rich);assert.ok(!/onclick|secret|background|javascript|<svg/.test(text));assert.equal(rich.images.length,0);assert.match(text,/A & B/);assert.match(text,/https:\/\/example.com\/a/)
})
test('MIME HTML preserves CID references and binds to the actual inline attachment',async()=>{
  const body=await parseRawMessage(messageSource(),20000);assert.equal(body.attachments[0].contentId,'<chart@fixture>');assert.equal(body.rich.images[0].attachment,0);assert.equal(body.rich.images[0].kind,'inline');assert.equal(body.rich.images[1].kind,'remote');assert.match(body.text,/END-OF-ORIGINAL/)
})
test('rich content bounds HTML, depth, nodes and image count without rendering executable markup',()=>{
  assert.equal(richEmailBody('a'.repeat(256*1024+1)).limited,true);assert.equal(richEmailBody('<div>'.repeat(60)+'deep'+'</div>'.repeat(60)).limited,true);assert.equal(richEmailBody('<br>'.repeat(6000)).limited,true);const rich=richEmailBody('<img src="https://example.com/a">'.repeat(45));assert.equal(rich.images.length,40);assert.equal(rich.limited,true)
})
test('only bounded raster images can be displayed; SVG and disguised HTML are refused',()=>{
  assert.equal(rasterMime(imageBytes),'image/png');assert.equal(rasterMime(Buffer.from('<svg><script>alert(1)</script></svg>')),undefined);assert.equal(rasterMime(Buffer.from('<html>not an image</html>')),undefined);assert.equal(rasterMime(Buffer.alloc(2*1024*1024+1)),undefined)
})
test('public image downloader refuses private and insecure destinations before issuing a request',async()=>{
  for(const url of ['https://127.0.0.1/a','https://[::1]/a','http://example.com/a','https://user:pass@example.com/a','https://example.com:8443/a'])await assert.rejects(downloadPublicBytes(url,100))
})
test('real IMAP renders segmented HTML and inline MIME images without loading external images', {timeout:20000},async t=>{
  const f=await fixture(t),response=await f.request({action:'read',uid:7}),body=await response.json();assert.equal(response.status,200,JSON.stringify(body));const message=body.value;assert.equal(message.rich.images.length,2);assert.ok(message.rich.nodes.length);assert.match(message.text,/END-OF-ORIGINAL/);assert.ok(!JSON.stringify(message.rich).includes('https://images.example.invalid'));assert.ok(!JSON.stringify(message.rich).includes('chart@fixture'));assert.equal(f.downloads.length,0);
  const inline=await f.request({action:'image',uid:7,image:message.rich.images[0].id});assert.equal(inline.status,200,await inline.clone().text());assert.equal(inline.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await inline.arrayBuffer()),imageBytes);
  assert.equal((await f.request({action:'image',uid:7,image:message.rich.images[1].id})).status,400);assert.equal(f.downloads.length,0);
  const remote=await f.request({action:'image',uid:7,image:message.rich.images[1].id,allowRemote:true});assert.equal(remote.status,200);assert.equal(f.downloads.length,1);
  assert.equal((await f.request({action:'image',uid:8,image:message.rich.images[1].id,allowRemote:true})).status,400);assert.equal(f.downloads.length,1);
  assert.ok(f.peer.commands.some(command=>/BODY\.PEEK\[2\]/.test(command)));assert.ok(!f.peer.commands.some(command=>/BODY\.PEEK\[\]/.test(command)),'opening body does not download the full MIME/attachment');
})
test('Trash preview and cancel are read-only; bulk move and one-use Undo preserve mail', {timeout:20000},async t=>{
  const f=await fixture(t),preview=await f.backend.action({action:'trashPreview',account:'default',folder:'INBOX',uids:[7,8],uidValidity:11});assert.equal(preview.target,'Trash');assert.equal(preview.messages.length,2);assert.equal(f.peer.folders.get('INBOX').messages.length,2);assert.ok(!f.peer.commands.some(command=>/MOVE|STORE|EXPUNGE/.test(command)));assert.ok(f.peer.commands.some(command=>/^EXAMINE/.test(command)));
  const moved=await f.backend.action({action:'trashConfirm',account:'default',folder:'INBOX',receipt:preview.id,confirmed:true});assert.equal(moved.count,2);assert.ok(moved.undo);assert.equal(f.peer.folders.get('INBOX').messages.length,0);assert.equal(f.peer.folders.get('Trash').messages.length,2);
  await assert.rejects(f.backend.action({action:'trashConfirm',account:'default',folder:'INBOX',receipt:preview.id,confirmed:true}),/过期/);
  await f.backend.action({action:'undoTrash',account:'default',folder:'Trash',receipt:moved.undo,confirmed:true});assert.equal(f.peer.folders.get('INBOX').messages.length,2);assert.equal(f.peer.folders.get('Trash').messages.length,0);await assert.rejects(f.backend.action({action:'undoTrash',account:'default',folder:'Trash',receipt:moved.undo,confirmed:true}),/过期/);assert.ok(!f.peer.commands.some(command=>/^(?:UID )?EXPUNGE/.test(command)))
})
test('Trash confirmation rejects UIDVALIDITY changes, expired previews and account reconfiguration', {timeout:20000},async t=>{
  const f=await fixture(t),args={action:'trashPreview',account:'default',folder:'INBOX',uids:[7]},confirm=receipt=>f.backend.action({action:'trashConfirm',account:'default',folder:'INBOX',receipt,confirmed:true});
  let p=await f.backend.action(args);f.peer.folders.get('INBOX').validity=99;f.pool.dispose();await assert.rejects(confirm(p.id),/UIDVALIDITY/);assert.equal(f.peer.folders.get('INBOX').messages.length,2);
  p=await f.backend.action(args);f.backend.moves.get(p.id).expires=Date.now()-1;await assert.rejects(confirm(p.id),/过期/);
  p=await f.backend.action(args);f.settings.accounts.get('default').password='changed';await assert.rejects(confirm(p.id),/改变/);assert.equal(f.peer.folders.get('INBOX').messages.length,2)
})
test('Trash enforces valid UID sets, existing destination and safe server capabilities before writes',async()=>{
  const calls=[],client={mailbox:{uidValidity:1},capabilities:new Set(),list:async()=>[{path:'INBOX'},{path:'Trash',specialUse:'\\Trash',flags:new Set()}],fetchOne:async uid=>({uid}),messageMove:async()=>{calls.push('move')}};
  await assert.rejects(previewImapTrash(client,'default','INBOX',[7]),/MOVE\/UIDPLUS/);client.capabilities.add('MOVE');await assert.rejects(previewImapTrash(client,'default','INBOX',[7,7]),/编号/);await assert.rejects(previewImapTrash(client,'default','INBOX',Array.from({length:21},(_,i)=>i+1)),/1–20/);await assert.rejects(moveImapMessages(client,'INBOX',[7],'Missing',1),/不存在/);assert.deepEqual(calls,[])
})
test('server without destination mapping offers no unreliable Undo and uncertain moves demand refresh',async()=>{
  const client={mailbox:{uidValidity:1},capabilities:new Set(['MOVE']),list:async()=>[{path:'Trash',flags:new Set()}],fetchOne:async uid=>({uid}),messageMove:async()=>({})};assert.deepEqual(await moveImapMessages(client,'INBOX',[7],'Trash',1),{count:1});client.messageMove=async()=>{throw Error('connection lost')};await assert.rejects(moveImapMessages(client,'INBOX',[7],'Trash',1),/核对/)
})
test('reply draft quotes long original and actual SMTP message retains its original thread', {timeout:20000},async t=>{
  const f=await fixture(t),draft=await f.backend.action({action:'replyDraft',account:'default',folder:'INBOX',uid:7});assert.match(draft.text,/END-OF-ORIGINAL/);assert.ok(draft.text.length>2000);assert.equal(f.peer.sent.length,0);assert.equal(draft.reply.uidValidity,11);
  const edited=await f.drafts.action({action:'update',...draft,id:draft.id,revision:draft.revision,text:'收到，下一步继续。\n'+draft.text});assert.deepEqual(edited.reply,draft.reply);
  const preview=await f.drafts.action({action:'preview',id:edited.id,revision:edited.revision});await f.drafts.action({action:'send',id:edited.id,preview:preview.id,confirmed:true});assert.equal(f.peer.sent.length,1);const sent=await simpleParser(f.peer.sent[0]);assert.equal(sent.inReplyTo,'<original@fixture.invalid>');assert.deepEqual(sent.references,['<earlier@fixture.invalid>','<original@fixture.invalid>']);assert.match(sent.text,/END-OF-ORIGINAL/)
})
test('reply quote preserves ordinary long bodies but keeps an explicit 20k ceiling',()=>{
  const original={from:[{address:'from@example.invalid'}],to:[],cc:[],subject:'Subject',date:'',text:originalText,messageId:'original',references:''};assert.match(buildReplyMessage(original,'reply','me@example.invalid','').text,/END-OF-ORIGINAL/);assert.match(buildReplyMessage({...original,text:'字'.repeat(21000)},'reply','me@example.invalid','').text,/已截断/)
})
test('inline download enforces its own byte cap and checks UIDVALIDITY under the attachment lock', {timeout:20000},async t=>{
  const f=await fixture(t);await f.pool.read('default',7,'INBOX');
  const before=f.peer.commands.length;await assert.rejects(f.pool.downloadAttachment('default','INBOX',7,0,undefined,undefined,10,11),/超过/);assert.ok(!f.peer.commands.slice(before).some(c=>/BODY\.PEEK\[3\]/.test(c)));
  await assert.rejects(f.pool.downloadAttachment('default','INBOX',7,0,undefined,undefined,2*1024*1024,999),/UIDVALIDITY/)
})
test('missing Trash requires a deliberate folder choice, and a vanished bulk member prevents all moves',async()=>{
  const calls=[],rows=[{path:'INBOX',flags:new Set()},{path:'Archive',flags:new Set()}],client={mailbox:{uidValidity:5},capabilities:new Set(['MOVE']),list:async()=>rows,fetchOne:async uid=>uid===8?false:{uid,envelope:{subject:'Keep'}},messageMove:async()=>{calls.push('move')}};
  await assert.rejects(previewImapTrash(client,'default','INBOX',[7]),/選|选择/);assert.equal((await previewImapTrash(client,'default','INBOX',[7],'Archive')).target,'Archive');await assert.rejects(moveImapMessages(client,'INBOX',[7,8],'Archive',5),/改变/);assert.deepEqual(calls,[])
})
test('account changes while a preview or body is loading never bind old message IDs to the new account', {timeout:20000},async t=>{
  const f=await fixture(t),preview=f.pool.previewTrash.bind(f.pool),read=f.pool.read.bind(f.pool);f.pool.previewTrash=async(...args)=>{const value=await preview(...args);f.settings.accounts.get('default').password='reconfigured';return value};await assert.rejects(f.backend.action({action:'trashPreview',account:'default',folder:'INBOX',uids:[7]}),/账号设置已改变/);assert.equal(f.backend.moves.size,0);
  f.pool.read=async(...args)=>{const value=await read(...args);f.settings.accounts.get('default').password='reconfigured-again';return value};await assert.rejects(f.backend.action({action:'read',account:'default',folder:'INBOX',uid:7}),/账号设置已改变/);assert.equal(f.backend.images.size,0)
})
