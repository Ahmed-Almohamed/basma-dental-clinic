import {headers} from 'next/headers';
import {database} from '../db/store';
export const SESSION_COOKIE='basma_session';
export const SESSION_SECONDS=43200;
export const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export const digest=async(value:string)=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
export async function passwordHash(password:string,salt:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256));}
export async function verifyPassword(password:string,stored:string){const [salt,hash]=stored.split(':');if(!salt||!hash)return false;const actual=await passwordHash(password,salt);let mismatch=actual.length^hash.length;for(let i=0;i<actual.length;i++)mismatch|=actual.charCodeAt(i)^(hash.charCodeAt(i)||0);return mismatch===0;}
export async function readSession(cookie:string){const token=cookie.split(';').map(v=>v.trim()).find(v=>v.startsWith(SESSION_COOKIE+'='))?.slice(SESSION_COOKIE.length+1);if(!token||! /^[a-f0-9]{64}$/.test(token))return null;return database().prepare('SELECT a.id AS userId,a.username,s.id AS sessionId,a.must_change AS mustChange FROM auth_sessions s JOIN auth_accounts a ON a.id=s.account_id WHERE s.id=? AND s.expires_at>?').bind(await digest(token),Date.now()).first<{userId:string;username:string;sessionId:string;mustChange:number}>();}
export async function getClinicUser(){const h=await headers();const user=await readSession(h.get('cookie')||'');return user&&!user.mustChange?user:null;}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin&&request.headers.get('sec-fetch-site')!=='cross-site';}
export function sessionCookie(token:string,request:Request,maxAge=SESSION_SECONDS){return SESSION_COOKIE+'='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+maxAge+(new URL(request.url).protocol==='https:'?'; Secure':'');}

