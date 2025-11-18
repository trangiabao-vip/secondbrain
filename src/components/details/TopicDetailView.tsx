'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalsView } from "./GoalsView";
import { ScheduleView } from "./ScheduleView";
import { Icons } from "../icons";

export function TopicDetailView() {
  
  return (
    <Tabs defaultValue="goals" className="h-full flex flex-col">
      <TabsList className="w-full sm:w-auto self-start">
        <TabsTrigger value="goals" className="gap-2">
            <Icons.goal className="h-4 w-4" />
            Mục tiêu &amp; Nhiệm vụ
        </TabsTrigger>
        <TabsTrigger value="schedule" className="gap-2">
            <Icons.calendar className="h-4 w-4" />
            Lịch trình
        </TabsTrigger>
      </TabsList>
      <TabsContent value="goals" className="mt-4 flex-grow">
        <GoalsView />
      </TabsContent>
      <TabsContent value="schedule" className="mt-4 flex-grow">
        <ScheduleView />
      </TabsContent>
    </Tabs>
  );
}
