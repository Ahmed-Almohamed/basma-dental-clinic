import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {readSession} from '../auth';
import LoginForm from '../login/login-form';
export const dynamic='force-dynamic';
export default async function Page(){const h=await headers(),user=await readSession(h.get('cookie')||'');if(!user)redirect('/login');return <LoginForm change username={user.username} required={!!user.mustChange}/>;}

