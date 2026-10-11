export type Row = Record<string, any>;
export type Data = { patients:Row[]; appointments:Row[]; treatments:Row[]; ledger:Row[]; files:Row[]; settings:Row|null };
export const emptyData:Data={patients:[],appointments:[],treatments:[],ledger:[],files:[],settings:null};
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Damascus',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const money=(n:number)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(n)+' ل.س';
export const dateLabel=(d:string)=>new Intl.DateTimeFormat('ar-SY',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
export const statuses:Record<string,string>={confirmed:'مؤكد',waiting:'في الانتظار',active:'قيد العلاج',done:'مكتمل',cancelled:'ملغي',missed:'لم يحضر',planned:'مخطط'};
export const colors:Record<string,string>={confirmed:'blue',waiting:'orange',active:'teal',done:'teal',cancelled:'gray',missed:'red',planned:'purple'};
export const treatmentTypes=['فحص ومراجعة','تنظيف الأسنان','حشوة تجميلية','علاج عصب','تلبيسة','خلع','زراعة','تقويم','تبييض','علاج آخر'];
export function patientBalance(data:Data,id:string){return data.treatments.filter(t=>t.patient_id===id&&t.status!=='cancelled'&&t.cost_known!==0).reduce((s,t)=>s+t.cost,0)-data.ledger.filter(l=>l.patient_id===id&&l.kind==='payment').reduce((s,l)=>s+l.amount,0)}

export function appointmentStatus(status:string):'scheduled'|'postponed'|'done'|'cancelled'{return status==='done'?'done':['cancelled','missed'].includes(status)?'cancelled':status==='postponed'?'postponed':'scheduled'}
