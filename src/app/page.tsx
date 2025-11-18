'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { InterestHubApp } from '@/components/InterestHubApp';

export default function AppPage() {
  return (
    <AuthGuard>
      <InterestHubApp />
    </AuthGuard>
  );
}
