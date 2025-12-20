'use client';
import { AppProvider } from '@/contexts/AppContext';
import type { ReactNode } from 'react';

export function InterestHubApp({ children, interestId, topicId }: { children: ReactNode, interestId?: string | null, topicId?: string | null }) {
  return (
    <AppProvider interestId={interestId} topicId={topicId}>
      {children}
    </AppProvider>
  );
}
