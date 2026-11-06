import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm,writeFile,readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {EmailDraftBackend,DraftStore,resolveEmailSettings} from '../lib/index.js'
import {scheduledTime} from '../lib/scheduled-time.js'
import {installScheduleApproval,scheduleTool} from '../lib/schedule-tool.js'
async function fixture(t){
 const home=await mkdtemp(join(tmpdir(),'email-schedule-'));t.after(()=>rm(home,{recursive:true,force:true}))
 let now=Date.now();const sends=[],config={user:'sender@example.test',password:'synthetic-schedule-fixture',imap:{host:'127.0.0.1'},smtp:{host:'127.0.0.1'}},value={trustedRecipientsYaml:''}
 const runtime={getEffectiveSettings:()=>resolveEmailSettings(config),getSettingsValue:()=>value,getPool:()=>({sendPrepared:async(...args)=>{sends.push(args);return{messageId:'fixture',accepted:['target@example.test'],rejected:[]}}})}
 const settings={snapshot:async()=>({accounts:['default'],settings:{value,revision:0},writable:true})},options={store:new DraftStore(home),now:()=>now}
 const backend=new EmailDraftBackend(runtime,settings,options);t.after(()=>backend.stopScheduler())
 async function queue(input={}){const d=await backend.create({account:'default',to:'target@example.test',subject:'Scheduled fixture',text:'Reviewed text',...input}),p=await backend.action({action:'preview',id:d.id,revision:d.revision});return (await backend.action({action:'schedule',id:d.id,preview:p.id,sendAt:new Date(now+60000).toISOString(),confirmed:true})).draft}
 return{home,backend,options,runtime,settings,config,value,sends,queue,tick:ms=>{now+=ms},now:()=>now}
}
test('scheduled delivery uses fixed attachment bytes and competing processes submit at most once',async t=>{
 const f=await fixture(t),file=join(f.home,'reviewed.txt');await writeFile(file,'original bytes')
 const d=await f.queue({attachments:[file]});assert.equal(d.state,'scheduled');assert.equal(f.sends.length,0)
 await writeFile(file,'changed original');f.tick(60000)
 const other=new EmailDraftBackend(f.runtime,f.settings,f.options)
 await Promise.all([f.backend.runScheduled(),other.runScheduled()]);await f.backend.runScheduled()
 assert.equal(f.sends.length,1);assert.equal(f.sends[0][5][0].content.toString(),'original bytes');assert.equal((await f.backend.store.get(d.id)).state,'sent')
})
test('cancel, account edits and attachment tampering stop a schedule before submission',async t=>{
 const f=await fixture(t),cancel=await f.queue();await f.backend.action({action:'cancelSchedule',id:cancel.id,revision:cancel.revision});f.tick(60000);await f.backend.runScheduled();assert.equal(f.sends.length,0)
 const changed=await f.queue();f.config.user='other@example.test';f.tick(60000);await f.backend.runScheduled();assert.equal(f.sends.length,0);assert.equal((await f.backend.store.get(changed.id)).state,'draft')
 const file=join(f.home,'a.txt');await writeFile(file,'fixed');const tampered=await f.queue({attachments:[file]}),stored=await f.backend.store.get(tampered.id);await writeFile(stored.attachments[0].path,'tampered');f.tick(60000);await f.backend.runScheduled();assert.equal(f.sends.length,0);assert.match((await f.backend.store.get(tampered.id)).error,/附件/)
})
test('a missed time while closed returns to draft and never sends on startup',async t=>{
 const f=await fixture(t),d=await f.queue();f.tick(60001);await f.backend.startScheduler()
 assert.equal(f.sends.length,0);const current=await f.backend.store.get(d.id);assert.equal(current.state,'draft');assert.match(current.error,/错过/)
})
test('an uncertain scheduled submission is persisted and never automatically retried',async t=>{
 const f=await fixture(t);f.runtime.getPool=()=>({sendPrepared:async()=>{f.sends.push('attempt');throw Error('connection closed without receipt')}})
 const d=await f.queue();f.tick(60000);await f.backend.runScheduled();await f.backend.runScheduled();assert.equal(f.sends.length,1);assert.equal((await f.backend.store.get(d.id)).state,'uncertain')
})
test('schedule tool requires a one-use approval tied to the exact draft preview',async t=>{
 const f=await fixture(t),draft=await f.backend.create({to:'target@example.test',subject:'Tool fixture',text:'Body'})
 let gate,decision='rejected';installScheduleApproval({on(_name,fn){gate=fn},get(){return{request:async()=>decision}}},f.backend)
 const tool=scheduleTool(f.backend),args=Object.freeze({action:'schedule',id:draft.id,sendAt:new Date(Date.now()+120000).toISOString()}),exec={name:'email_schedule',arguments:args}
 assert.equal((await gate(exec,async()=>({kind:'allow'}))).kind,'deny');await assert.rejects(tool.execute(args,exec),/确认/)
 decision='allowed-once';assert.equal((await gate(exec,async()=>({kind:'allow'}))).kind,'allow');assert.equal((await tool.execute(args,exec)).draft.state,'scheduled')
 await assert.rejects(tool.execute(args,exec),/确认/);assert.equal(f.sends.length,0)
})
test('ambiguous, invalid and immediate schedule times are rejected',()=>{
 for(const value of ['2026-11-06T09:00','2026-02-31T09:00:00Z','tomorrow','2026-11-06T09:00:00+99:99'])assert.throws(()=>scheduledTime(value))
 assert.throws(()=>scheduledTime(new Date(Date.now()+1000).toISOString(),Date.now()),/30/)
})
test('a proposed future time cannot accidentally be submitted as immediate mail',async t=>{
 const f=await fixture(t),d=await f.backend.create({to:'target@example.test',subject:'Future',text:'Body',sendAt:new Date(f.now()+60000).toISOString()}),p=await f.backend.action({action:'preview',id:d.id,revision:d.revision})
 await assert.rejects(f.backend.action({action:'send',id:d.id,preview:p.id,confirmed:true}),/定时时间/);assert.equal(f.sends.length,0)
})
