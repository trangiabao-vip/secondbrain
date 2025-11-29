'use client';
import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TaskList } from "@/components/tasks/TaskList";
import { AddGoalDialog } from "@/components/goals/AddGoalDialog";
import { Button } from "../ui/button";
import { Icons } from "../icons";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { Progress } from "../ui/progress";
import { vi } from 'date-fns/locale';
import { Card, CardContent } from "../ui/card";
import { EditGoalDialog } from "./EditGoalDialog";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import type { GoalStatus, GoalPriority } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { AddOrEditTaskDialog } from "../tasks/AddOrEditTaskDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { AddTopicDialog } from "../topics/AddTopicDialog";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { MarkdownRenderer } from "../ui/markdown-renderer";

const getDateFromFirestore = (date: any): Date | null => {
    if (!date) return null;
    if (typeof date === 'string') return parseISO(date);
    if (date.seconds) return new Date(date.seconds * 1000);
    if (date instanceof Date) return date;
    return null;
};

const statusOptions: Record<GoalStatus | 'all', string> = {
    'all': 'Tất cả trạng thái',
    'chưa bắt đầu': 'Chưa bắt đầu',
    'đang làm': 'Đang làm',
    'hoàn thành': 'Hoàn thành',
    'thất bại': 'Thất bại',
    'huỷ': 'Huỷ',
};

const typeOptions = {
    'all': 'Tất cả loại',
    'goal': 'Chỉ mục tiêu',
    'task': 'Chỉ nhiệm vụ',
};

