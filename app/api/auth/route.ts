import {boundedBody,BodyTooLarge} from '../../request-body';
import {database} from '../../../db/store';
import {digest,hex,passwordHash,verifyPassword,readSession,sameOrigin,sessionCookie,SESSION_SECONDS} from '../../auth';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200,headers:Record<string,string>={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
export async function GET(request:Request){try{const user=await readSession(request.headers.get('cookie')||'');return user?json({username:user.username,mustChange:!!user.mustChange}):json({error:'يلزم تسجيل الدخول.'},401);}catch{return json({error:'تعذّر التحقق من تسجيل الدخول.'},503)}}
export async function POST(request:Request){try{
 if(!sameOrigin(request))return json({error:'طلب غير مسموح.'},403);
 if(Number(request.headers.get('content-length')||0)>4096)return json({error:'طلب كبير.'},413);
 const text=new TextDecoder().decode(await boundedBody(request,4096));if(text.length>4096)return json({error:'طلب كبير.'},413);let d;try{d=JSON.parse(text)}catch{return json({error:'طلب غير صالح.'},400)}
 const db=database();
 if(d.action==='logout'){const s=await readSession(request.headers.get('cookie')||'');if(s)await db.prepare('DELETE FROM auth_sessions WHERE id=?').bind(s.sessionId).run();return json({ok:true},200,{'Set-Cookie':sessionCookie('',request,0)});}
 if(!['login','change'].includes(d.action))return json({error:'طلب غير صالح.'},400);
 const key=await digest((request.headers.get('cf-connecting-ip')||'local')+':'+d.action),now=Date.now();
 const attempts=await db.prepare('INSERT INTO auth_attempts (id,count,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=CASE WHEN expires_at<=? THEN 1 ELSE count+1 END,expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END RETURNING count').bind(key,now+900000,now,now).first<{count:number}>();
 if((attempts?.count||0)>10)return json({error:'محاولات كثيرة. حاول بعد 15 دقيقة.'},429,{'Retry-After':'900'});
 const account=await db.prepare('SELECT * FROM auth_accounts WHERE id=?').bind('clinic').first<{id:string;username:string;password_hash:string;must_change:number}>();if(!account)return json({error:'بيانات الدخول لم تُجهّز بعد.'},503);
 let s=null;
 if(d.action==='change'){s=await readSession(request.headers.get('cookie')||'');if(!s)return json({error:'يلزم تسجيل الدخول.'},401);}
 const password=d.action==='change'?d.currentPassword:d.password;
 if(typeof password!=='string'||password.length>128||!await verifyPassword(password,account.password_hash)||(d.action==='login'&&(typeof d.username!=='string'||d.username.trim().toLowerCase()!==account.username.trim().toLowerCase())))return json({error:'بيانات الدخول غير صحيحة.'},401);
 const token=hex(crypto.getRandomValues(new Uint8Array(32)).buffer),sessionId=await digest(token),queries=[];
 if(d.action==='change'){
  if(typeof d.username!=='string'||d.username.trim().length<3||d.username.trim().length>80||typeof d.newPassword!=='string'||d.newPassword.length<12||d.newPassword.length>128||d.newPassword!==d.confirmPassword||d.newPassword===password)return json({error:'اسم الدخول 3 أحرف على الأقل، وكلمة مرور جديدة من 12 حرفاً على الأقل، مع تأكيد مطابق.'},400);
  const salt=hex(crypto.getRandomValues(new Uint8Array(16)).buffer),hash=salt+':'+await passwordHash(d.newPassword,salt);
  // Compare the current hash inside the transaction: a concurrent change cannot overwrite newer credentials.
  queries.push(db.prepare('UPDATE auth_accounts SET username=?,password_hash=?,must_change=0 WHERE id=? AND password_hash=?').bind(d.username.trim(),hash,account.id,account.password_hash));
  queries.push(db.prepare('DELETE FROM auth_sessions WHERE account_id=? AND EXISTS(SELECT 1 FROM auth_accounts WHERE id=? AND password_hash=?)').bind(account.id,account.id,hash));
  queries.push(db.prepare('INSERT INTO auth_sessions (id,account_id,expires_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM auth_accounts WHERE id=? AND password_hash=?)').bind(sessionId,account.id,now+SESSION_SECONDS*1000,account.id,hash));
 }else queries.push(db.prepare('INSERT INTO auth_sessions (id,account_id,expires_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM auth_accounts WHERE id=? AND password_hash=?)').bind(sessionId,account.id,now+SESSION_SECONDS*1000,account.id,account.password_hash));
 const result=await db.batch(queries);if(!result[result.length-1].meta.changes)return json({error:'تغيّرت بيانات الدخول؛ سجّل الدخول مجدداً.'},409);
 await db.batch([db.prepare('DELETE FROM auth_sessions WHERE expires_at<=?').bind(now),db.prepare('DELETE FROM auth_attempts WHERE id=? OR expires_at<=?').bind(key,now)]);
 return json({ok:true,mustChange:d.action==='login'&&!!account.must_change},200,{'Set-Cookie':sessionCookie(token,request)});
 }catch(e){return json({error:e instanceof BodyTooLarge?'طلب كبير.':'تعذّر إتمام الطلب. حاول مجدداً.'},e instanceof BodyTooLarge?413:503)}}

