import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {MailTaskBackend} from '../lib/mail-tasks.js'
import {MailTaskStore} from '../lib/mail-task-store.js'
import {matchTaskRules} from '../lib/mail-task-rules.js'
import {resolveEmailSettings} from '../lib/config.js'

async function setup(t){
 const root=await mkdtemp(join(tmpdir(),'mail-tasks-'));t.after(()=>rm(root,{recursive:true,force:true}))
 let mails=[],events=[],busy=false,sendMode='ok',policy='',now=Date.now();const prompts=[],sends=[]
 const cfg={provider:'exmail',user:'owner@example.test',password:'synthetic-mail-fixture'},effective=()=>resolveEmailSettings({...cfg,trustedRecipientsYaml:policy})
 const pool={list:async()=>({messages:mails.map(m=>({...m,date:new Date(now).toISOString()})),uidValidity:42}),read:async(_a,uid)=>({...mails.find(m=>m.uid===uid),account:'default',folder:'INBOX',uidValidity:42,truncated:false,attachments:[]}),prepareReply:async(_a,_f,uid)=>({reply:{uid,folder:'INBOX',uidValidity:42}}),sendPrepared:async(...args)=>{sends.push(args);if(sendMode==='uncertain')throw new Error('synthetic connection loss');return{messageId:'receipt',accepted:[args[1]],rejected:[]}}}
 const native={available:()=>true,create:async()=> 'session-new',observe:async(sid,after)=>({cwd:sid==='wrong-session'?root+'/elsewhere':root,cursor:after===-2?0:events.length,events:after===-2?[]:events}),state:async()=>({running:busy,pendingInput:[],queue:[]}),prompt:async(sid,id,text)=>{prompts.push({sid,id,text});events=[{type:'user/message',seq:1,data:{source:{rpcId:id}}}]}}
 const runtime={getEffectiveSettings:effective,getSettingsValue:()=>({trustedRecipientsYaml:policy}),getPool:()=>pool}
 const store=new MailTaskStore(root),backend=new MailTaskBackend(runtime,{store,native,now:()=>now})
 t.after(()=>backend.stop())
 const key=(await backend.action({action:'rotateKey',revision:0})).key
 const config={enabled:true,account:'default',folder:'INBOX',senders:[],workspaces:{work:root},rules:[],autoReply:false,pollSeconds:60}
 await backend.action({action:'save',revision:1,config});await backend.tick()
 return{root,backend,store,native,runtime,key,config,prompts,sends,mails:value=>mails=value,busy:value=>busy=value,policy:value=>policy=value,mode:value=>sendMode=value,events:value=>events=value,now:value=>now=value,mail:(uid,extra={})=>({uid,from:[{address:'owner@example.test'}],to:[{address:'owner@example.test'}],cc:[],subject:'dsh:work',text:'DSH-Key: '+key+'\nSummarize this workspace.\n\n> DSH-Key: '+key,...extra}),complete:()=>{events.push({type:'assistant/message',seq:2,data:{message:{content:[{type:'text',text:'<b>Done</b> & reviewed'}]}}},{type:'turn/end',seq:3,data:{reason:{kind:'completed'}}})}}
}

test('mail commands require sender plus key, seed old mail, dispatch once and keep keys out of prompts and ledger',async t=>{
 const f=await setup(t)
 f.mails([f.mail(1,{from:[{address:'attacker@example.test'}]}),f.mail(2,{text:'DSH-Key: invalid\nrun'}),f.mail(3)])
 await f.backend.tick();assert.equal(f.prompts.length,1);assert.doesNotMatch(f.prompts[0].text,new RegExp(f.key));assert.doesNotMatch(f.prompts[0].text,/DSH-Key:/)
 await f.backend.tick();assert.equal(f.prompts.length,1)
 assert.doesNotMatch(await readFile(f.store.file,'utf8'),new RegExp(f.key))
 f.complete();f.events([{type:'user/message',seq:1,data:{source:{kind:'user',rpcId:f.prompts[0].id}}},{type:'user/message',seq:2,data:{source:{kind:'runtime-context'}}},{type:'user/message',seq:3,data:{source:{kind:'skill-catalog'}}},{type:'user/message',seq:4,data:{source:{kind:'time-context'}}},{type:'assistant/message',seq:5,data:{message:{content:[{type:'text',text:'Completed with official context'}]}}},{type:'turn/end',seq:6,data:{reason:{kind:'completed'}}}]);await f.backend.tick();assert.equal((await f.store.read()).records[0].state,'completed');assert.equal(f.sends.length,0)
 // Numeric UIDs that re-enter the latest page are historical, not new tasks.
 f.mails([f.mail(2)]);await f.backend.tick();assert.equal(f.prompts.length,1)
})

