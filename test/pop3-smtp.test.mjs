import test from 'node:test'
import assert from 'node:assert/strict'
import { EmailService, resolveEmailSettings, EmailDraftBackend, DraftStore } from '../lib/index.js'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createPop3Peer, message } from './helpers/pop3-peer.mjs'
import { createSmtpPeer } from './helpers/smtp-peer.mjs'

async function fixture(t,extra={}){
 const pop=await createPop3Peer({messages:[message('original','Original thread','Review this')]});t.after(()=>pop.close())
 const smtp=await createSmtpPeer();t.after(()=>smtp.close())
 const settings=resolveEmailSettings({receiveProtocol:'pop3',user:'user@example.invalid',password:'fixture-secret',pop3:{host:'127.0.0.1',port:pop.port,secure:false},smtp:{host:'127.0.0.1',port:smtp.port,secure:false},...extra})
 const service=new EmailService(settings);t.after(()=>service.dispose())
 return{pop,smtp,service,uid:(await service.list(undefined,'INBOX',1,0,false)).messages[0].uid}
}
test('POP3 direct reply and reviewed draft reply send through SMTP with correct thread headers',async t=>{
 const{service,smtp,uid}=await fixture(t)
 const first=await service.reply(undefined,'INBOX',uid,'reply','A controlled reply','',undefined)
 assert.equal(first.subject,'Re: Original thread');assert.equal(first.accepted[0],'sender@example.invalid')
 const second=await service.sendPrepared('default','sender@example.invalid','Re: Original thread','Reviewed draft','',[],undefined,{uid,folder:'INBOX'})
 assert.equal(second.accepted[0],'sender@example.invalid');assert.equal(smtp.messages.length,2)
 for(const raw of smtp.messages){assert.match(raw,/In-Reply-To: <original@example\.invalid>/i);assert.match(raw,/References: <original@example\.invalid>/i)}
})
test('POP3 blocked recipients still stop SMTP and a disappeared original blocks a reply draft',async t=>{
 const{service,smtp,pop,uid}=await fixture(t,{trustedRecipientsYaml:'default:\n  denyAddresses: [sender@example.invalid]\n'})
 await assert.rejects(service.reply(undefined,'INBOX',uid,'reply','blocked','',undefined),/禁止|blocked/i);assert.equal(smtp.messages.length,0)
 pop.messages.length=0;await assert.rejects(service.sendPrepared('default','sender@example.invalid','Reply','text','',[],undefined,{uid,folder:'INBOX'}),/原邮件已不存在/)
})
test('receive-only POP3 configuration keeps mail readable and reports SMTP setup before sending',async t=>{
 const{service,smtp}=await fixture(t,{smtp:{}})
 await assert.rejects(service.sendPrepared('default','someone@example.invalid','Subject','body','',[]),/SMTP.*草稿仍保留/);assert.equal(smtp.messages.length,0)
})
test('missing SMTP is caught at preview, keeping a receive-only account draft editable',async t=>{
 const settings=resolveEmailSettings({receiveProtocol:'pop3',user:'user@example.invalid',password:'fixture-secret',pop3:{host:'pop.example.invalid'}}),root=await mkdtemp(join(tmpdir(),'pop3-draft-'))
 t.after(()=>rm(root,{recursive:true,force:true}));const value={sendApproval:true,trustedRecipientsYaml:''},runtime={getEffectiveSettings:()=>settings,getSettingsValue:()=>value,getPool:()=>{throw Error('No network expected')}}
 const backend=new EmailDraftBackend(runtime,{snapshot:async()=>({accounts:['default'],settings:{value,revision:0},writable:true})},{store:new DraftStore(root)})
 const draft=await backend.create({account:'default',to:'receiver@example.invalid',subject:'Draft',text:'Editable'})
 await assert.rejects(backend.action({action:'preview',id:draft.id,revision:draft.revision}),error=>error.code==='smtp-missing')
 assert.equal((await backend.store.get(draft.id)).state,'draft')
})