export function GoalsView() {
  const { goals, tasks, selectedTopic, deleteGoal, updateGoal, isDataLoading, duplicateGoal } = useAppContext();
  const [statusFilter, setStatusFilter] = useState<GoalStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'goal' | 'task'>('all');
  
  if (!selectedTopic) return null;
  
  const filteredGoals = goals.filter(goal => {
    if (goal.topicId !== selectedTopic?.id) return false;
    if (typeFilter === 'task') return false; // Hide all goals if filtering for tasks
    if (statusFilter === 'all') return true;
    return goal.status === statusFilter;
  });

  const filteredStandaloneTasks = tasks.filter(task => {
    if (task.topicId !== selectedTopic?.id || task.goalId) return false;
    if (typeFilter === 'goal') return false; // Hide standalone tasks if filtering for goals
    if (statusFilter === 'all') return true;
    return task.status === statusFilter;
  });

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

  const statusColors: Record<GoalStatus, string> = {
    'chưa bắt đầu': 'bg-gray-500',
    'đang làm': 'bg-blue-500',
    'hoàn thành': 'bg-green-500',
    'thất bại': 'bg-red-500',
    'huỷ': 'bg-orange-500',
  }

  const priorityConfig: Record<GoalPriority, { color: string; icon: keyof typeof Icons }> = {
    'Thấp': { color: 'text-gray-500', icon: 'down' },
    'Vừa': { color: 'text-blue-500', icon: 'ellipsis' },
    'Cao': { color: 'text-red-500', icon: 'up' },
  };
  
  return (
    <div className="space-y-6">
       <div className="flex items-start justify-between">
        <div>
            <h3 className="text-xl font-bold">Mục tiêu &amp; Nhiệm vụ</h3>
            {selectedTopic.description && <p className="text-muted-foreground mt-1 max-w-2xl">{selectedTopic.description}</p>}
        </div>
        <div className="flex gap-2 flex-shrink-0">
           <AddTopicDialog interestId={selectedTopic.interestId}>
            <Button variant="outline">
              <Icons.add className="mr-2 h-4 w-4" />
              Thêm chủ đề
            </Button>
          </AddTopicDialog>
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

      <div className="flex items-center gap-2 p-2 rounded-lg border bg-card">
        <span className="text-sm font-medium text-muted-foreground mr-2">Lọc theo:</span>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    {typeOptions[typeFilter]}
                    <Icons.down className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {Object.entries(typeOptions).map(([key, value]) => (
                    <DropdownMenuItem 
                        key={key} 
                        onSelect={() => setTypeFilter(key as 'all' | 'goal' | 'task')}
                    >
                        {value}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    {statusOptions[statusFilter]}
                    <Icons.down className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {Object.entries(statusOptions).map(([key, value]) => (
                    <DropdownMenuItem 
                        key={key} 
                        onSelect={() => setStatusFilter(key as GoalStatus | 'all')}
                    >
                        {value}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredGoals.length > 0 && typeFilter !== 'task' && (
        <Accordion type="single" collapsible className="w-full" defaultValue={filteredGoals[0]?.id}>
          {filteredGoals.map((goal) => {
            const endDate = getDateFromFirestore(goal.endDate);
            const priority = goal.priority || 'Vừa';
            const { color: priorityColor, icon: PriorityIcon } = priorityConfig[priority];
            const IconComponent = Icons[PriorityIcon] as React.ElementType;

            return (
              <AccordionItem value={goal.id} key={goal.id} className="border-b-0">
                <Card className="mb-4 overflow-hidden">
                  <div className="flex items-start p-4">
                      <AccordionTrigger className="flex-1 text-left p-0 hover:no-underline">
                          <div className="flex flex-col gap-2 w-full">
                              <span className="font-semibold text-base">{goal.title}</span>
                              {goal.description && <MarkdownRenderer className="text-sm text-muted-foreground line-clamp-2">{goal.description}</MarkdownRenderer>}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 flex-wrap">
                                  <Badge variant="secondary" className="capitalize w-fit">
                                      <div className={cn("w-2 h-2 rounded-full mr-2", statusColors[goal.status])}></div>
                                      {goal.status}
                                  </Badge>
                                  <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                           <div className={`flex items-center gap-1 text-xs font-medium ${priorityColor}`}>
                                                <IconComponent className="h-4 w-4" />
                                                <span>Ưu tiên: {priority}</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Mức độ ưu tiên: {priority}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                  </TooltipProvider>

                                  {endDate && (
                                      <span className="text-xs text-muted-foreground">
                                      Hết hạn {formatDistanceToNow(endDate, { addSuffix: true, locale: vi })} ({format(endDate, 'd MMM, yyyy', { locale: vi })})
                                      </span>
                                  )}
                              </div>
                               {goal.customProperties && Object.keys(goal.customProperties).length > 0 && (
                                <div className="flex items-center gap-x-4 gap-y-2 flex-wrap mt-2">
                                  {Object.entries(goal.customProperties).map(([key, value]) => {
                                      const lowerValue = String(value).toLowerCase();
                                      if (lowerValue === 'true' || lowerValue === 'false') {
                                        return (
                                          <div key={key} className="flex items-center gap-2">
                                            <Checkbox checked={lowerValue === 'true'} disabled id={`goal-prop-${goal.id}-${key}`} />
                                            <Label htmlFor={`goal-prop-${goal.id}-${key}`} className="text-sm font-medium text-muted-foreground">
                                              {key}
                                            </Label>
                                          </div>
                                        );
                                      }
                                      return (
                                        <Badge key={key} variant="outline" className="font-normal">
                                          <span className="font-semibold mr-1">{key}:</span>
                                          <span>{String(value)}</span>
                                        </Badge>
                                      );
                                  })}
                                </div>
                              )}
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
                              <DropdownMenuItem onClick={() => duplicateGoal(goal.id)}>
                                  <Icons.copy className="mr-2 h-4 w-4" />
                                  Nhân bản
                              </DropdownMenuItem>
                              <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                      <span>Cập nhật trạng thái</span>
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuPortal>
                                      <DropdownMenuSubContent>
                                          <DropdownMenuItem onClick={() => updateGoal(goal.id, { status: 'chưa bắt đầu' })}>Chưa bắt đầu</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => updateGoal(goal.id, { status: 'đang làm' })}>Đang làm</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => updateGoal(goal.id, { status: 'hoàn thành' })}>Hoàn thành</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => updateGoal(goal.id, { status: 'thất bại' })}>Thất bại</DropdownMenuItem>
                                           <DropdownMenuItem onClick={() => updateGoal(goal.id, { status: 'huỷ' })}>Huỷ</DropdownMenuItem>
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
                          <TaskList goalId={goal.id} filterStatus={statusFilter} />
                      </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      {filteredStandaloneTasks.length > 0 && typeFilter !== 'goal' && (
         <Card>
            <CardContent className="p-4">
               <h4 className="font-semibold mb-4">Nhiệm vụ độc lập</h4>
               <TaskList tasks={filteredStandaloneTasks} />
            </CardContent>
         </Card>
      )}

      {filteredGoals.length === 0 && filteredStandaloneTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-card p-12 text-center">
            <Icons.goal className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
                Không tìm thấy kết quả
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
                Hãy thử thay đổi bộ lọc hoặc tạo một mục tiêu / nhiệm vụ mới.
            </p>
            <div className="mt-6 flex gap-4">
                <AddGoalDialog>
                    <Button>
                        <Icons.add className="mr-2 h-4 w-4" />
                        Mục tiêu mới
                    </Button>
                </AddGoalDialog>
                 {(statusFilter !== 'all' || typeFilter !== 'all') && (
                  <Button variant="outline" onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }}>
                    Xóa bộ lọc
                  </Button>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
