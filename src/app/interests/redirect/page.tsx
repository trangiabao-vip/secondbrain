'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';

// This page acts as a router for incoming notification links.
// It finds the correct full URL and redirects the user.
export default function NotificationRedirector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDataLoading, goals, tasks, topics, setItemToAutoOpen } = useAppContext();

  const type = searchParams.get('type') as 'goal' | 'task' | 'topic' | null;
  const id = searchParams.get('id');

  useEffect(() => {
    if (isDataLoading || !type || !id) {
      return;
    }

    let targetInterestId: string | null = null;
    let targetTopicId: string | null = null;

    if (type === 'topic') {
      const topic = topics.find(t => t.id === id);
      if (topic) {
        targetInterestId = topic.interestId;
        targetTopicId = topic.id;
      }
    } else if (type === 'goal') {
      const goal = goals.find(g => g.id === id);
      const parentTopic = goal ? topics.find(t => t.id === goal.topicId) : null;
      if (parentTopic) {
        targetInterestId = parentTopic.interestId;
        targetTopicId = parentTopic.id;
        setItemToAutoOpen({ type: 'goal', id });
      }
    } else if (type === 'task') {
      const task = tasks.find(t => t.id === id);
      if (task) {
          const parentGoal = task.goalId ? goals.find(g => g.id === task.goalId) : null;
          const parentTopic = parentGoal ? topics.find(t => t.id === parentGoal.topicId) : topics.find(t => t.id === task.topicId);
          if(parentTopic) {
            targetInterestId = parentTopic.interestId;
            targetTopicId = parentTopic.id;
            setItemToAutoOpen({ type: 'task', id, goalId: task.goalId });
          }
      }
    }

    if (targetInterestId && targetTopicId) {
      router.replace(`/interests/${targetInterestId}/${targetTopicId}`);
    } else if (targetInterestId) {
       router.replace(`/interests/${targetInterestId}`);
    } else {
      // Fallback to a general page if we can't resolve the link
      console.warn(`Could not resolve notification link for type: ${type}, id: ${id}`);
      router.replace('/schedule');
    }

  }, [isDataLoading, type, id, goals, tasks, topics, router, setItemToAutoOpen]);

  return (
     <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <Icons.notification className="h-12 w-12 animate-pulse" />
            <div className="space-y-2 text-center">
                <p className="text-muted-foreground">Đang chuyển hướng...</p>
                <Skeleton className="h-4 w-[250px]" />
            </div>
        </div>
    </div>
  );
}
