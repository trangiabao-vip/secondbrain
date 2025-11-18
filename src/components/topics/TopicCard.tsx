

'use client';
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/AppContext";
import type { Topic } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Icons } from "../icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { EditTopicDialog } from "./EditTopicDialog";

const getDateFromFirestore = (date: any): Date | null => {
    if (!date) return null;
    if (typeof date === 'string') return parseISO(date);
    if (date.seconds) return new Date(date.seconds * 1000);
    if (date instanceof Date) return date;
    return null;
};

interface TopicCardProps {
  topic: Topic;
}

export function TopicCard({ topic }: TopicCardProps) {
  const { selectTopic, deleteTopic, goals, tasks } = useAppContext();
  const placeholder = PlaceHolderImages.find(p => p.id === topic.imageId);

  const topicGoals = goals.filter(g => g.topicId === topic.id);
  const topicTasks = tasks.filter(t => topicGoals.some(g => g.id === t.goalId));

  const createdAt = getDateFromFirestore(topic.createdAt);

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
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
        {createdAt && (
          <p className="text-xs text-muted-foreground mt-1">
            Tạo lúc: {format(createdAt, "HH:mm, dd/MM/yyyy", { locale: vi })}
          </p>
        )}
        <div className="text-sm text-muted-foreground mt-2 flex items-center gap-4">
            <div className="flex items-center gap-1">
                <Icons.goal className="h-4 w-4"/>
                <span>{topicGoals.length} Mục tiêu</span>
            </div>
            <div className="flex items-center gap-1">
                <Icons.task className="h-4 w-4"/>
                <span>{topicTasks.length} Công việc</span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={() => selectTopic(topic.id)} className="w-full" variant="outline">
            Xem chi tiết
        </Button>
      </CardFooter>
    </Card>
  );
}
