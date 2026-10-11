import {z} from 'zod';
import {database} from '../../../db/store';
export const planItem=z.object({id:z.string().uuid(),title:z.string().trim().min(1).max(160),tooth:z.string().regex(/^(|general|[1-4][1-8]|[5-8][1-5])$/).default(''),cost:z.number().int().min(0).max(1000000000000).nullable()});
export const planItems=z.array(planItem).max(20).default([]).refine(v=>new Set(v.map(t=>t.id)).size===v.length);
export const treatmentIds=z.array(z.string().min(1).max(80)).max(40).refine(v=>new Set(v).size===v.length);
export async function validTreatments(db:ReturnType<typeof database>,owner:string,pid:string,ids:string[]){
 if(!ids.length)return true;
 const r=await db.prepare("SELECT COUNT(*) AS n FROM treatments WHERE owner=? AND patient_id=? AND status<>'cancelled' AND id IN (SELECT value FROM json_each(?))").bind(owner,pid,JSON.stringify(ids)).first<{n:number}>();return r?.n===ids.length;
}
export async function fingerprint(value:unknown){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))).map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function addTreatmentPlan(raw:unknown,db:ReturnType<typeof database>,owner:string){
 const parsed=z.object({patient_id:z.string().min(1).max(80),new_treatments:planItems}).safeParse(raw);
 const json=(d:unknown,s=200)=>Response.json(d,{status:s});
 if(!parsed.success||!parsed.data.new_treatments.length)return json({error:'أضف علاجاً واحداً على الأقل، وراجع الاسم والتكلفة.'},400);
 const d=parsed.data;if(!await db.prepare('SELECT id FROM patients WHERE id=? AND owner=?').bind(d.patient_id,owner).first())return json({error:'المريض غير موجود.'},400);
 const list=d.new_treatments.map(t=>({...t,tooth:t.tooth==='general'?'':t.tooth,cost_known:t.cost===null?0:1,cost:t.cost??0}));
 // A single INSERT validates every existing ID before inserting anything; retries are safe.
 const items=JSON.stringify(list),date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Damascus'}).format(new Date()),created=new Date().toISOString();
 await db.prepare(`INSERT INTO treatments (id,owner,patient_id,title,tooth,cost,cost_known,status,date,notes,created_at)
 SELECT json_extract(value,'$.id'),?,?,json_extract(value,'$.title'),json_extract(value,'$.tooth'),json_extract(value,'$.cost'),json_extract(value,'$.cost_known'),'planned',?,'',? FROM json_each(?)
 WHERE NOT EXISTS (SELECT 1 FROM treatments t JOIN json_each(?) j ON t.id=json_extract(j.value,'$.id') WHERE t.owner<>? OR t.patient_id<>? OR t.title<>json_extract(j.value,'$.title') OR t.tooth<>json_extract(j.value,'$.tooth') OR t.cost<>json_extract(j.value,'$.cost') OR t.cost_known<>json_extract(j.value,'$.cost_known'))
 AND NOT EXISTS (SELECT 1 FROM treatments t WHERE t.id=json_extract(value,'$.id'))`).bind(owner,d.patient_id,date,created,items,items,owner,d.patient_id).run();
 const saved=await db.prepare('SELECT id,title,tooth,cost,cost_known FROM treatments WHERE owner=? AND patient_id=? AND id IN (SELECT json_extract(value,\'$.id\') FROM json_each(?))').bind(owner,d.patient_id,items).all<Record<string,unknown>>();
 const ok=list.every(t=>saved.results.some(s=>s.id===t.id&&s.title===t.title&&s.tooth===t.tooth&&s.cost===t.cost&&s.cost_known===t.cost_known));
 return ok?json({ok:true,id:d.patient_id}):json({error:'تغيّرت بيانات الخطة المحفوظة؛ حدّث الصفحة قبل المحاولة.'},409);
}
