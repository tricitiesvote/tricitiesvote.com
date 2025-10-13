import type { ReactNode } from 'react';
import { inter } from '@/lib/fonts';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`admin-wrapper ${inter.className} bg-slate-100 text-slate-900 min-h-screen`}>{children}</div>
  );
}
