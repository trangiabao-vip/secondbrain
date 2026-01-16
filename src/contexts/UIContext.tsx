'use client';

import { createContext, useContext, ReactNode, useState, useMemo } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';

interface ItemToOpen {
  type: 'goal' | 'task';
  id: string;
  goalId?: string | null;
}

export interface UIContextType {
  interestId: string | null;
  topicId: string | null;
  pathname: string;
  itemToAutoOpen: ItemToOpen | null;
  setItemToAutoOpen: (item: ItemToOpen | null) => void;
  selectInterest: (id: string | null) => void;
  selectTopic: (id: string | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const interestId = (params.interestId as string) || null;
  const topicId = (params.topicId as string) || null;

  const [itemToAutoOpen, setItemToAutoOpen] = useState<ItemToOpen | null>(null);
  
  const selectInterest = (id: string | null) => {
    if (id === null) {
      router.push('/dashboard');
    } else {
      router.push(`/interests/${id}`);
    }
  };

  const selectTopic = (id: string | null) => {
    if (id === null) {
      if (interestId) {
        router.push(`/interests/${interestId}`);
      } else {
        router.push('/dashboard');
      }
    } else {
      // We need the interest ID for the topic to construct the URL
      // This is a limitation: we assume the caller is in a context where this is possible
      // or the data is available elsewhere to find the topic's interestId.
      // For now, we'll rely on the current interestId from the URL.
      if (interestId) {
        router.push(`/interests/${interestId}/${id}`);
      }
    }
  };

  const value = useMemo(() => ({
    interestId,
    topicId,
    pathname,
    itemToAutoOpen,
    setItemToAutoOpen,
    selectInterest,
    selectTopic,
  }), [interestId, topicId, pathname, itemToAutoOpen]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUIContext() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
}
