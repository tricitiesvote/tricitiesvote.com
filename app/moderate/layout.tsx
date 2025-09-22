import type { ReactNode } from 'react';
import { inter } from '@/lib/fonts';

export default function ModerateLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${inter.className} bg-slate-100 text-slate-900 min-h-screen`}>{children}</div>
  );
}
