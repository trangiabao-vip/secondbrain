
'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalsView } from "../goals/GoalsView";
import { ScheduleView } from "./ScheduleView";
import { Icons } from "../icons";
import { WikiView } from "../wiki/WikiView";
import { Button } from "../ui/button";
import { AddTopicDialog } from "../topics/AddTopicDialog";
import { useAppContext } from "@/contexts/AppContext";
import { TopicGrid } from "../topics/TopicGrid";

export function TopicDetailView() {
  const { selectedTopicId } = useAppContext();
  
  return (
    <div className="space-y-4">
        <Tabs defaultValue="goals" className="h-full flex flex-col">
        <div className="flex justify-between items-start">
            <TabsList className="w-full sm:w-auto self-start">
                <TabsTrigger value="goals" className="gap-2">
                    <Icons.goal className="h-4 w-4" />
                    Mục tiêu &amp; Nhiệm vụ
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-2">
                    <Icons.calendar className="h-4 w-4" />
                    Lịch trình
                </TabsTrigger>
                <TabsTrigger value="wiki" className="gap-2">
                    <Icons.topic className="h-4 w-4" />
                    Wiki
                </TabsTrigger>
            </TabsList>
            <AddTopicDialog interestId={''} parentId={selectedTopicId}>
                <Button>
                    <Icons.add className="mr-2 h-4 w-4" />
                    Thêm chủ đề con
                </Button>
            </AddTopicDialog>
        </div>
        <TabsContent value="goals" className="mt-4 flex-grow">
            <GoalsView />
        </TabsContent>
        <TabsContent value="schedule" className="mt-4 flex-grow">
            <ScheduleView />
        </TabsContent>
        <TabsContent value="wiki" className="mt-4 flex-grow">
            <WikiView />
        </TabsContent>
        </Tabs>

        <div className="mt-8">
            <h3 className="text-2xl font-bold tracking-tight mb-4">Chủ đề con</h3>
            <TopicGrid />
        </div>
    </div>
  );
}
