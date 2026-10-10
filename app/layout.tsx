import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'بسمة | إدارة عيادة الأسنان', description:'مواعيدك ومرضاك وعلاجاتك، في مكان واحد.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ar" dir="rtl"><head><link rel="preload" href="/fonts/IBMPlexSansArabic-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous" /></head><body>{children}</body></html>}
