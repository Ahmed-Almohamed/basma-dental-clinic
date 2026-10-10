'use client';
import {useState} from 'react';
import DentalChart,{toothLabel} from './dental-chart';
import {Row} from './model';

export const sessionTypes=['فحص واستشارة','حشوة','علاج عصب','خلع','تنظيف الأسنان','تركيب تاج أو جسر','زراعة','تقويم','متابعة'];
export function sessionToothLabel(tooth?:string){return tooth==='general'?'جلسة عامة':tooth?`السن ${tooth} · ${toothLabel(tooth)}`:'السن غير محدد';}
export default function BookingSession({value,onChange,treatments=[]}:{value:Row;onChange:(patch:Row)=>void;treatments?:Row[]}){
 const [chart,setChart]=useState(false),[primary,setPrimary]=useState(Number(value.tooth?.[0])>4);
 const custom=value._customType||Boolean(value.type&&!sessionTypes.includes(value.type));
 return <section className="booking-session full" aria-label="تفاصيل الجلسة">
  <h3>تفاصيل الجلسة</h3>
  <label><span>نوع الجلسة <b className="required">*</b></span><select required aria-label="نوع الجلسة" value={custom?'other':value.type||''} onChange={e=>onChange({type:e.target.value==='other'?'':e.target.value,_customType:e.target.value==='other'})}><option value="" disabled>اختر نوع الجلسة</option>{sessionTypes.map(t=><option key={t}>{t}</option>)}<option value="other">جلسة أخرى</option></select></label>
  {custom&&<label><span>اسم الجلسة <b className="required">*</b></span><input required maxLength={160} value={value.type||''} onChange={e=>onChange({type:e.target.value})} placeholder="اكتب نوع الجلسة"/></label>}
  <div className="booking-tooth"><span>السن أو الضرس <b className="required">*</b></span><div className="booking-tooth-actions"><button type="button" className={value.tooth&&value.tooth!=='general'?'primary':'subtle'} aria-expanded={chart} onClick={()=>setChart(!chart)}>{value.tooth&&value.tooth!=='general'?`السن ${value.tooth} · تغيير`:'اختيار من مخطط الأسنان'}</button><button type="button" className={value.tooth==='general'?'primary':'subtle'} aria-pressed={value.tooth==='general'} onClick={()=>{onChange({tooth:'general'});setChart(false)}}>جلسة عامة</button></div>{value.tooth?<p className="selected-tooth-label" aria-live="polite">{sessionToothLabel(value.tooth)}</p>:<p className="form-hint">اختر السن، أو «جلسة عامة» إذا لم تكن خاصة بسن معيّن.</p>}</div>
  {chart&&<DentalChart compact primaryTeeth={primary} onPrimaryChange={setPrimary} treatments={treatments} selectedTooth={value.tooth==='general'?'':value.tooth||''} onSelect={tooth=>{onChange({tooth});setChart(false)}}/>}
 </section>;
}
