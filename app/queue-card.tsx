'use client';
import {ReactNode,useRef,useState} from 'react';
import {GripVertical,ArrowUp,ArrowDown} from 'lucide-react';
type Props={id:string;name:string;className:string;enabled:boolean;busy:boolean;position:number;previous?:string;next?:string;onMove:(from:string,to:string)=>void;children:ReactNode};
export default function QueueCard({id,name,className,enabled,busy,position,previous,next,onMove,children}:Props){
 const [dragging,setDragging]=useState(false),[over,setOver]=useState(false);const origin=useRef<{x:number;y:number}|null>(null);
 return <article className={className+(dragging?' dragging':'')+(over?' drop-target':'')} data-queue-id={id} aria-label={name}
 draggable={enabled&&!busy} onDragStart={e=>{e.dataTransfer.setData('application/x-basma-appointment',id);e.dataTransfer.effectAllowed='move';setDragging(true)}} onDragEnd={()=>{setDragging(false);setOver(false)}}
 onDragOver={e=>{if(enabled&&!busy&&e.dataTransfer.types.includes('application/x-basma-appointment')){e.preventDefault();e.dataTransfer.dropEffect='move';setOver(true)}}} onDragLeave={()=>setOver(false)}
 onDrop={e=>{e.preventDefault();setOver(false);const from=e.dataTransfer.getData('application/x-basma-appointment');if(enabled&&!busy&&from&&from!==id)onMove(from,id)}}>
 {enabled&&<div className="queue-controls"><span>الدور {position}</span><div><button className="queue-handle" type="button" aria-label={'اسحب لتغيير دور '+name} disabled={busy}
 draggable={false} onDragStart={e=>e.preventDefault()} onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();origin.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);setDragging(true)}}
 onPointerMove={e=>{if(origin.current){e.preventDefault();if(e.clientY<100)window.scrollBy(0,-12);else if(e.clientY>window.innerHeight-100)window.scrollBy(0,12)}}}
 onPointerUp={e=>{const start=origin.current;origin.current=null;setDragging(false);if(!start)return;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-queue-id]')?.getAttribute('data-queue-id');if(target&&target!==id&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>8)onMove(id,target)}}
 onPointerCancel={()=>{origin.current=null;setDragging(false)}}><GripVertical size={17}/><span>اسحب</span></button><button type="button" className="queue-arrow" disabled={busy||!previous} aria-label={'تقديم دور '+name} onClick={()=>previous&&onMove(id,previous)}><ArrowUp size={14}/></button><button type="button" className="queue-arrow" disabled={busy||!next} aria-label={'تأخير دور '+name} onClick={()=>next&&onMove(id,next)}><ArrowDown size={14}/></button></div></div>}
 {children}</article>
}
