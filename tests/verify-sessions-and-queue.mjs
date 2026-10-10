import {testCookie} from './test-session.mjs';
import assert from 'node:assert/strict';
import {sortQueue,moveInQueue} from '../app/appointment-queue.ts';
const base='http://127.0.0.1:5173';
const cookie=await testCookie();
async function call(entity,data,id){const r=await fetch(base+'/api/clinic',{method:'POST',headers:{Origin:base,cookie,'Content-Type':'application/json'},body:JSON.stringify({entity,data,id})});return {status:r.status,data:await r.json()};}
const read=async()=>await (await fetch(base+'/api/clinic',{headers:{Origin:base,cookie}})).json();
const p=await call('patients',{name:'اختبار جلسة محلي '+Date.now(),phone:'',birth_date:'',gender:'',allergies:'',history:'',notes:''});assert.equal(p.status,200);
const date=`${2700+Math.floor(Math.random()*1000)}-02-01`,patient_id=p.data.id;
const records=[];for(const time of ['10:00','11:00','12:00']){const data={patient_id,date,time,status:'confirmed',notes:'تفاصيل حرة'};const r=await call('appointments',data);assert.equal(r.status,200,JSON.stringify(r));records.push({...data,id:r.data.id})}
let ids=records.map(a=>a.id);ids=moveInQueue(ids,ids[2],ids[0]);assert.equal(ids[0],records[2].id);
assert.equal((await call('reorder_appointments',{date,ids})).status,200);
let data=await read(),day=data.appointments.filter(a=>a.date===date);assert.deepEqual(sortQueue(day).map(a=>a.id),ids);for(const a of records)assert.equal(day.find(r=>r.id===a.id).time,a.time,'drag never changes booked time');
assert.equal((await call('reorder_appointments',{date,ids:[ids[0],ids[0],ids[1]]})).status,400);
assert.equal((await call('reorder_appointments',{date,ids:ids.slice(0,2)})).status,409);
assert.equal((await call('reorder_appointments',{date,ids:[ids[0],ids[1],'foreign-id']})).status,409);
const complete={appointment_id:records[0].id,amount:100000,method:'cash',outcome:'followup'};
const completed=await Promise.all([call('complete_session',complete),call('complete_session',complete)]);assert(completed.every(r=>r.status===200),JSON.stringify(completed));
data=await read();const a=data.appointments.find(a=>a.id===records[0].id);assert.equal(a.status,'done');assert.equal(a.completion_outcome,'followup');assert(a.completed_at);
const payments=data.ledger.filter(l=>l.id==='session:'+records[0].id);assert.equal(payments.length,1);assert.equal(payments[0].amount,100000);assert.equal(payments[0].patient_id,patient_id);
assert.equal((await call('complete_session',{...complete,amount:200000})).status,409,'cannot change a completed receipt by retry');
assert.equal((await call('appointments',{...a,status:'cancelled'},a.id)).status,409,'finalized session cannot be cancelled');
assert.equal((await call('complete_session',{appointment_id:records[1].id,amount:0,method:'cash',outcome:'finished'})).status,200);
assert.equal((await call('appointments',{...records[2],status:'cancelled'},records[2].id)).status,200);
assert.equal((await call('complete_session',{...complete,appointment_id:records[2].id})).status,409);
assert.equal((await call('complete_session',{...complete,appointment_id:'not-owned'})).status,404);
data=await read();assert.equal(data.ledger.filter(l=>l.patient_id===patient_id).length,1,'no payment for zero amount or cancelled session');assert.equal(data.appointments.find(a=>a.id===records[1].id).completion_outcome,'finished');
console.log('PASS: persisted queue order, unchanged booking times, stale/invalid reorder rejection, atomic completion and receipt, concurrent duplicate prevention, zero-payment finish, cancelled/foreign appointment rejection, and finalized-session protection. Synthetic local data only.');
