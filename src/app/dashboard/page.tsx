'use client';
import { AuthGuard } from '@/components/auth/AuthGuard';
import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardView = React.lazy(() =>
  import('@/components/dashboard/DashboardView').then(module => ({ default: module.DashboardView }))
);

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
    return (
        <AuthGuard>
            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardView />
            </Suspense>
        </AuthGuard>
    );
}

export default DashboardPage;
