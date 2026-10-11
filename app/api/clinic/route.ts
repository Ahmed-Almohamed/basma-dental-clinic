import {addTreatmentPlan,treatmentIds,validTreatments} from './treatment-plan';
import {boundedBody,BodyTooLarge} from '../../request-body';
import {sessionAction} from './session-actions';
import {bookAppointment} from './booking-action';
import { z } from 'zod';
import { getClinicUser, sameOrigin } from '../../auth';
import { database } from '../../../db/store';
export const dynamic='force-dynamic';
const short=z.string().trim().max(160),long=z.string().trim().max(5000),id=z.string().min(1).max(80);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v,'تاريخ غير صالح');
const money=z.number().int().min(0).max(1000000000000);
const patient=z.object({name:short.min(2),phone:z.string().trim().max(30).regex(/^[+\d\s()-]*$/),birth_date:z.union([date,z.literal('')]),gender:z.enum(['','male','female']),allergies:long,history:long,notes:long});
const appointment=z.object({treatment_ids:z.preprocess(v=>{if(typeof v!=='string')return v;try{return JSON.parse(v)}catch{return v}},treatmentIds).optional(),patient_id:id,date,time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),duration:z.number().int().min(5).max(240).default(30),type:short.min(1).default('موعد'),tooth:z.string().regex(/^(|general|[1-4][1-8]|[5-8][1-5])$/).default(''),status:z.enum(['confirmed','waiting','active','done','cancelled','missed','postponed']),notes:long}).refine(v=>Number(v.time.slice(0,2))*60+Number(v.time.slice(3))+v.duration<=1440);
const treatment=z.object({patient_id:id,tooth:z.string().regex(/^(|[1-4][1-8]|[5-8][1-5])$/),title:short.min(1),cost:money,cost_known:z.number().int().min(0).max(1).default(1),status:z.enum(['planned','active','done','cancelled']),date,notes:long});
const transaction=z.object({patient_id:id.nullable(),kind:z.enum(['payment','expense']),amount:money.refine(v=>v>0),date,method:z.enum(['cash','transfer']),note:long}).refine(v=>v.kind==='expense'||!!v.patient_id);
const configuration=z.object({clinic:short.min(2),doctor:short.min(2),phone:short,address:long});
const schemas={patients:patient,appointments:appointment,treatments:treatment,ledger:transaction};
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){try{const user=await getClinicUser();if(!user)return json({error:'يلزم تسجيل الدخول لفتح سجلات العيادة.',signin:true},401);const db=database();const tables=['patients','appointments','treatments','ledger','files','settings'];const results=await db.batch(tables.map(t=>db.prepare(`SELECT * FROM ${t} WHERE owner = ?`).bind(user.userId)));return json(Object.fromEntries(tables.map((t,i)=>[t,t==='settings'?(results[i].results[0]||null):results[i].results])));}catch{return json({error:'تعذّر تحميل السجلات. حاول مجدداً.'},503)}}
export async function POST(request:Request){
 try{
 const rawBody=await boundedBody(request,30000);
 const user=await getClinicUser();if(!user)return json({error:'يلزم تسجيل الدخول.',signin:true},401);
 if(!sameOrigin(request))return json({error:'طلب غير مسموح.'},403);
 if(Number(request.headers.get('content-length')||0)>30000)return json({error:'الطلب أكبر من المسموح.'},413);
 let payload;try{payload=JSON.parse(new TextDecoder().decode(rawBody))}catch(e){return json({error:e instanceof BodyTooLarge?'الطلب أكبر من المسموح.':'طلب غير صالح.'},e instanceof BodyTooLarge?413:400)}const parsed=z.object({entity:z.string(),id:z.string().optional(),data:z.unknown()}).safeParse(payload);if(!parsed.success)return json({error:'طلب غير صالح.'},400);const body=parsed.data;const db=database();
 const actionResponse=await sessionAction(body,db,user.userId);if(actionResponse)return actionResponse;
 if(body.entity==='treatment_plan')return await addTreatmentPlan(body.data,db,user.userId);
 if(body.entity==='book_appointment')return await bookAppointment(body.data,db,user.userId);
 if(body.entity==='settings'){const result=configuration.safeParse(body.data);if(!result.success)return json({error:'راجع اسم العيادة واسم الطبيب والحقول المطلوبة.'},400);const d=result.data;await db.prepare('INSERT INTO settings (owner,clinic,doctor,phone,address) VALUES (?,?,?,?,?) ON CONFLICT(owner) DO UPDATE SET clinic=excluded.clinic,doctor=excluded.doctor,phone=excluded.phone,address=excluded.address').bind(user.userId,d.clinic,d.doctor,d.phone,d.address).run();return json({ok:true});}
 if(!Object.hasOwn(schemas,body.entity))return json({error:'طلب غير صالح.'},400);
 const entity=body.entity as keyof typeof schemas;const result=schemas[entity].safeParse(body.data);if(!result.success)return json({error:'راجع الحقول المطلوبة والتواريخ والأرقام.'},400);
 const d=result.data as Record<string,unknown>;
 if(body.id){if(!id.safeParse(body.id).success)return json({error:'سجل غير صالح.'},400);if(entity==='ledger')return json({error:'لا يمكن تعديل دفعة مسجلة.'},400);const exists=await db.prepare(`SELECT * FROM ${entity} WHERE id=? AND owner=?`).bind(body.id,user.userId).first();if(!exists)return json({error:'السجل غير موجود.'},404);if(entity==='appointments'){if(exists.patient_id!==d.patient_id)return json({error:'لا يمكن نقل موعد محفوظ إلى مريض آخر.'},400);if(exists.completion_outcome)return json({error:'تم إنهاء هذه الجلسة سابقاً.'},409);if(exists.date!==d.date)d.queue_order=-1;}}
 if(entity==='treatments'&&body.id){const old=await db.prepare('SELECT patient_id FROM treatments WHERE id=? AND owner=?').bind(body.id,user.userId).first();if(old?.patient_id!==d.patient_id)return json({error:'لا يمكن نقل علاج محفوظ إلى مريض آخر.'},400);}
 if(entity==='appointments'&&d.treatment_ids!==undefined){const ids=d.treatment_ids as string[];if(!await validTreatments(db,user.userId,String(d.patient_id),ids))return json({error:'اختر علاجات تخص هذا المريض ولم تُلغَ.'},400);d.treatment_ids=JSON.stringify(ids.slice().sort());}
 if(entity==='treatments'&&d.cost_known===0)d.cost=0;
 if(d.patient_id){const p=await db.prepare('SELECT id FROM patients WHERE id=? AND owner=?').bind(d.patient_id,user.userId).first();if(!p)return json({error:'اختر مريضاً من ملفات العيادة.'},400);}
 if(entity==='patients'&&d.birth_date&&String(d.birth_date)>new Date().toISOString().slice(0,10))return json({error:'تاريخ الميلاد لا يمكن أن يكون في المستقبل.'},400);
 const keys=Object.keys(d);const paymentRequest=entity==='ledger'?z.string().uuid().safeParse((body.data as Record<string,unknown>)?.request_id):null;const recordId=body.id||(paymentRequest?.success?paymentRequest.data:crypto.randomUUID());const created=new Date().toISOString();
 let statement;
 if(entity==='appointments'&&!['cancelled','missed'].includes(String(d.status))){
 const minute=Number(String(d.time).slice(0,2))*60+Number(String(d.time).slice(3));
 const conflict="NOT EXISTS (SELECT 1 FROM appointments WHERE owner=? AND date=? AND id<>? AND status NOT IN ('cancelled','missed') AND (CAST(substr(time,1,2) AS INTEGER)*60+CAST(substr(time,4,2) AS INTEGER)) < ? AND (CAST(substr(time,1,2) AS INTEGER)*60+CAST(substr(time,4,2) AS INTEGER)+duration) > ?)";
 const guard=[user.userId,d.date,recordId,minute+Number(d.duration),minute];
 statement=body.id?db.prepare(`UPDATE appointments SET ${keys.map(k=>`${k}=?`).join(',')} WHERE id=? AND owner=? AND ${conflict}`).bind(...keys.map(k=>d[k]),recordId,user.userId,...guard):db.prepare(`INSERT INTO appointments (id,owner,created_at,${keys.join(',')}) SELECT ${Array(keys.length+3).fill('?').join(',')} WHERE ${conflict}`).bind(recordId,user.userId,created,...keys.map(k=>d[k]),...guard);
 }else{statement=body.id?db.prepare(`UPDATE ${entity} SET ${keys.map(k=>`${k}=?`).join(',')} WHERE id=? AND owner=?`).bind(...keys.map(k=>d[k]),recordId,user.userId):db.prepare(`INSERT ${entity==='ledger'?'OR IGNORE ':''}INTO ${entity} (id,owner,created_at,${keys.join(',')}) VALUES (${Array(keys.length+3).fill('?').join(',')})`).bind(recordId,user.userId,created,...keys.map(k=>d[k]));}
 const saved=await statement.run();if(entity==='ledger'&&!saved.meta.changes){const previous=await db.prepare('SELECT * FROM ledger WHERE id=? AND owner=?').bind(recordId,user.userId).first<Record<string,unknown>>();return previous&&keys.every(k=>previous[k]===d[k])?json({ok:true,id:recordId}):json({error:'تم حفظ هذه الدفعة ببيانات مختلفة. افتح نموذج دفعة جديد.'},409)}if(!saved.meta.changes)return json({error:'الوقت يتداخل مع موعد آخر. اختر وقتاً مختلفاً.'},409);
 return json({ok:true,id:recordId});
 }catch(e){return json({error:e instanceof BodyTooLarge?'الطلب أكبر من المسموح.':'تعذّر الحفظ. معلوماتك ما زالت في النموذج؛ حاول مجدداً.'},e instanceof BodyTooLarge?413:503)}
}

