import test from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {createServer as httpsServer} from 'node:https'
import {GoogleOAuth,GOOGLE_TOKEN_URL,GOOGLE_MAIL_SCOPE} from '../lib/google-oauth.js'
import {resolveEmailSettings} from '../lib/config.js'
import {fetchWithProxy} from '../lib/proxy.js'
import {startHttpProxy,startSocks5Proxy} from './helpers/proxy-peer.mjs'

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

const TEST_KEY=readFileSync(new URL('./fixtures/smtp-test-key.pem',import.meta.url))
const TEST_CERT=readFileSync(new URL('./fixtures/smtp-test-ca.pem',import.meta.url))

test('default GoogleOAuth routes token exchange and refresh through configured SOCKS5 proxy and preserves tokens on failure',async t=>{
 const socks=await startSocks5Proxy({failReply:0x05})
 t.after(()=>socks.close())
 let store={version:1,accounts:{}}
 // Zero injected fetch: exercises the exact production transport path.
 const auth=new GoogleOAuth({read:()=>structuredClone(store),write:x=>{store=structuredClone(x)}})
 t.after(()=>auth.dispose())
 const proxiedCfg={...cfg,proxy:`socks5://proxy-user:proxy-secret-do-not-leak@127.0.0.1:${socks.port}`}
 const start=await auth.start('gmail',proxiedCfg)
 const cb=await fetch(callback(start))
 assert.equal(cb.status,400)
 const text=await cb.text()
 assert.match(text,/无法连接 Google 登录服务/)
 assert.doesNotMatch(text,/proxy-secret-do-not-leak/)
 assert.equal(socks.seen.length,1)
 assert.equal(socks.seen[0].host,'oauth2.googleapis.com')
 assert.equal(socks.seen[0].port,443)

 // Existing token must be preserved when refresh fails over an unreachable proxy.
 store={version:1,accounts:{gmail:{provider:'google',user:cfg.user,clientId:cfg.clientId,refreshToken:'keep-me',accessToken:'expired',expiresAt:0}}}
 await assert.rejects(auth.accessToken('gmail',proxiedCfg),/无法连接 Google 登录服务/)
 assert.equal(store.accounts.gmail.refreshToken,'keep-me')
 assert.equal(socks.seen.length,2)
 assert.equal(socks.seen[1].host,'oauth2.googleapis.com')
})

test('GoogleOAuth completes full login, userinfo and refresh through real SOCKS5 and HTTP CONNECT proxies',async t=>{
 const googleHits=[]
 const mockGoogle=httpsServer({key:TEST_KEY,cert:TEST_CERT},(req,res)=>{
  const chunks=[]
  req.on('data',c=>chunks.push(c))
  req.on('end',()=>{
   const body=Buffer.concat(chunks).toString('utf8')
   googleHits.push({host:req.headers.host,url:req.url,method:req.method,body})
   res.writeHead(200,{'content-type':'application/json'})
   if(req.url==='/token'){
    const params=new URLSearchParams(body)
    const grant=params.get('grant_type')
    res.end(JSON.stringify({access_token:grant==='refresh_token'?'refreshed-via-proxy':'access-via-proxy',refresh_token:'refresh-via-proxy',scope:GOOGLE_MAIL_SCOPE,expires_in:3600}))
    return
   }
   res.end(JSON.stringify({email:cfg.user,email_verified:true}))
  })
 })
 await new Promise(resolve=>mockGoogle.listen(0,'127.0.0.1',resolve))
 const googlePort=mockGoogle.address().port
 t.after(()=>new Promise(resolve=>mockGoogle.close(resolve)))

 const socks=await startSocks5Proxy({rewriteTarget:()=>({host:'127.0.0.1',port:googlePort})})
 const httpProxy=await startHttpProxy({rewriteTarget:()=>({host:'127.0.0.1',port:googlePort})})
 t.after(async()=>{await socks.close();await httpProxy.close()})

 let store={version:1,accounts:{}}
 const auth=new GoogleOAuth(
  {read:()=>structuredClone(store),write:x=>{store=structuredClone(x)}},
  {proxyFetch:(input,init,proxy)=>fetchWithProxy(input,init,proxy,{tls:{rejectUnauthorized:false}})},
 )
 t.after(()=>auth.dispose())

 // Start login without proxy, then update proxy via current() before callback arrives.
 let active={...cfg,proxy:socks.url}
 const start=await auth.start('gmail',{...cfg},()=>active)
 const cb=await fetch(callback(start))
 assert.equal(cb.status,200)
 assert.equal(auth.poll('gmail',active).status,'ok')
 assert.deepEqual(socks.seen.map(s=>`${s.host}:${s.port}`),['oauth2.googleapis.com:443','openidconnect.googleapis.com:443'])

 // Refresh through HTTP CONNECT proxy.
 const refreshed=await auth.accessToken('gmail',{...cfg,proxy:httpProxy.url},true)
 assert.equal(refreshed,'refreshed-via-proxy')
 assert.equal(httpProxy.seen.length,1)
 assert.equal(httpProxy.seen[0].method,'CONNECT')
 assert.equal(httpProxy.seen[0].target,'oauth2.googleapis.com:443')
 assert.equal(googleHits.length,3)
})
