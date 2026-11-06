import test from 'node:test'
import assert from 'node:assert/strict'
import {installSendApproval} from '../lib/approval.js'
import {buildEmailTools} from '../lib/tools.js'
const policy={addresses:['alice@example.test'],skipApproval:true,denyAddresses:['blocked@example.test']}
function fixture(extra={}){
 let gate,asks=0,submissions=[],actual={to:'alice@example.test',cc:'',subject:'Re: review',text:'Pinned body',account:'work',reply:{uid:1,folder:'INBOX',uidValidity:7,mode:'reply'}},value={sendApproval:true,allowTrustedReply:true,trustedRecipientsYaml:JSON.stringify({work:policy}),...extra}
 const config={user:'self@example.test'},settings={accounts:new Map([['work',config]]),defaultAccount:'work'}
 const pool={prepareReply:async()=>structuredClone(actual),sendPrepared:async(...args)=>{submissions.push(args);return{messageId:'mock',accepted:[args[1]],rejected:[]}},reply:async()=>{submissions.push('unprepared');return{messageId:'normal'}}}
 const runtime={getSettingsValue:()=>value,getEffectiveSettings:()=>settings,getPool:()=>pool,watch:async()=>{}}
 installSendApproval({on(_event,fn){gate=fn},get(){return{request:async()=>{asks++;return'allowed-once'}}}},runtime)
 const tool=buildEmailTools(runtime).find(t=>t.name==='email_reply')
 const args=Object.freeze({account:'work',uid:1,text:'Answer'}),exec={name:'email_reply',arguments:args}
 return {args,exec,tool,run:(next=async()=>({kind:'allow'}))=>gate(exec,next),counts:()=>({asks,submissions}),actual,value,config,pool}
}
test('trusted reply is opt-in, checks every actual Cc and retains host permission decisions',async()=>{
 const off=fixture({allowTrustedReply:false});await off.run();assert.equal(off.counts().asks,1)
 const trusted=fixture();await trusted.run();assert.equal(trusted.counts().asks,0)
 const cc=fixture();cc.actual.cc='stranger@example.test';await cc.run();assert.equal(cc.counts().asks,1)
 const blocked=fixture();blocked.actual.cc='blocked@example.test';assert.equal((await blocked.run()).kind,'deny');assert.equal(blocked.counts().submissions.length,0)
 const host=fixture();assert.deepEqual(await host.run(async()=>({kind:'deny',reason:'host permission'})),{kind:'deny',reason:'host permission'});assert.equal(host.counts().submissions.length,0)
})
test('trusted and manually approved replies submit the pinned envelope even if the original later changes',async()=>{
 for(const extra of [{},{allowTrustedReply:false}]){
  const f=fixture(extra);await f.run();f.actual.to='attacker@else.test';f.actual.text='Changed source'
  await f.tool.execute(f.args,f.exec)
  const sent=f.counts().submissions[0];assert.equal(sent[1],'alice@example.test');assert.equal(sent[3],'Pinned body');assert.equal(sent[7].uidValidity,7)
 }
})
test('account or policy changes invalidate a reply authorization before SMTP',async()=>{
 const f=fixture();await f.run();f.config.user='other@example.test'
 await assert.rejects(f.tool.execute(f.args,f.exec),/改变|过期/);assert.equal(f.counts().submissions.length,0)
 const p=fixture();await p.run();p.value.trustedRecipientsYaml='work: { denyDomains: [example.test] }'
 await assert.rejects(p.tool.execute(p.args,p.exec),/改变|过期/);assert.equal(p.counts().submissions.length,0)
})
