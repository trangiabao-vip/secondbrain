'use client';
import { AppProvider } from '@/contexts/AppContext';
import type { ReactNode } from 'react';

export function InterestHubApp({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
}
