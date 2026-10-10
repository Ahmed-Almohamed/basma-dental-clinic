import assert from 'node:assert/strict';import fs from 'node:fs';import {randomBytes} from 'node:crypto';import {testCookie} from './test-session.mjs';
const base='http://127.0.0.1:5173',cookie=await testCookie(),otherCookie=await testCookie();
async function call(path,body,session=cookie,origin=base){const r=await fetch(base+path,{method:'POST',headers:{Origin:origin,Cookie:session,'Content-Type':'application/json'},body:JSON.stringify(body)});const text=await r.text();let parsed;try{parsed=JSON.parse(text)}catch{parsed={error:text}}return {status:r.status,body:parsed,cookie:r.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ')};}
const data=await(await fetch(base+'/api/clinic',{headers:{cookie}})).json();const pid=data.patients[0].id;
const payment={entity:'ledger',data:{request_id:crypto.randomUUID(),patient_id:pid,kind:'payment',amount:100,date:'2040-05-01',method:'cash',note:'local idempotency test'}};
const receipts=await Promise.all([call('/api/clinic',payment),call('/api/clinic',payment)]);assert(receipts.every(r=>r.status===200));assert.equal(receipts[0].body.id,receipts[1].body.id);
assert.equal((await call('/api/clinic',{...payment,data:{...payment.data,amount:200}})).status,409);
assert.equal((await call('/api/clinic',payment,cookie,'https://other.invalid')).status,403);
assert.equal((await fetch(base+'/api/clinic',{method:'POST',headers:{cookie,Origin:base,'Content-Type':'application/json'},body:'{'})).status,400);
assert.equal((await fetch(base+'/api/clinic',{method:'POST',headers:{cookie,Origin:base,'Content-Type':'application/json'},body:' '.repeat(30001)})).status,413);
assert.equal((await fetch(base+'/api/clinic',{headers:{'oai-authenticated-user-id':'clinic','oai-authenticated-user-email':'fake@example.invalid'}})).status,401);
const file=Buffer.concat([Buffer.from('%PDF-1.4\\n'),randomBytes(1200000)]),fd=new FormData();fd.set('patient_id',pid);fd.set('file',new File([file],'multichunk.pdf',{type:'application/pdf'}));let r=await fetch(base+'/api/files',{method:'POST',headers:{cookie,Origin:base},body:fd});assert.equal(r.status,200,await r.clone().text());const id=(await r.json()).id;r=await fetch(base+'/api/files?id='+id,{headers:{cookie}});assert.equal(r.status,200);assert.deepEqual(Buffer.from(await r.arrayBuffer()),file,'attachment chunks reassemble byte-for-byte');
const bad=new FormData();bad.set('patient_id',pid);bad.set('file',new File(['not a png'],'invalid.png',{type:'image/png'}));assert.equal((await fetch(base+'/api/files',{method:'POST',headers:{cookie,Origin:base},body:bad})).status,400);
const creds=JSON.parse(fs.readFileSync('.private/test-credentials.json')),newPassword=randomBytes(24).toString('hex');
assert.equal((await call('/api/auth',{action:'change',username:'local-test-renamed',currentPassword:'wrong',newPassword,confirmPassword:newPassword})).status,401);
assert.equal((await call('/api/auth',{action:'change',username:'local-test-renamed',currentPassword:creds.password,newPassword:'short',confirmPassword:'short'})).status,400);
const changed=await call('/api/auth',{action:'change',username:'local-test-renamed',currentPassword:creds.password,newPassword,confirmPassword:newPassword});assert.equal(changed.status,200,JSON.stringify(changed.body));assert(changed.cookie);
assert.equal((await fetch(base+'/api/clinic',{headers:{cookie}})).status,401);assert.equal((await fetch(base+'/api/clinic',{headers:{cookie:otherCookie}})).status,401);
assert.equal((await call('/api/auth',{action:'login',...creds},'')).status,401,'old credentials revoked');
const restored=await call('/api/auth',{action:'change',username:creds.username,currentPassword:newPassword,newPassword:creds.password,confirmPassword:creds.password},changed.cookie);assert.equal(restored.status,200);
assert.equal((await call('/api/auth',{action:'logout'},restored.cookie)).status,200);assert.equal((await fetch(base+'/api/clinic',{headers:{cookie:restored.cookie}})).status,401);
let throttled=false;for(let i=0;i<12;i++){const a=await call('/api/auth',{action:'login',username:creds.username,password:'invalid-password'},'');if(a.status===429){throttled=true;break}assert.equal(a.status,401);}assert(throttled,'login rate limit enforced');
console.log('PASS: receipt retry idempotency, CSRF, malformed/oversized requests, forged identity rejection, multipart chunk integrity, file signature validation, username/password change, old-session revocation, logout and login throttling.');

