'use client';
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/AppContext";
import type { Topic } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Icons } from "../icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { EditTopicDialog } from "./EditTopicDialog";
import type { DraggableProvidedDragHandleProps } from "react-beautiful-dnd";

const getDateFromFirestore = (date: any): Date | null => {
    if (!date) return null;
    if (typeof date === 'string') return parseISO(date);
    if (date.seconds) return new Date(date.seconds * 1000);
    if (date instanceof Date) return date;
    return null;
};

interface TopicCardProps {
  topic: Topic;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export function TopicCard({ topic, dragHandleProps }: TopicCardProps) {
  const { selectTopic, deleteTopic, goals, tasks } = useAppContext();
  const placeholder = PlaceHolderImages.find(p => p.id === topic.imageId);

  const topicGoals = goals.filter(g => g.topicId === topic.id);
  const topicTasks = tasks.filter(t => topicGoals.some(g => g.id === t.goalId) || t.topicId === topic.id);

  const createdAt = getDateFromFirestore(topic.createdAt);

  const goalsToShow = topicGoals.slice(0, 2);
  const tasksToShow = topicTasks.slice(0, 2);
  const moreGoalsCount = topicGoals.length > 2 ? topicGoals.length - 2 : 0;
  const moreTasksCount = topicTasks.length > 2 ? topicTasks.length - 2 : 0;

  return (
    <Card {...dragHandleProps} className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
       <CardHeader className="p-0 relative">
        {placeholder && (
            <Image
                src={placeholder.imageUrl}
                alt={placeholder.description}
                width={600}
                height={400}
                data-ai-hint={placeholder.imageHint}
                className="aspect-video object-cover"
            />
        )}
        <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/70 hover:bg-background">
                  <Icons.ellipsis className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <EditTopicDialog topicId={topic.id}>
                    <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                        <Icons.edit className="mr-2 h-4 w-4" />
                        Chỉnh sửa chủ đề
                    </button>
                </EditTopicDialog>
                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteTopic(topic.id); }}>
                  <Icons.delete className="mr-2 h-4 w-4" />
                  Xóa chủ đề
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-bold line-clamp-2">{topic.name}</CardTitle>
        {topic.description && <CardDescription className="mt-1 text-sm line-clamp-2">{topic.description}</CardDescription>}
        
        <div className="mt-3 space-y-3">
          {topicGoals.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5"><Icons.goal className="h-3.5 w-3.5" /> MỤC TIÊU ({topicGoals.length})</h4>
              <ul className="space-y-1 text-sm text-foreground">
                {goalsToShow.map(goal => (
                  <li key={goal.id} className="truncate ml-2">{goal.title}</li>
                ))}
                {moreGoalsCount > 0 && <li className="text-xs text-muted-foreground truncate ml-2">và {moreGoalsCount} mục tiêu khác...</li>}
              </ul>
            </div>
          )}
          {topicTasks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5"><Icons.task className="h-3.5 w-3.5" /> CÔNG VIỆC ({topicTasks.length})</h4>
              <ul className="space-y-1 text-sm text-foreground">
                {tasksToShow.map(task => (
                  <li key={task.id} className="truncate ml-2">{task.text}</li>
                ))}
                {moreTasksCount > 0 && <li className="text-xs text-muted-foreground truncate ml-2">và {moreTasksCount} công việc khác...</li>}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 mt-auto">
        <Button onClick={() => selectTopic(topic.id)} className="w-full" variant="outline">
            Xem chi tiết
        </Button>
      </CardFooter>
    </Card>
  );
}
