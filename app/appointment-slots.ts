type Booking={id?:string;date:string;time:string;duration?:number;status:string};
export const minutes=(time:string)=>Number(time.slice(0,2))*60+Number(time.slice(3));
export const timeAt=(minute:number)=>`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
export function slotConflict(bookings:Booking[],date:string,time:string,duration=30,excludeId?:string){
 return bookings.find(a=>a.id!==excludeId&&a.date===date&&!['cancelled','missed'].includes(a.status)&&minutes(a.time)<minutes(time)+duration&&minutes(a.time)+(a.duration||30)>minutes(time));
}
export function slotAvailable(bookings:Booking[],date:string,time:string,duration=30,excludeId?:string){
 return /^\d{4}-\d{2}-\d{2}$/.test(date)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(time)&&minutes(time)+duration<=1440&&!slotConflict(bookings,date,time,duration,excludeId);
}
export function addDays(date:string,days:number){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
