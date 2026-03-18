'use client';

import { WelcomeScreen } from "@/components/WelcomeScreen";
import { useAppContext } from "@/contexts/AppContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import TopicGrid from '@/components/topics/TopicGrid';

const TopicGridSkeleton = () => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
);


export default function InterestPage() {
    const { interests, isDataLoading } = useAppContext();

    if (isDataLoading) {
        return (
            <AuthGuard>
                <TopicGridSkeleton />
            </AuthGuard>
        );
    }

    if (interests.length === 0) {
        return (
            <AuthGuard>
                <WelcomeScreen />
            </AuthGuard>
        );
    }
    
    return (
        <AuthGuard>
            <TopicGrid />
        </AuthGuard>
    );
}
