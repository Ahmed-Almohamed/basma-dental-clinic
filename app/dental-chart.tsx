'use client';
import {useId,useState,KeyboardEvent} from 'react';
import {Row,statuses} from './model';

export function toothLabel(value:string){
 if(!value)return 'علاج عام';
 const q=Number(value[0]),n=Number(value[1]),primary=q>4;
 const names=primary?['','القاطع الأوسط','القاطع الجانبي','الناب','الضرس الأول','الضرس الثاني']:['','القاطع الأوسط','القاطع الجانبي','الناب','الضاحك الأول','الضاحك الثاني','الضرس الأول','الضرس الثاني','ضرس العقل'];
 const upper=[1,2,5,6].includes(q),right=[1,4,5,8].includes(q);
 return `${names[n]||'السن'} · ${upper?'علوي':'سفلي'} ${right?'يمين':'يسار'}${primary?' · لبني':''}`;
}
// Occlusal FDI positions: patient right is viewer left in both jaws.
const permanent=[{x:153,y:57,r:-8},{x:121,y:68,r:-28},{x:96,y:91,r:-43},{x:79,y:123,r:-62},{x:73,y:159,r:-79},{x:71,y:199,r:-88},{x:72,y:242,r:-90},{x:75,y:284,r:-88}];
const primary=[{x:151,y:61,r:-9},{x:114,y:77,r:-32},{x:88,y:110,r:-62},{x:73,y:158,r:-86},{x:75,y:216,r:-90}];
const crown={
 incisor:'M-13 -12 Q0 -16 13 -12 L14 4 Q13 13 0 15 Q-13 13 -14 4 Z',
 canine:'M-12 -10 Q-7 -17 0 -17 Q7 -17 12 -10 L14 2 Q12 10 0 16 Q-12 10 -14 2 Z',
 premolar:'M-13 -12 Q-7 -17 0 -14 Q8 -17 14 -9 Q18 0 13 11 Q7 17 0 14 Q-9 17 -14 9 Q-18 0 -13 -12 Z',
 molar:'M-16 -12 Q-11 -19 -3 -15 Q6 -19 14 -13 Q21 -8 17 0 Q21 10 12 15 Q4 19 -3 15 Q-13 19 -17 10 Q-21 1 -16 -4 Q-19 -8 -16 -12 Z'
};
export default function DentalChart({treatments=[],primaryTeeth=false,onPrimaryChange,onSelect,selectedTooth='',compact=false}:{treatments?:Row[];primaryTeeth?:boolean;onPrimaryChange:(value:boolean)=>void;onSelect:(value:string)=>void;selectedTooth?:string;compact?:boolean}){
 const unique=useId().replace(/:/g,'');
 const [numbers,setNumbers]=useState(false),[hover,setHover]=useState('');
 const all=primaryTeeth?primary:permanent;
 function keyAction(event:KeyboardEvent<SVGGElement>,tooth:string){
  if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(tooth);return;}
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)){
   event.preventDefault();const groups=Array.from(event.currentTarget.ownerSVGElement!.querySelectorAll<SVGGElement>('[role="button"]'));
   const current=groups.indexOf(event.currentTarget),delta=['ArrowLeft','ArrowUp'].includes(event.key)?-1:1;
   groups[event.key==='Home'?0:event.key==='End'?groups.length-1:(current+delta+groups.length)%groups.length]?.focus();
  }
 }
 return <div className={'dental-model '+(compact?'compact-model':'')}>
  <div className="dental-controls"><div className="dentition-switch" role="group" aria-label="نوع الأسنان"><button type="button" aria-pressed={!primaryTeeth} className={!primaryTeeth?'chosen':''} onClick={()=>onPrimaryChange(false)}>دائمة</button><button type="button" aria-pressed={primaryTeeth} className={primaryTeeth?'chosen':''} onClick={()=>onPrimaryChange(true)}>لبنية</button></div><label className="number-toggle"><input type="checkbox" checked={numbers} onChange={e=>setNumbers(e.target.checked)}/> أرقام الأسنان</label></div>
  <div className="jaw-pair">
   {(['upper','lower'] as const).map(jaw=>{
    const upper=jaw==='upper',id=`${unique}-${jaw}`;
    const active=hover||selectedTooth;
    const belongs=active&&([1,2,5,6].includes(Number(active[0]))===upper);
    return <section className="jaw-card" key={jaw} aria-label={upper?'الفك العلوي':'الفك السفلي'}>
     <h3>{upper?'الفك العلوي':'الفك السفلي'}</h3>
     <div className="jaw-directions"><span>يمين المريض</span><span>يسار المريض</span></div>
     <svg viewBox="0 0 340 340" className="jaw-svg" role="group" aria-label={`${upper?'الفك العلوي':'الفك السفلي'}، ${primaryTeeth?'10':'16'} أسنان قابلة للاختيار`}>
      <defs>
       <linearGradient id={`${id}-gum`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f4d9d8"/><stop offset=".32" stopColor="#e9b8b7"/><stop offset=".7" stopColor="#dfa7a7"/><stop offset="1" stopColor="#bd858b"/></linearGradient>
       <linearGradient id={`${id}-enamel`} x1=".2" y1="0" x2=".85" y2="1"><stop stopColor="#ffffff"/><stop offset=".5" stopColor="#fdfcf7"/><stop offset="1" stopColor="#d9d9cd"/></linearGradient>
       <radialGradient id={`${id}-cusp`} cx=".35" cy=".28" r=".8"><stop stopColor="#fff"/><stop offset=".6" stopColor="#f5f3e9"/><stop offset="1" stopColor="#dbdad0"/></radialGradient>
       <radialGradient id={`${id}-palate`}><stop stopColor="#f7e7e3"/><stop offset="1" stopColor="#e8c4c0"/></radialGradient>
       <filter id={`${id}-shadow`} x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#805d62" floodOpacity=".22"/></filter>
       <filter id={`${id}-jaw-shadow`} x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#907678" floodOpacity=".15"/></filter>
      </defs>
      <g transform={(upper?'':'translate(0 340) scale(1 -1) ')+(primaryTeeth?'translate(0 14) scale(1 .82)':'')} aria-hidden="true">
       <path d="M45 285 C38 215 38 104 94 49 C115 26 144 17 170 17 C196 17 225 26 246 49 C302 104 302 215 295 285 Q293 313 269 310 Q243 307 242 279 C249 171 246 123 215 98 C186 73 154 73 125 98 C94 123 91 171 98 279 Q97 307 71 310 Q47 313 45 285Z" fill={`url(#${id}-gum)`} stroke="#c49498" strokeWidth="1.3" filter={`url(#${id}-jaw-shadow)`}/>
       {upper&&<><path d="M104 276 C99 182 100 132 132 106 Q170 76 208 106 C240 132 241 182 236 276 Q170 291 104 276Z" fill={`url(#${id}-palate)`}/><path d="M170 103 Q166 169 170 249 M145 111 Q157 118 169 119 M136 123 Q154 130 169 131 M195 111 Q183 118 171 119 M204 123 Q186 130 171 131" fill="none" stroke="#d8aaa9" strokeWidth="1.5" opacity=".45"/></>}
       <path d="M51 281 C45 149 60 52 138 31 Q170 20 202 31 C280 52 295 149 289 281" fill="none" stroke="#ffece6" strokeWidth="3" opacity=".65"/>
      </g>
      {([0,1] as const).flatMap(side=>all.map((pos,i)=>{
       const quadrant=primaryTeeth?(upper?(side?6:5):(side?7:8)):(upper?(side?2:1):(side?3:4));
       const tooth=String(quadrant*10+i+1),x=side?340-pos.x:pos.x,y=upper?pos.y:340-pos.y;
       const type=i<2?'incisor':i===2?'canine':(!primaryTeeth&&i<5)?'premolar':'molar';
       const t=treatments.filter(t=>t.tooth===tooth&&t.status!=='cancelled');
       const state=t.some(t=>t.status==='active')?'active':t.some(t=>t.status==='planned')?'planned':t.length?'done':'';
       const stateColor=state==='active'?'#bd882d':state==='planned'?'#9981bb':state==='done'?'#3b9c87':'transparent';
       const rotation=(side?-pos.r:pos.r)*(upper?1:-1)+(upper?0:180);
       return <g key={tooth} className={'crown-button '+(selectedTooth===tooth?'is-selected':'')} role="button" tabIndex={0} aria-label={`السن ${tooth}، ${toothLabel(tooth)}${state?'، '+statuses[state]:''}`} aria-pressed={selectedTooth===tooth} onClick={()=>onSelect(tooth)} onKeyDown={e=>keyAction(e,tooth)} onMouseEnter={()=>setHover(tooth)} onMouseLeave={()=>setHover('')} onFocus={()=>setHover(tooth)} onBlur={()=>setHover('')} transform={`translate(${x} ${y})`}>
        <title>{toothLabel(tooth)} · {tooth}{state?' · '+statuses[state]:''}</title>
        <g transform={`rotate(${rotation}) scale(${primaryTeeth?(type==='molar'?1.45:1.12):1})`} filter={`url(#${id}-shadow)`}>
         <path d={crown[type]} transform="translate(0 4)" fill="#c4c5b8" stroke="#bfc0b3" strokeWidth="1"/>
         <path d={crown[type]} fill={`url(#${id}-enamel)`} stroke="#c6c8bd" strokeWidth=".9"/>
         {type==='molar'||type==='premolar'?<><ellipse cx="-7" cy="-6" rx="7" ry="7.7" fill={`url(#${id}-cusp)`}/><ellipse cx="7" cy="-6" rx="6.4" ry="7.2" fill={`url(#${id}-cusp)`}/><ellipse cx="-6" cy="7" rx="7" ry="6.5" fill={`url(#${id}-cusp)`}/><ellipse cx="7" cy="6" rx="6" ry="7" fill={`url(#${id}-cusp)`}/><path d="M-10 -2 Q-3 2 0 -3 Q3 2 10 0 M0 -10 Q-3 -3 0 1 Q3 7 0 11" fill="none" stroke="#bcbeb1" strokeWidth="1" opacity=".65"/></>:<><path d="M-9 -8 Q0 -11 9 -8" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"/><path d={type==='canine'?'M-7 5 Q0 -8 7 5':'M-9 5 Q0 10 9 5'} fill="none" stroke="#dedfd3" strokeWidth="1.3"/></>}
         <path className="crown-outline" d={crown[type]} fill="transparent" stroke={stateColor} strokeWidth={state?'2.5':'0'}/>
        </g>
        {numbers&&<text className="tooth-number" y="4" textAnchor="middle" aria-hidden="true">{tooth}</text>}
        {state&&!numbers&&<circle cx={side?24:-24} cy="0" r="3" fill={stateColor} aria-hidden="true"/>}
       </g>;
      }))}
      <g pointerEvents="none" aria-hidden="true"><text x="170" y={upper?188:163} textAnchor="middle" className="jaw-center-number">{belongs?active:''}</text><text x="170" y={upper?211:187} textAnchor="middle" className="jaw-center-hint">{belongs?toothLabel(active).split(' · ')[0]:'اختر السن'}</text></g>
     </svg>
    </section>;
   })}
  </div>
  {!compact&&<div className="dental-legend"><span><i className="planned"/> مخطط</span><span><i className="active"/> قيد العلاج</span><span><i className="done"/> مكتمل</span></div>}
 </div>;
}
