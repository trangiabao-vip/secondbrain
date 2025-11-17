'use client';
import { AppProvider } from '@/contexts/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';

export function InterestHubApp() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}
