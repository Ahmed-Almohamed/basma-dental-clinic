import {planItems,treatmentIds,validTreatments,fingerprint} from './treatment-plan';
import {z} from 'zod';
import {database} from '../../../db/store';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const schema=z.object({
 new_treatments:planItems,treatment_ids:treatmentIds.default([]),request_id:z.string().uuid(),patient_id:z.string().max(80).default(''),
 new_patient:z.object({name:z.string().trim().min(2).max(160),phone:z.string().trim().max(30).regex(/^[+\d\s()-]*$/).default(''),allergies:z.string().trim().max(5000).default(''),history:z.string().trim().max(5000).default(''),notes:z.string().trim().max(5000).default(''),gender:z.enum(['','male','female']).default(''),birth_date:z.string().default('').refine(v=>!v||(/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v&&v<=new Date().toISOString().slice(0,10)))}).optional(),
 date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v),
 type:z.string().trim().min(1).max(160),tooth:z.string().regex(/^(general|[1-4][1-8]|[5-8][1-5])$/),
 time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),notes:z.string().trim().max(5000).default('')
}).refine(d=>d.new_treatments.length+d.treatment_ids.length<=40).refine(d=>Boolean(d.patient_id)!==Boolean(d.new_patient)).refine(d=>Number(d.time.slice(0,2))*60+Number(d.time.slice(3))+30<=1440);

export async function bookAppointment(raw:unknown,db:ReturnType<typeof database>,owner:string){
 const parsed=schema.safeParse(raw);if(!parsed.success)return json({error:'راجع معلومات المريض ونوع الجلسة والسن واليوم والوقت.'},400);
 const d=parsed.data,pid=d.patient_id||'booking:'+d.request_id,created=new Date().toISOString();
 const signature=await fingerprint(d);
 const prior=await db.prepare('SELECT booking_fingerprint FROM appointments WHERE id=? AND owner=?').bind(d.request_id,owner).first<{booking_fingerprint:string}>();
 if(prior?.booking_fingerprint)return prior.booking_fingerprint===signature?json({ok:true,id:d.request_id,patient_id:pid}):json({error:'تم حفظ الحجز ببيانات مختلفة؛ حدّث المواعيد.'},409);
 if(!await validTreatments(db,owner,pid,d.treatment_ids))return json({error:'اختر علاجات تخص هذا المريض ولم تُلغَ.'},400);
 const newIds=d.new_treatments.map(t=>t.id);
 if(newIds.some(id=>d.treatment_ids.includes(id)))return json({error:'العلاج مكرر.'},400);
 if(newIds.length&&await db.prepare('SELECT id FROM treatments WHERE id IN (SELECT value FROM json_each(?))').bind(JSON.stringify(newIds)).first()){const retry=await db.prepare('SELECT booking_fingerprint FROM appointments WHERE id=? AND owner=?').bind(d.request_id,owner).first<{booking_fingerprint:string}>();return retry?.booking_fingerprint===signature?json({ok:true,id:d.request_id,patient_id:pid}):json({error:'هذه العلاجات محفوظة مسبقاً؛ اخترها من الخطة.'},409);}
 const links=JSON.stringify([...d.treatment_ids,...newIds].sort());
 const minute=Number(d.time.slice(0,2))*60+Number(d.time.slice(3));
 const conflict="NOT EXISTS (SELECT 1 FROM appointments WHERE owner=? AND date=? AND status NOT IN ('cancelled','missed') AND (CAST(substr(time,1,2) AS INTEGER)*60+CAST(substr(time,4,2) AS INTEGER)) < ? AND (CAST(substr(time,1,2) AS INTEGER)*60+CAST(substr(time,4,2) AS INTEGER)+duration) > ?) AND NOT EXISTS (SELECT 1 FROM treatments WHERE id IN (SELECT value FROM json_each(?))) AND (SELECT COUNT(*) FROM treatments WHERE owner=? AND patient_id=? AND status<>'cancelled' AND id IN (SELECT value FROM json_each(?)))=?";
 const guard=[owner,d.date,minute+30,minute,JSON.stringify(newIds),owner,pid,JSON.stringify(d.treatment_ids),d.treatment_ids.length];
 if(d.patient_id&&!await db.prepare('SELECT id FROM patients WHERE id=? AND owner=?').bind(pid,owner).first())return json({error:'اختر مريضاً من ملفات العيادة.'},400);
 const statements=[];
 // Both inserts share one transaction: a booked slot cannot leave an orphan patient.
 if(d.new_patient)statements.push(db.prepare(`INSERT INTO patients (id,owner,name,phone,allergies,history,notes,gender,birth_date,created_at) SELECT ?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id=?) AND NOT EXISTS (SELECT 1 FROM appointments WHERE id=?) AND ${conflict}`).bind(pid,owner,d.new_patient.name,d.new_patient.phone,d.new_patient.allergies,d.new_patient.history,d.new_patient.notes,d.new_patient.gender,d.new_patient.birth_date,created,pid,d.request_id,...guard));
 statements.push(db.prepare(`INSERT INTO appointments (id,owner,patient_id,date,time,duration,type,tooth,status,notes,created_at,treatment_ids,booking_fingerprint) SELECT ?,?,?,?,?,30,?,?,'confirmed',?,?,?,? WHERE EXISTS (SELECT 1 FROM patients WHERE id=? AND owner=?) AND NOT EXISTS (SELECT 1 FROM appointments WHERE id=?) AND ${conflict}`).bind(d.request_id,owner,pid,d.date,d.time,d.type,d.tooth,d.notes,created,links,signature,pid,owner,d.request_id,...guard));
 for(const t of d.new_treatments)statements.push(db.prepare("INSERT INTO treatments (id,owner,patient_id,title,tooth,cost,cost_known,status,date,notes,created_at) SELECT ?,?,?,?,?,?,?,'planned',?,'',? WHERE EXISTS (SELECT 1 FROM appointments WHERE id=? AND owner=? AND booking_fingerprint=? AND created_at=?) AND NOT EXISTS (SELECT 1 FROM treatments WHERE id=?)").bind(t.id,owner,pid,t.title,t.tooth==='general'?'':t.tooth,t.cost??0,t.cost===null?0:1,d.date,created,d.request_id,owner,signature,created,t.id));
 await db.batch(statements);
 const saved=await db.prepare('SELECT * FROM appointments WHERE id=? AND owner=?').bind(d.request_id,owner).first<Record<string,unknown>>();
 if(saved&&saved.booking_fingerprint===signature&&saved.patient_id===pid&&saved.date===d.date&&saved.time===d.time&&saved.notes===d.notes&&saved.type===d.type&&saved.tooth===d.tooth){
  if(d.new_patient){const p=await db.prepare('SELECT name,phone FROM patients WHERE id=? AND owner=?').bind(pid,owner).first<Record<string,string>>();if(p?.name!==d.new_patient.name||p?.phone!==d.new_patient.phone)return json({error:'تم حفظ هذا الحجز ببيانات مختلفة؛ حدّث المواعيد.'},409)}
  return json({ok:true,id:d.request_id,patient_id:pid});
 }
 return json({error:saved?'تم حفظ هذا الحجز سابقاً ببيانات مختلفة.':'الوقت محجوز الآن. اختر وقتاً آخر؛ لم يُضف أي ملف جديد.'},409);
}
