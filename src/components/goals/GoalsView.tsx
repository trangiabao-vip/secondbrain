
'use client';
import { useAppContext } from "@/contexts/AppContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TaskList } from "@/components/tasks/TaskList";
import { AddGoalDialog } from "@/components/goals/AddGoalDialog";
import { Button } from "../ui/button";
import { Icons } from "../icons";
import { format, formatDistanceToNow } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from "../ui/dropdown-menu";
import { Progress } from "../ui/progress";
import { vi } from 'date-fns/locale';
import { Card } from "../ui/card";
import { EditGoalDialog } from "./EditGoalDialog";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import type { GoalStatus } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { AddOrEditTaskDialog } from "../tasks/AddOrEditTaskDialog";

export function GoalsView() {
  const { goals, tasks, selectedTopic, deleteGoal, updateGoal, isDataLoading } = useAppContext();
  
  if (!selectedTopic) return null;
  
  const topicGoals = goals.filter(goal => goal.topicId === selectedTopic?.id);
  const standaloneTasks = tasks.filter(task => task.topicId === selectedTopic?.id && !task.goalId);


  if (isDataLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  const calculateProgress = (goalId: string) => {
    const goalTasks = tasks.filter(t => t.goalId === goalId);
    if (goalTasks.length === 0) return 0;
    const completedTasks = goalTasks.filter(t => t.status === 'hoàn thành').length;
    return (completedTasks / goalTasks.length) * 100;
  };

  const getGoalDate = (date: any) => {
    if (!date) return null;
    if (typeof date === 'string') return new Date(date);
    if (date.seconds) return new Date(date.seconds * 1000);
    return null;
  }

  const statusColors: Record<GoalStatus, string> = {
    'chưa bắt đầu': 'bg-gray-500',
    'đang làm': 'bg-blue-500',
    'hoàn thành': 'bg-green-500',
    'thất bại': 'bg-red-500',
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Mục tiêu &amp; Nhiệm vụ</h3>
        <div className="flex gap-2">
          <AddOrEditTaskDialog mode="add">
            <Button variant="outline">
              <Icons.add className="mr-2 h-4 w-4" />
              Thêm nhiệm vụ
            </Button>
          </AddOrEditTaskDialog>
          <AddGoalDialog>
            <Button>
              <Icons.add className="mr-2 h-4 w-4" />
              Mục tiêu mới
            </Button>
          </AddGoalDialog>
        </div>
      </div>

      {topicGoals.length > 0 && (
        <Accordion type="single" collapsible className="w-full" defaultValue={topicGoals[0]?.id}>
          {topicGoals.map((goal) => {
            const endDate = getGoalDate(goal.endDate);
            const createdAt = getGoalDate(goal.createdAt);
            return (
              <AccordionItem value={goal.id} key={goal.id} className="border-b-0">
                <Card className="mb-4 overflow-hidden">
                  <div className="flex items-center p-4">
                      <AccordionTrigger className="flex-1 text-left p-0 hover:no-underline">
                          <div className="flex flex-col gap-2">
                              <span className="font-semibold text-base">{goal.title}</span>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                  <Badge variant="secondary" className="capitalize w-fit">
                                      <div className={cn("w-2 h-2 rounded-full mr-2", statusColors[goal.status])}></div>
                                      {goal.status}
                                  </Badge>
                                  {endDate && (
                                      <span className="text-xs text-muted-foreground">
                                      Hết hạn {formatDistanceToNow(endDate, { addSuffix: true, locale: vi })} ({format(endDate, 'd MMM, yyyy', { locale: vi })})
                                      </span>
                                  )}
                                  {createdAt && (
                                    <span className="text-xs text-muted-foreground">
                                        Tạo lúc: {format(createdAt, "HH:mm, dd/MM/yyyy", { locale: vi })}
                                    </span>
                                  )}
                              </div>
                              <Progress value={calculateProgress(goal.id)} className="h-2 w-full max-w-sm mt-1" />
                          </div>
                      </AccordionTrigger>
                      <div className="flex items-center ml-2">
                          <EditGoalDialog goalId={goal.id}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                  <Icons.edit className="h-4 w-4" />
                              </Button>
                          </EditGoalDialog>
                          <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <Icons.ellipsis className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                      <span>Cập nhật trạng thái</span>
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuPortal>
                                      <DropdownMenuSubContent>
                                          <DropdownMenuItem onClick={() => updateGoal(goal.id, goal.title, goal.startDate ? new Date(goal.startDate) : undefined, endDate || undefined, 'chưa bắt đầu')}>Chưa bắt đầu</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => updateGoal(goal.id, goal.title, goal.startDate ? new Date(goal.startDate) : undefined, endDate || undefined, 'đang làm')}>Đang làm</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => updateGoal(goal.id, goal.title, goal.startDate ? new Date(goal.startDate) : undefined, endDate || undefined, 'hoàn thành')}>Hoàn thành</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => updateGoal(goal.id, goal.title, goal.startDate ? new Date(goal.startDate) : undefined, endDate || undefined, 'thất bại')}>Thất bại</DropdownMenuItem>
                                      </DropdownMenuSubContent>
                                  </DropdownMenuPortal>
                              </DropdownMenuSub>
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteGoal(goal.id)}>
                              <Icons.delete className="mr-2 h-4 w-4" />
                              Xóa mục tiêu
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                  </div>
                  <AccordionContent>
                      <div className="px-4 pb-4">
                          <TaskList goalId={goal.id} />
                      </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      {standaloneTasks.length > 0 && (
         <Card>
            <CardContent className="p-4">
               <h4 className="font-semibold mb-4">Nhiệm vụ độc lập</h4>
               <TaskList tasks={standaloneTasks} />
            </CardContent>
         </Card>
      )}

      {topicGoals.length === 0 && standaloneTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-card p-12 text-center">
            <Icons.goal className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Chưa có mục tiêu hoặc nhiệm vụ nào</h3>
            <p className="mt-2 text-sm text-muted-foreground">
                Đặt mục tiêu hoặc thêm nhiệm vụ để bắt đầu tiến bộ về chủ đề này.
            </p>
            <div className="mt-6 flex gap-4">
                <AddGoalDialog>
                    <Button>
                        <Icons.add className="mr-2 h-4 w-4" />
                        Mục tiêu mới
                    </Button>
                </AddGoalDialog>
                <AddOrEditTaskDialog mode="add">
                  <Button variant="outline">
                    <Icons.add className="mr-2 h-4 w-4" />
                    Thêm nhiệm vụ
                  </Button>
                </AddOrEditTaskDialog>
            </div>
        </div>
      )}
    </div>
  );
}
