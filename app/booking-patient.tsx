'use client';
import {Check, Search, UserPlus, X} from 'lucide-react';
import {Row} from './model';

export function normalizePatientSearch(value:string){return value.normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).toLowerCase().trim()}
export function patientSuggestions(patients:Row[],query:string){const term=normalizePatientSearch(query);if(!term)return [];return patients.filter(p=>normalizePatientSearch(p.name).includes(term)||(!!term.replace(/[\s()-]/g,'')&&normalizePatientSearch(p.phone||'').replace(/[\s()-]/g,'').includes(term.replace(/[\s()-]/g,'')))).slice(0,6)}

export default function BookingPatient({patients,value,onChange,disabled}:{patients:Row[];value:Row;onChange:(patch:Row)=>void;disabled:boolean}){
 const selected=patients.find(p=>p.id===value.patient_id),query=value._patientName||'',matches=patientSuggestions(patients,query);
 if(selected)return <section className="booking-person full" aria-label="المريض المختار"><div className="booking-person-selected"><span className="patient-avatar">{selected.name[0]}</span><div><strong>{selected.name}</strong><small>{selected.phone||'ملف موجود في العيادة'}</small></div><Check size={18}/><button type="button" className="text-button" disabled={disabled} onClick={()=>onChange({patient_id:'',_patientName:'',_patientPhone:'',_newConfirmed:false})}>تغيير المريض <X size={15}/></button></div>{selected.allergies&&<p className="booking-allergy">حساسية: {selected.allergies}</p>}</section>;
 return <section className="booking-person full" aria-label="بيانات المريض للحجز">
  <label htmlFor="booking-patient-name"><span>اسم المريض <b className="required">*</b></span></label>
  <div className="booking-name-input"><Search size={18}/><input id="booking-patient-name" autoComplete="off" value={query} maxLength={160} required minLength={2} disabled={disabled} placeholder="اكتب الاسم، أو ابحث برقم الهاتف" aria-describedby="booking-patient-hint" onChange={e=>onChange({_patientName:e.target.value,_newConfirmed:false,patient_id:''})}/></div>
  <p id="booking-patient-hint" className="booking-person-hint">اختر ملفاً موجوداً، أو اكتب اسم مريض جديد واحجز له مباشرة.</p>
  {matches.length>0&&!value._newConfirmed&&<div className="booking-suggestions" aria-label="مرضى مقترحون"><small>ملفات مطابقة — هل تقصد أحدهم؟</small>{matches.map(p=><button type="button" key={p.id} disabled={disabled} onClick={()=>onChange({patient_id:p.id,_patientName:p.name,_newConfirmed:false})}><span className="patient-avatar">{p.name[0]}</span><span><strong>{p.name}</strong><small>{p.phone||'بدون رقم هاتف'}{p.birth_date?' · '+p.birth_date:''}</small></span><span className="choose-patient">اختيار</span></button>)}<button type="button" className="create-patient-choice" disabled={disabled} onClick={()=>onChange({_newConfirmed:true})}><UserPlus size={17}/> شخص آخر؟ سجّله كمريض جديد</button></div>}
  {(!matches.length||value._newConfirmed)&&<><label className="booking-phone"><span>رقم الهاتف <small className="optional-label">اختياري</small></span><input type="tel" autoComplete="tel" dir="ltr" value={value._patientPhone||''} maxLength={30} disabled={disabled} placeholder="09xxxxxxxx" onChange={e=>onChange({_patientPhone:e.target.value})}/></label>{query.trim().length>=2&&<p className="booking-new-hint"><UserPlus size={15}/> ينحفظ ملف المريض مع الموعد، بخطوة واحدة.</p>}</>}
 </section>;
}
