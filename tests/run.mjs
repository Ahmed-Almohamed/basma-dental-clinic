import {spawnSync} from 'node:child_process';
for(const file of ['verify-appointment-slots.mjs','verify-clinic.mjs','verify-simple-appointments.mjs','verify-sessions-and-queue.mjs','verify-unified-booking.mjs','verify-treatment-plans.mjs','verify-release.mjs','verify-first-login.mjs']){const r=spawnSync(process.execPath,['tests/'+file],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1)}


