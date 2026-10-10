'use client';
import {useState} from 'react';
import {CalendarDays,Check,ChevronLeft,ChevronRight,Clock3,LockKeyhole} from 'lucide-react';
import {Row,today,dateLabel} from './model';
import {addDays,slotAvailable,slotConflict,timeAt,minutes} from './appointment-slots';

type Props={date:string;time:string;duration:number;appointments:Row[];excludeId?:string;disabled?:boolean;onChange:(date:string,time:string)=>void};
export default function AppointmentPicker({date,time,duration,appointments,excludeId,disabled,onChange}:Props){
 const [week,setWeek]=useState(date||today()),[allHours,setAllHours]=useState(false);
 const bookings=appointments as Parameters<typeof slotAvailable>[0];
 const selected=slotAvailable(bookings,date,time,duration,excludeId);
 const days=Array.from({length:7},(_,i)=>addDays(week,i));
 const groups=allHours?[['بداية اليوم',0,9],['صباحاً',9,12],['بعد الظهر',12,17],['مساءً',17,21],['نهاية اليوم',21,24]] as const:[['صباحاً',9,12],['بعد الظهر',12,17],['مساءً',17,21]] as const;
 function chooseDate(value:string){if(value){onChange(value,'');if(!days.includes(value))setWeek(value)}}
 return <div className="appointment-picker full">
  <div className="picker-section-title"><span>١</span><h3>اختر اليوم</h3><label className="other-date"><CalendarDays size={16}/><span>تاريخ آخر</span><input aria-label="اختيار تاريخ آخر" type="date" value={date} onChange={e=>chooseDate(e.target.value)} disabled={disabled}/></label></div>
  <div className="booking-week"><button type="button" className="week-arrow" aria-label="الأسبوع السابق" disabled={disabled} onClick={()=>setWeek(addDays(week,-7))}><ChevronRight size={19}/></button><div className="booking-days">{days.map(d=><button key={d} type="button" disabled={disabled} className={'booking-day '+(date===d?'selected':'')} aria-pressed={date===d} aria-label={dateLabel(d)} onClick={()=>chooseDate(d)}><small>{d===today()?'اليوم':new Intl.DateTimeFormat('ar-SY',{weekday:'short',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'))}</small><b>{Number(d.slice(8))}</b><small>{new Intl.DateTimeFormat('ar-SY',{month:'short',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'))}</small></button>)}</div><button type="button" className="week-arrow" aria-label="الأسبوع القادم" disabled={disabled} onClick={()=>setWeek(addDays(week,7))}><ChevronLeft size={19}/></button></div>
  <div className="picker-section-title time-title"><span>٢</span><h3>اختر الوقت</h3><div className="slot-legend"><i/> متاح <i className="occupied"/> محجوز</div></div>
  <p className="selected-day-label">{date&&dateLabel(date)} <button type="button" onClick={()=>{setWeek(today());chooseDate(today())}} disabled={disabled}>العودة لليوم</button></p>
  <div className="slot-groups" aria-busy={disabled}>{groups.map(([label,start,end])=><section className="slot-group" key={label}><h4>{label}</h4><div className="time-slots">{Array.from({length:(end-start)*2},(_,i)=>timeAt(start*60+i*30)).map(t=>{const occupied=!!slotConflict(bookings,date,t,duration,excludeId),outside=minutes(t)+duration>1440;return <button key={t} type="button" disabled={disabled||occupied||outside} className={'time-slot '+(occupied?'booked ':outside?'unavailable ':'')+(selected&&time===t?'selected':'')} aria-label={t+'، '+(occupied?'محجوز':outside?'غير متاح':'متاح')} aria-pressed={selected&&time===t} onClick={()=>onChange(date,t)}><b dir="ltr">{t}</b><small>{occupied?<><LockKeyhole size={11}/> محجوز</>:outside?'غير متاح':time===t?<><Check size={12}/> اختيارك</>:'متاح'}</small></button>})}</div></section>)}</div>
  <button type="button" className="all-hours" onClick={()=>setAllHours(!allHours)}>{allHours?'عرض الأوقات المعتادة':'عرض جميع ساعات اليوم'}</button>
  <div className={'booking-selection '+(selected?'ready':'')} aria-live="polite"><Clock3 size={19}/>{disabled?'جارٍ تحديث الأوقات...':selected?<span>الموعد المختار: <strong>{dateLabel(date)} · <b dir="ltr">{time}</b></strong></span>:time?'هذا الوقت لم يعد متاحاً، اختر وقتاً آخر.':'اضغط على وقت متاح لتحديد الموعد.'}</div>
 </div>
}
