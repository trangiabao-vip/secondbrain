'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AppPage() {
  
  return (
    <AuthGuard>
       <div />
    </AuthGuard>
  );
}
