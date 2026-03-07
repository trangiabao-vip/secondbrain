
'use client';

import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { type Interest, type Topic, type Goal, type Task, type WikiPage, type SalesPage, type Channel, type Notification } from '@/lib/data';

export interface DataContextType {
  interests: Interest[];
  topics: Topic[];
  goals: Goal[];
  tasks: Task[];
  wikiPages: WikiPage[];
  salesPages: SalesPage[];
  channels: Channel[];
  notifications: Notification[];
  isDataLoading: boolean;
  optimisticallyDeleted: string[];
  setOptimisticallyDeleted: React.Dispatch<React.SetStateAction<string[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { firestore, user, isUserLoading } = useFirebase();

  const interestsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'interests'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const topicsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'topics'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const goalsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'goals'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const tasksQuery = useMemoFirebase(() => user ? query(collection(firestore, 'tasks'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const wikiPagesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'wikiPages'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const salesPagesQuery = useMemoFirebase(() => user ? query(collection(firestore, 'salesPages'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const channelsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'channels'), where('userId', '==', user.uid)) : null, [firestore, user]);
  const notificationsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'notifications'), where('userId', '==', user.uid)) : null, [firestore, user]);

  const { data: interestsData, isLoading: interestsLoading } = useCollection<Interest>(interestsQuery);
  const { data: topicsData, isLoading: topicsLoading } = useCollection<Topic>(topicsQuery);
  const { data: goalsData, isLoading: goalsLoading } = useCollection<Goal>(goalsQuery);
  const { data: tasksData, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
  const { data: wikiPagesData, isLoading: wikiPagesLoading } = useCollection<WikiPage>(wikiPagesQuery);
  const { data: salesPagesData, isLoading: salesPagesLoading } = useCollection<SalesPage>(salesPagesQuery);
  const { data: channelsData, isLoading: channelsLoading } = useCollection<Channel>(channelsQuery);
  const { data: notificationsData, isLoading: notificationsLoading } = useCollection<Notification>(notificationsQuery);
  
  const [optimisticallyDeleted, setOptimisticallyDeleted] = useState<string[]>([]);
  
  const isDataLoading = useMemo(() => {
    return isUserLoading || interestsLoading || topicsLoading || goalsLoading || tasksLoading || wikiPagesLoading || salesPagesLoading || channelsLoading || notificationsLoading;
  }, [isUserLoading, interestsLoading, topicsLoading, goalsLoading, tasksLoading, wikiPagesLoading, salesPagesLoading, channelsLoading, notificationsLoading]);
  
  const interests = useMemo(() => (interestsData || []).filter(i => !optimisticallyDeleted.includes(i.id)), [interestsData, optimisticallyDeleted]);
  const topics = useMemo(() => (topicsData || []).filter(t => !optimisticallyDeleted.includes(t.id)), [topicsData, optimisticallyDeleted]);
  const goals = useMemo(() => (goalsData || []).filter(g => !optimisticallyDeleted.includes(g.id)), [goalsData, optimisticallyDeleted]);
  const tasks = useMemo(() => (tasksData || []).filter(t => !optimisticallyDeleted.includes(t.id)), [tasksData, optimisticallyDeleted]);
  const wikiPages = useMemo(() => (wikiPagesData || []).filter(wp => !optimisticallyDeleted.includes(wp.id)), [wikiPagesData, optimisticallyDeleted]);
  const salesPages = useMemo(() => (salesPagesData || []).filter(p => !optimisticallyDeleted.includes(p.id)), [salesPagesData, optimisticallyDeleted]);
  const channels = useMemo(() => (channelsData || []).filter(c => !optimisticallyDeleted.includes(c.id)), [channelsData, optimisticallyDeleted]);
  const notifications = useMemo(() => (notificationsData || []).filter(n => !optimisticallyDeleted.includes(n.id)), [notificationsData, optimisticallyDeleted]);

  const value = {
    interests,
    topics,
    goals,
    tasks,
    wikiPages,
    salesPages,
    channels,
    notifications,
    isDataLoading,
    optimisticallyDeleted,
    setOptimisticallyDeleted,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
}
