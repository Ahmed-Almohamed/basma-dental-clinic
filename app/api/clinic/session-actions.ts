import {z} from 'zod';
import {database} from '../../../db/store';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const id=z.string().min(1).max(80);
const completion=z.object({appointment_id:id,amount:z.number().int().min(0).max(1000000000000),method:z.enum(['cash','transfer']),outcome:z.enum(['followup','finished'])});
const reorder=z.object({date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),ids:z.array(id).min(1).max(500)}).refine(v=>new Set(v.ids).size===v.ids.length);
type Body={entity:string;data?:unknown};
export async function sessionAction(body:Body,db:ReturnType<typeof database>,owner:string):Promise<Response|null>{
 if(body.entity==='complete_session'){
  const parsed=completion.safeParse(body.data);if(!parsed.success)return json({error:'راجع مبلغ الدفعة وخيار متابعة العلاج.'},400);
  const d=parsed.data;
  const a=await db.prepare('SELECT * FROM appointments WHERE id=? AND owner=?').bind(d.appointment_id,owner).first<Record<string,any>>();
  if(!a)return json({error:'الموعد غير موجود.'},404);
  const paymentId='session:'+d.appointment_id;
  async function existingResult(){
   const saved=await db.prepare('SELECT status,completion_outcome FROM appointments WHERE id=? AND owner=?').bind(d.appointment_id,owner).first<Record<string,any>>();
   const payment=await db.prepare('SELECT amount,method FROM ledger WHERE id=? AND owner=?').bind(paymentId,owner).first<Record<string,any>>();
   if(saved?.status==='done'&&saved.completion_outcome===d.outcome&&Number(payment?.amount||0)===d.amount&&(!d.amount||payment?.method===d.method))return json({ok:true,id:d.appointment_id});
   return json({error:'تغيّرت حالة الجلسة أو تم حفظها سابقاً. حدّث السجلات قبل المتابعة.'},409);
  }
  if(['done','cancelled','missed'].includes(a.status))return existingResult();
  const timestamp=new Date().toISOString();const paidDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Damascus',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const statements=[];
  if(d.amount>0)statements.push(db.prepare("INSERT INTO ledger (id,owner,patient_id,kind,amount,date,method,note,created_at) SELECT ?,owner,patient_id,'payment',?,?,?,?,? FROM appointments WHERE id=? AND owner=? AND status NOT IN ('done','cancelled','missed')").bind(paymentId,d.amount,paidDate,d.method,'دفعة جلسة '+a.date+' · '+a.time,timestamp,d.appointment_id,owner));
  statements.push(db.prepare("UPDATE appointments SET status='done',completion_outcome=?,completed_at=? WHERE id=? AND owner=? AND status NOT IN ('done','cancelled','missed')").bind(d.outcome,timestamp,d.appointment_id,owner));
  const results=await db.batch(statements);
  if(!results[results.length-1].meta.changes)return existingResult();
  return json({ok:true,id:d.appointment_id});
 }
 if(body.entity==='reorder_appointments'){
  const parsed=reorder.safeParse(body.data);if(!parsed.success)return json({error:'ترتيب غير صالح.'},400);
  const d=parsed.data,ids=JSON.stringify(d.ids);
  // The entire day's membership is checked inside the same UPDATE as the ordering.
  const result=await db.prepare(`UPDATE appointments SET queue_order=(SELECT CAST(key AS INTEGER) FROM json_each(?) WHERE value=appointments.id) WHERE owner=? AND date=? AND (SELECT COUNT(*) FROM appointments WHERE owner=? AND date=?)=json_array_length(?) AND NOT EXISTS (SELECT 1 FROM appointments WHERE owner=? AND date=? AND id NOT IN (SELECT value FROM json_each(?)))`).bind(ids,owner,d.date,owner,d.date,ids,owner,d.date,ids).run();
  if(result.meta.changes!==d.ids.length)return json({error:'تغيّر جدول هذا اليوم. تم تحديثه؛ أعد ترتيب البطاقات.'},409);
  return json({ok:true});
 }
 return null;
}
