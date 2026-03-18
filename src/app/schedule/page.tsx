'use client';
import { AuthGuard } from '@/components/auth/AuthGuard';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import GlobalScheduleView from '@/components/details/GlobalScheduleView';
import { useAppContext } from '@/contexts/AppContext';

const ScheduleSkeleton = () => (
  <div className="flex flex-col h-full">
    <header className="flex items-center justify-between pb-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-8" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-8 w-8" />
      </div>
    </header>
    <div className="flex-1 rounded-lg border p-4">
      <Skeleton className="h-full w-full" />
    </div>
  </div>
);

function SchedulePage() {
    const { isDataLoading } = useAppContext();

    if (isDataLoading) {
      return (
        <AuthGuard>
          <ScheduleSkeleton />
        </AuthGuard>
      );
    }

    return (
        <AuthGuard>
          <GlobalScheduleView />
        </AuthGuard>
    );
}

export default SchedulePage;
