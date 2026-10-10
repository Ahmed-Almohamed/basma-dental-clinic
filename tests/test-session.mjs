import fs from 'node:fs';
import assert from 'node:assert/strict';
export async function testCookie(){const {username,password}=JSON.parse(fs.readFileSync(new URL('../.private/test-credentials.json',import.meta.url)));const base='http://127.0.0.1:5173';const r=await fetch(base+'/api/auth',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({action:'login',username,password})});assert.equal(r.status,200,await r.clone().text());const cookie=r.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');assert(cookie);return cookie;}

