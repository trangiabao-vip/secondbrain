
'use client';
import React from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import { useAppContext } from "@/contexts/AppContext";
import { TopicCard } from "./TopicCard";
import { AddTopicDialog } from "./AddTopicDialog";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import type { Topic } from '@/lib/data';

export function TopicGrid() {
  const { topics, selectedInterest, selectedTopicId, isDataLoading, handleDragEnd } = useAppContext();
  
  const topicsToDisplay = topics
    .filter(topic => {
      if (selectedTopicId) {
        return topic.parentId === selectedTopicId;
      }
      if (selectedInterest) {
        return topic.interestId === selectedInterest.id && !topic.parentId;
      }
      return false;
    })
    .sort((a, b) => a.order - b.order);

  const currentContextName = selectedTopicId 
    ? topics.find(t => t.id === selectedTopicId)?.name 
    : selectedInterest?.name;

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
      {!selectedTopicId && (
         <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Chủ đề cho {currentContextName}</h2>
          <AddTopicDialog>
            <Button>
              <Icons.add className="mr-2 h-4 w-4" />
              Thêm chủ đề
            </Button>
          </AddTopicDialog>
        </div>
      )}
      {topicsToDisplay.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="topicsDroppable" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {topicsToDisplay.map((topic, index) => (
                  <Draggable key={topic.id} draggableId={topic.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <TopicCard topic={topic} dragHandleProps={provided.dragHandleProps} />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        !selectedTopicId && (
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
        )
      )}
    </div>
  );
}

export default TopicGrid;
