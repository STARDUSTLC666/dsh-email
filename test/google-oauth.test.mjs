import test from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {GoogleOAuth,GOOGLE_TOKEN_URL,GOOGLE_MAIL_SCOPE} from '../lib/google-oauth.js'
import {resolveEmailSettings} from '../lib/config.js'

const cfg={user:'owner@gmail.com',clientId:'123-desktop.apps.googleusercontent.com',clientSecret:'synthetic-client-fixture',oauthProvider:'google'}
const json=(doc,status=200)=>new Response(JSON.stringify(doc),{status})
function setup(t,handler){
 let store={version:1,accounts:{}};const calls=[]
 const auth=new GoogleOAuth({read:()=>structuredClone(store),write:x=>{store=structuredClone(x)}},{fetch:async(url,init)=>{const call={url,init,params:new URLSearchParams(init?.body)};calls.push(call);if(handler)return handler(call);return url===GOOGLE_TOKEN_URL?json({access_token:'synthetic-access',refresh_token:'synthetic-refresh',scope:GOOGLE_MAIL_SCOPE,expires_in:3600}):json({email:cfg.user,email_verified:true})}})
 t.after(()=>auth.dispose())
 return{auth,calls,store:()=>store,set:x=>{store=x}}
}
const callback=(start,changes={})=>{const auth=new URL(start.url),url=new URL(auth.searchParams.get('redirect_uri'));url.searchParams.set('state',auth.searchParams.get('state'));url.searchParams.set('code','synthetic-authorization-code');for(const[k,v]of Object.entries(changes))url.searchParams.set(k,v);return url}

test('Google desktop login uses PKCE, verifies callback authority and binds verified mailbox',async t=>{
 const s=setup(t),start=await s.auth.start('gmail',cfg),authorization=new URL(start.url)
 assert.equal(authorization.hostname,'accounts.google.com');assert.equal(authorization.searchParams.get('code_challenge_method'),'S256')
 assert.equal(new URL(authorization.searchParams.get('redirect_uri')).hostname,'127.0.0.1')
 assert.equal((await fetch(callback(start,{state:'wrong'}))).status,403)
 assert.equal((await fetch(callback(start))).status,200)
 assert.equal(s.calls.length,2);assert.equal(s.calls[0].init.redirect,'error')
 assert.equal(createHash('sha256').update(s.calls[0].params.get('code_verifier')).digest('base64url'),authorization.searchParams.get('code_challenge'))
 assert.equal(s.auth.poll('gmail',cfg).status,'ok');assert.equal(s.store().accounts.gmail.provider,'google')
 assert.equal(await s.auth.accessToken('gmail',cfg),'synthetic-access');assert.equal(s.calls.length,2)
 assert.equal(s.auth.state('gmail',{...cfg,clientId:'456-other.apps.googleusercontent.com'}).state,'none')
})

test('mailbox mismatch, missing Gmail permission, configuration changes and logout cannot store a login',async t=>{
 for(const reason of ['identity','scope','config','cancel']){
  let current=cfg
  const s=setup(t,call=>call.url===GOOGLE_TOKEN_URL?json({access_token:'hidden-access',refresh_token:'hidden-refresh',scope:reason==='scope'?'openid email':GOOGLE_MAIL_SCOPE,expires_in:3600}):json({email:reason==='identity'?'other@gmail.com':cfg.user,email_verified:true}))
  const start=await s.auth.start('gmail',cfg,()=>current)
  if(reason==='config')current={...cfg,user:'changed@gmail.com'}
  if(reason==='cancel'){s.auth.cancel('gmail');await assert.rejects(fetch(callback(start)));continue}
  const response=await fetch(callback(start));assert.equal(response.status,400);assert.doesNotMatch(await response.text(),/hidden-access|hidden-refresh|synthetic-authorization-code/)
  assert.deepEqual(s.store().accounts,{})
 }
})

test('refresh is single-flight, issuer-bound, preserves transient failures and clears only revoked credentials',async t=>{
 let mode='ok',count=0
 const s=setup(t,async call=>{assert.equal(call.url,GOOGLE_TOKEN_URL);count++;await new Promise(r=>setTimeout(r,20));return mode==='ok'?json({access_token:'new-access',expires_in:3600}):mode==='revoked'?json({error:'invalid_grant',error_description:'secret-must-not-leak'},400):json({error:'temporarily_unavailable'},503)})
 const entry={...cfg,provider:'google',refreshToken:'fixture-refresh',accessToken:'expired',expiresAt:0}
 s.set({version:1,accounts:{gmail:entry,other:{...entry,user:'other@gmail.com'}}})
 assert.deepEqual(await Promise.all([s.auth.accessToken('gmail',cfg),s.auth.accessToken('gmail',cfg)]),['new-access','new-access']);assert.equal(count,1)
 mode='transient';await assert.rejects(s.auth.accessToken('gmail',cfg,true),/stored login was kept/);assert.ok(s.store().accounts.gmail)
 mode='revoked';await assert.rejects(s.auth.accessToken('gmail',cfg,true),/sign in again/);assert.equal(s.store().accounts.gmail,undefined);assert.ok(s.store().accounts.other)
 s.set({version:1,accounts:{gmail:{...entry,provider:'microsoft'}}});await assert.rejects(s.auth.accessToken('gmail',cfg),/Sign in/)
})

test('logout during refresh cannot resurrect token data; malformed callback never consumes valid flow',async t=>{
 let finish
 const s=setup(t,()=>new Promise(resolve=>{finish=resolve}))
 s.set({version:1,accounts:{gmail:{user:cfg.user,clientId:cfg.clientId,provider:'google',refreshToken:'fixture-refresh',accessToken:'old',expiresAt:0}}})
 const task=s.auth.accessToken('gmail',cfg);s.auth.cancel('gmail');s.set({version:1,accounts:{}});finish(json({access_token:'new',expires_in:3600}));await assert.rejects(task,/login changed/);assert.deepEqual(s.store().accounts,{})
 const start=await s.auth.start('gmail',cfg);assert.equal((await fetch(callback(start,{state:'中'.repeat(43)}))).status,403);assert.equal(s.auth.state('gmail',cfg).state,'pending')
})

test('Gmail OAuth is explicit and does not break existing application-password accounts',()=>{
 assert.equal(resolveEmailSettings({provider:'gmail',user:cfg.user,password:'synthetic-app-fixture'}).accounts.get('default').authKind,'password')
 const oauth=resolveEmailSettings({provider:'gmail',user:cfg.user,authKind:'oauth2',clientId:cfg.clientId,clientSecret:cfg.clientSecret}).accounts.get('default')
 assert.equal(oauth.oauthProvider,'google');assert.equal(oauth.password,'');assert.equal(oauth.clientSecret,cfg.clientSecret)
 const scoped=resolveEmailSettings({clientId:cfg.clientId,clientSecret:'parent-fixture',accounts:{gmail:{provider:'gmail',user:cfg.user,authKind:'oauth2',clientId:'other.apps.googleusercontent.com'}}}).accounts.get('gmail')
 assert.equal(scoped.clientSecret,undefined)
})
