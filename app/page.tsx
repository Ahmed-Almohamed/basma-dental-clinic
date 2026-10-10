import Clinic from './clinic';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {readSession} from './auth';
export const dynamic='force-dynamic';
export default async function Home(){const h=await headers(),user=await readSession(h.get('cookie')||'');if(!user)redirect('/login');if(user.mustChange)redirect('/account');return <Clinic/>;}