test('existing sessions must be idle and in the approved workspace; denied commands are never replayed',async t=>{
 const f=await setup(t);f.mails([f.mail(1,{subject:'dsh:work:wrong-session'})]);await f.backend.tick();assert.equal(f.prompts.length,0);assert.equal((await f.store.read()).records[0].state,'attention')
 f.busy(true);f.mails([f.mail(2),f.mail(1)]);await f.backend.tick();assert.equal(f.prompts.length,0)
 f.busy(false);await f.backend.tick();assert.equal(f.prompts.length,0)
})

test('explicit result delivery preserves thread, sends only to the authorized sender, and never retries uncertain SMTP',async t=>{
 const f=await setup(t)
 await f.backend.action({action:'save',revision:2,config:{...f.config,autoReply:true}});await f.backend.tick()
 f.mails([f.mail(1)]);await f.backend.tick();f.complete();f.mode('uncertain');await f.backend.tick()
 assert.equal(f.sends.length,1);assert.equal(f.sends[0][1],'owner@example.test');assert.equal(f.sends[0][4],'');assert.match(f.sends[0][2],/dsh:work:session-new/)
 assert.match(f.sends[0][8],/<b>Done<\/b> &amp; reviewed/);assert.doesNotMatch(f.sends[0][3],/<b>/);assert.doesNotMatch(JSON.stringify(f.sends),new RegExp(f.key));assert.equal(f.sends[0][7].uid,1)
 assert.equal((await f.store.read()).records[0].state,'uncertain');await f.backend.tick();assert.equal(f.sends.length,1)
})

test('manual takeover and policy edits prevent automatic email responses',async t=>{
 for(const reason of ['manual','policy']){
  const f=await setup(t);await f.backend.action({action:'save',revision:2,config:{...f.config,autoReply:true}});await f.backend.tick();f.mails([f.mail(1)]);await f.backend.tick();f.complete()
  if(reason==='manual')f.events([{type:'user/message',seq:1,data:{source:{rpcId:f.prompts[0].id}}},{type:'user/message',seq:2,data:{source:{rpcId:'human-request'}}},{type:'turn/end',seq:4,data:{reason:{kind:'completed'}}}])
  else f.policy('default:\n  denyAddresses: [owner@example.test]\n')
  await f.backend.tick();assert.equal(f.sends.length,0);assert.equal((await f.store.read()).records[0].state,'attention')
 }
})

test('restart and key rotation are fail-closed and never repeat dispatched tasks',async t=>{
 const f=await setup(t);f.mails([f.mail(1)]);await f.backend.tick();assert.equal(f.prompts.length,1)
 const restarted=new MailTaskBackend(f.runtime,{store:f.store,native:f.native});await restarted.start();await restarted.stop();assert.equal((await f.store.read()).records[0].state,'attention');await restarted.tick();assert.equal(f.prompts.length,1)
 const rotated=await restarted.action({action:'rotateKey',revision:2});assert.notEqual(rotated.key,f.key);assert.equal(rotated.config.enabled,false);assert.equal(rotated.config.keyHash,undefined)
})

test('advanced rules support all/any, named captures and templates with a worker deadline',async()=>{
 const rule={mode:'all',conditions:[{field:'subject',op:'regex',value:'^Task (?<project>work)$'},{field:'from',op:'equals',value:'owner@example.test'}],workspace:'${project}',prompt:'Please: ${body}'}
 assert.deepEqual(await matchTaskRules([rule],{subject:'Task work',from:'owner@example.test',body:'Review changes'}),{workspace:'work',prompt:'Please: Review changes'})
 assert.equal(await matchTaskRules([rule],{subject:'Task work',from:'bad@example.test',body:'Review changes'}),undefined)
 const start=Date.now();await assert.rejects(matchTaskRules([{...rule,conditions:[{field:'body',op:'regex',value:'(a+)+$'}]}],{body:'a'.repeat(15000)+'!'}),/timed out/);assert.ok(Date.now()-start<2000)
})

test('custom subject prefixes work without permitting arbitrary workspace paths',async t=>{
 const f=await setup(t);await f.backend.action({action:'save',revision:2,config:{...f.config,prefix:'workmail'}});await f.backend.tick()
 f.mails([f.mail(1,{subject:'workmail:work'}),f.mail(2,{subject:'workmail:../../elsewhere'}),f.mail(3)])
 await f.backend.tick();assert.equal(f.prompts.length,1);assert.match(f.prompts[0].text,/Summarize this workspace/)
})

test('mail-task writes reject cross-origin requests and preserve corrupt storage',async t=>{
 const f=await setup(t)
 const request=new Request('http://localhost/api/dsh-email/tasks',{method:'POST',headers:{origin:'https://evil.example','content-type':'application/json','x-dsh-email-tasks':'1'},body:'{"action":"rotateKey","revision":2}'})
 assert.equal((await f.backend.fetch(request)).status,403)
 await writeFile(f.store.file,'{broken');await assert.rejects(f.backend.action({action:'rotateKey',revision:2}),/existing file kept/);assert.equal(await readFile(f.store.file,'utf8'),'{broken')
})
