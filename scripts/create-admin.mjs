import {createInterface} from 'node:readline/promises';
import {Writable} from 'node:stream';
import {randomBytes,pbkdf2Sync} from 'node:crypto';
import {mkdtempSync,writeFileSync,unlinkSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const mode=process.argv[2];if(!['--local','--remote'].includes(mode))throw Error('Choose --local or --remote explicitly. Apply migrations first.');
let muted=false;const output=new Writable({write(chunk,encoding,next){if(!muted)process.stdout.write(chunk);next()}});const rl=createInterface({input:process.stdin,output,terminal:true});
const username=(await rl.question('Username: ')).trim();process.stdout.write('Initial password (hidden; 12+ characters): ');muted=true;const password=await rl.question('');muted=false;process.stdout.write('\n');rl.close();if(username.length<3||username.length>80||password.length<12||password.length>128)throw Error('Invalid username or password length.');
const salt=randomBytes(16).toString('hex'),hash=salt+':'+pbkdf2Sync(password,salt,100000,32,'sha256').toString('hex'),q=v=>"'"+v.replaceAll("'","''")+"'";
const directory=mkdtempSync(join(tmpdir(),'basma-admin-')),file=join(directory,'account.sql');try{writeFileSync(file,"INSERT INTO auth_accounts (id,username,password_hash,must_change) VALUES ('clinic',"+q(username)+','+q(hash)+",1);",{mode:0o600});const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB',mode,'--file',file],{stdio:'inherit'});process.exitCode=r.status||0;}finally{unlinkSync(file);rmdirSync(directory)}

