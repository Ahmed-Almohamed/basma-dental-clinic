import {z} from 'zod';
import {database} from '../../../db/store';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const schema=z.object({
 request_id:z.string().uuid(),patient_id:z.string().max(80).default(''),
 new_patient:z.object({name:z.string().trim().min(2).max(160),phone:z.string().trim().max(30).regex(/^[+\d\s()-]*$/).default(''),allergies:z.string().trim().max(5000).default(''),history:z.string().trim().max(5000).default(''),notes:z.string().trim().max(5000).default(''),gender:z.enum(['','male','female']).default(''),birth_date:z.string().default('').refine(v=>!v||(/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v&&v<=new Date().toISOString().slice(0,10)))}).optional(),
 date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v),
 type:z.string().trim().min(1).max(160),tooth:z.string().regex(/^(general|[1-4][1-8]|[5-8][1-5])$/),
 time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),notes:z.string().trim().max(5000).default('')
}).refine(d=>Boolean(d.patient_id)!==Boolean(d.new_patient)).refine(d=>Number(d.time.slice(0,2))*60+Number(d.time.slice(3))+30<=1440);

export async function bookAppointment(raw:unknown,db:ReturnType<typeof database>,owner:string){
 const parsed=schema.safeParse(raw);if(!parsed.success)return json({error:'راجع معلومات المريض ونوع الجلسة والسن واليوم والوقت.'},400);
 const d=parsed.data,pid=d.patient_id||'booking:'+d.request_id,created=new Date().toISOString();
 const minute=Number(d.time.slice(0,2))*60+Number(d.time.slice(3));
 const conflict="NOT EXISTS (SELECT 1 FROM appointments WHERE owner=? AND date=? AND status NOT IN ('cancelled','missed') AND (CAST(substr(time,1,2) AS INTEGER)*60+CAST(substr(time,4,2) AS INTEGER)) < ? AND (CAST(substr(time,1,2) AS INTEGER)*60+CAST(substr(time,4,2) AS INTEGER)+duration) > ?)";
 const guard=[owner,d.date,minute+30,minute];
 if(d.patient_id&&!await db.prepare('SELECT id FROM patients WHERE id=? AND owner=?').bind(pid,owner).first())return json({error:'اختر مريضاً من ملفات العيادة.'},400);
 const statements=[];
 // Both inserts share one transaction: a booked slot cannot leave an orphan patient.
 if(d.new_patient)statements.push(db.prepare(`INSERT INTO patients (id,owner,name,phone,allergies,history,notes,gender,birth_date,created_at) SELECT ?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM patients WHERE id=?) AND NOT EXISTS (SELECT 1 FROM appointments WHERE id=?) AND ${conflict}`).bind(pid,owner,d.new_patient.name,d.new_patient.phone,d.new_patient.allergies,d.new_patient.history,d.new_patient.notes,d.new_patient.gender,d.new_patient.birth_date,created,pid,d.request_id,...guard));
 statements.push(db.prepare(`INSERT INTO appointments (id,owner,patient_id,date,time,duration,type,tooth,status,notes,created_at) SELECT ?,?,?,?,?,30,?,?,'confirmed',?,? WHERE EXISTS (SELECT 1 FROM patients WHERE id=? AND owner=?) AND NOT EXISTS (SELECT 1 FROM appointments WHERE id=?) AND ${conflict}`).bind(d.request_id,owner,pid,d.date,d.time,d.type,d.tooth,d.notes,created,pid,owner,d.request_id,...guard));
 await db.batch(statements);
 const saved=await db.prepare('SELECT * FROM appointments WHERE id=? AND owner=?').bind(d.request_id,owner).first<Record<string,unknown>>();
 if(saved&&saved.patient_id===pid&&saved.date===d.date&&saved.time===d.time&&saved.notes===d.notes&&saved.type===d.type&&saved.tooth===d.tooth){
  if(d.new_patient){const p=await db.prepare('SELECT name,phone FROM patients WHERE id=? AND owner=?').bind(pid,owner).first<Record<string,string>>();if(p?.name!==d.new_patient.name||p?.phone!==d.new_patient.phone)return json({error:'تم حفظ هذا الحجز ببيانات مختلفة؛ حدّث المواعيد.'},409)}
  return json({ok:true,id:d.request_id,patient_id:pid});
 }
 return json({error:saved?'تم حفظ هذا الحجز سابقاً ببيانات مختلفة.':'الوقت محجوز الآن. اختر وقتاً آخر؛ لم يُضف أي ملف جديد.'},409);
}
