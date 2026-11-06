import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {simpleParser} from 'mailparser'
import {buildReplyMessage,prepareMailBody,resolveEmailSettings,EmailService,EmailDraftBackend,DraftStore} from '../lib/index.js'
import {buildEmailTools} from '../lib/tools.js'
import {createSmtpPeer} from './helpers/smtp-peer.mjs'
const original={from:[{name:'Alice Martin',address:'alice@example.test'}],to:[{address:'me@example.test'}],cc:[],subject:'Candidature',date:'Fri, 06 Nov 2026 10:42:05 +0000',text:'Bonjour\nOriginal',messageId:'original@example.test',references:'root@example.test'}

test('reply, reply-all and forward localize every generated line and format ISO/RFC dates',()=>{
 for(const mode of ['reply','reply-all','forward'])for(const locale of ['en','fr-FR','zh-CN']){
  const built=buildReplyMessage({...original,text:'x'.repeat(25000)},mode,'me@example.test','Answer','target@example.test',{locale,timeZone:'Europe/Paris'})
  assert.doesNotMatch(built.text,/2026-11-06T|10:42:05\.000Z/)
  assert.match(built.text,/11:42/)
  if(locale==='fr-FR'){assert.match(built.text,/tronqué/);assert.doesNotMatch(built.text,/写道|发件人|原文过长|未知/)}
  if(locale==='en'){assert.match(built.text,/truncated/);assert.doesNotMatch(built.text,/写道|发件人|原文过长|未知/)}
  if(mode!=='forward')assert.equal(built.inReplyTo,'original@example.test')
 }
 const unknown=buildReplyMessage({...original,date:'not a date',subject:'',from:[]},'forward','','','target@example.test')
 assert.match(unknown.text,/Unknown sender/);assert.match(unknown.text,/Unknown date/);assert.match(unknown.text,/No subject/)
})

test('HTML retains safe table/inline formatting, strips active content, links and all resource fetches',()=>{
 const body=prepareMailBody(undefined,'<h2 style="color:#123456">Weekly</h2><script>alert(1)</script><table><tr><td onclick="evil()" style="padding:8px;background-image:url(https://example.test/x)">80%</td></tr></table><img src="https://example.test/track" alt="Chart"><a href="javascript:evil()">bad</a><a href="https://example.test/ok">safe</a>')
 assert.match(body.html,/<tbody>/);assert.match(body.html,/color:#123456/);assert.match(body.html,/padding:8px/);assert.match(body.text,/Weekly/);assert.match(body.text,/80%/)
 assert.doesNotMatch(body.html,/script|onclick|javascript|background-image|<img|src=/)
 assert.match(body.html,/https:\/\/example.test\/ok/)
 const quoted=buildReplyMessage({...original,text:'<script>original is plain</script>'},'reply','me@example.test','','',{html:'<p><strong>Merci</strong></p>',locale:'fr'})
 assert.match(quoted.html,/<strong>Merci<\/strong>/);assert.match(quoted.html,/&lt;script&gt;/);assert.doesNotMatch(quoted.html,/<script>/);assert.match(quoted.text,/Merci/)
})

async function fixture(t){
 const smtp=await createSmtpPeer();t.after(()=>smtp.close())
 const settings=resolveEmailSettings({user:'me@example.test',password:'synthetic-smtp-fixture',proxy:'direct',imap:{host:'127.0.0.1',port:993,secure:true},smtp:{host:'127.0.0.1',port:smtp.port,secure:false}}),service=new EmailService(settings);t.after(()=>service.dispose())
 const home=await mkdtemp(join(tmpdir(),'email-html-'));t.after(()=>rm(home,{recursive:true,force:true}))
 const runtime={getEffectiveSettings:()=>settings,getSettingsValue:()=>({sendApproval:true,trustedRecipientsYaml:''}),getPool:()=>service}
 const backend=new EmailDraftBackend(runtime,{snapshot:async()=>({accounts:['default'],settings:{value:{},revision:0},writable:true})},{store:new DraftStore(home)})
 return{smtp,settings,service,runtime,backend}
}
test('model send and human-reviewed draft emit actual multipart alternatives with identical reviewed HTML',async t=>{
 const f=await fixture(t),html='<h2 style="color:#123456">Report</h2><table><tr><td>80%</td></tr></table>'
 const tool=buildEmailTools({...f.runtime,watch:async()=>{}}).find(x=>x.name==='email_send')
 await tool.execute({to:'target@example.test',subject:'Model HTML',html},{})
 const first=await simpleParser(f.smtp.messages[0]);assert.match(first.html,/<h2/);assert.match(first.text,/Report/);assert.match(f.smtp.messages[0],/multipart\/alternative/)
 const d=await f.backend.create({to:'target@example.test',subject:'Draft HTML',html})
 const preview=await f.backend.action({action:'preview',id:d.id,revision:d.revision})
 assert.ok(preview.body.rich.nodes.length);assert.equal(f.smtp.messages.length,1)
 const sent=await f.backend.action({action:'send',id:d.id,preview:preview.id,confirmed:true});assert.equal(sent.draft.state,'sent')
 const second=await simpleParser(f.smtp.messages[1]);assert.equal(second.html,preview.body.html);assert.equal(second.text.trim(),preview.body.text.trim())
 await assert.rejects(f.backend.action({action:'send',id:d.id,preview:preview.id,confirmed:true}),/预览|已提交/);assert.equal(f.smtp.messages.length,2)
})
test('corporate mail preset and custom endpoint overrides resolve separately from personal QQ',()=>{
 const s=resolveEmailSettings({provider:'exmail',user:'user@company.example',password:'synthetic-enterprise'})
 const c=s.accounts.get('default');assert.equal(c.imap.host,'imap.exmail.qq.com');assert.equal(c.smtp.host,'smtp.exmail.qq.com')
 const custom=resolveEmailSettings({provider:'exmail',user:'user@company.example',password:'synthetic-enterprise',imap:{host:'imap.company.example'},smtp:{host:'smtp.company.example'}}).accounts.get('default')
 assert.equal(custom.imap.host,'imap.company.example');assert.equal(custom.smtp.host,'smtp.company.example')
})
