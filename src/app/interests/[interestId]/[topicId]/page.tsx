'use client';
import { AuthGuard } from "@/components/auth/AuthGuard";
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import TopicDetailView from '@/components/details/TopicDetailView';
import { useAppContext } from "@/contexts/AppContext";

const TopicDetailSkeleton = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-start">
      <div className="flex gap-1 p-1 bg-muted rounded-md">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-10 w-36" />
    </div>
    <div className="mt-4">
      <Skeleton className="h-96 w-full" />
    </div>
     <div className="mt-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
        </div>
    </div>
  </div>
);

export default function TopicPage() {
    const { isDataLoading } = useAppContext();

    if (isDataLoading) {
      return (
        <AuthGuard>
          <TopicDetailSkeleton />
        </AuthGuard>
      )
    }

    return (
        <AuthGuard>
            <TopicDetailView />
        </AuthGuard>
    );
}
