'use client';
import { AuthGuard } from '@/components/auth/AuthGuard';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardView from '@/components/dashboard/DashboardView';
import { useAppContext } from '@/contexts/AppContext';

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-32" />
    </div>
    <Skeleton className="h-64 w-full rounded-lg" />
    <Skeleton className="h-48 w-full rounded-lg" />
  </div>
);

function DashboardPage() {
    const { isDataLoading } = useAppContext();

    if (isDataLoading) {
      return (
        <AuthGuard>
          <DashboardSkeleton />
        </AuthGuard>
      )
    }

    return (
        <AuthGuard>
          <DashboardView />
        </AuthGuard>
    );
}

export default DashboardPage;
