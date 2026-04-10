'use client';
import { AppProvider } from '@/contexts/AppContext';
import { DataProvider } from '@/contexts/DataContext';
import { UIProvider } from '@/contexts/UIContext';
import type { ReactNode } from 'react';

export function InterestHubApp({ children }: { children: ReactNode }) {
  return (
    <UIProvider>
      <DataProvider>
        <AppProvider>
          {children}
        </AppProvider>
      </DataProvider>
    </UIProvider>
  );
}
