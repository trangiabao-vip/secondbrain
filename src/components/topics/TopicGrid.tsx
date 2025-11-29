
'use client';
import React, { useMemo } from 'react';
import { useAppContext } from "@/contexts/AppContext";
import { TopicCard } from "./TopicCard";
import { AddTopicDialog } from "./AddTopicDialog";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import type { Topic } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';

interface TopicWithSubTopics extends Topic {
  subTopics: TopicWithSubTopics[];
}

const TopicTreeItem = ({ topic, level }: { topic: TopicWithSubTopics, level: number }) => {
  return (
    <div className="flex flex-col">
      <div style={{ gridColumn: 'span 4 / span 4' }}>
        <TopicCard topic={topic} />
      </div>
      {topic.subTopics && topic.subTopics.length > 0 && (
         <div 
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pl-6 mt-6 border-l-2 ml-4"
         >
           {topic.subTopics.map(subTopic => (
             <TopicTreeItem key={subTopic.id} topic={subTopic} level={level + 1} />
           ))}
         </div>
      )}
    </div>
  )
}

export function TopicGrid() {
  const { topics, selectedInterest, isDataLoading } = useAppContext();
  
  const topicTree = useMemo(() => {
    if (!selectedInterest) return [];
    
    const allTopicsForInterest = topics.filter(topic => topic.interestId === selectedInterest.id);
    const topicMap = new Map<string, TopicWithSubTopics>(
      allTopicsForInterest.map(topic => ({ ...topic, subTopics: [] })).map(topic => [topic.id, topic])
    );
    
    const tree: TopicWithSubTopics[] = [];

    topicMap.forEach(topic => {
      if (topic.parentId && topicMap.has(topic.parentId)) {
        topicMap.get(topic.parentId)!.subTopics.push(topic);
      } else {
        tree.push(topic);
      }
    });

    return tree;
  }, [topics, selectedInterest]);

  if (!selectedInterest) return null;

  if (isDataLoading) {
    return (
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
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Chủ đề cho {selectedInterest.name}</h2>
        <AddTopicDialog>
          <Button>
            <Icons.add className="mr-2 h-4 w-4" />
            Thêm chủ đề
          </Button>
        </AddTopicDialog>
      </div>
      {topicTree.length > 0 ? (
        <div className="grid gap-6 grid-cols-1">
          {topicTree.map((topic) => (
            <div key={topic.id} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <TopicTreeItem topic={topic} level={0} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-card p-12 text-center">
            <Icons.topic className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Chưa có chủ đề nào</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tạo chủ đề đầu tiên của bạn để bắt đầu sắp xếp các mục tiêu của bạn.
            </p>
            <div className="mt-6">
                <AddTopicDialog>
                    <Button>
                        <Icons.add className="mr-2 h-4 w-4" />
                        Chủ đề mới
                    </Button>
                </AddTopicDialog>
            </div>
        </div>
      )}
    </div>
  );
}
