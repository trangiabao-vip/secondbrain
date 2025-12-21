

'use client';
import { useState, useEffect, useRef } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { TaskList } from "@/components/tasks/TaskList";
import { AddGoalDialog } from "@/components/goals/AddGoalDialog";
import { Button } from "../ui/button";
import { Icons } from "../icons";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "../ui/dropdown-menu";
import { Progress } from "../ui/progress";
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from "../ui/card";
import { EditGoalDialog } from "./EditGoalDialog";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import type { GoalStatus, GoalPriority } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { AddOrEditTaskDialog } from "../tasks/AddOrEditTaskDialog";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { MarkdownRenderer } from "../ui/markdown-renderer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { useLocalStorage } from "@/hooks/use-local-storage";

const getDateFromFirestore = (date: any): Date | null => {
    if (!date) return null;
    if (typeof date === 'string') return parseISO(date);
    if (date.seconds) return new Date(date.seconds * 1000);
    if (date instanceof Date) return date;
    return null;
};

const statusOptions: Record<GoalStatus, string> = {
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
  const { goals, tasks, selectedTopic, deleteGoal, updateGoal, isDataLoading, duplicateGoal, itemToAutoOpen, setItemToAutoOpen } = useAppContext();
  const [statusFilters, setStatusFilters] = useLocalStorage<GoalStatus[]>('goalsViewStatusFilters', ['chưa bắt đầu', 'đang làm', 'hoàn thành']);
  const [typeFilter, setTypeFilter] = useLocalStorage<'all' | 'goal' | 'task'>('goalsViewTypeFilter', 'all');
  
  const dialogTriggers = useRef<Map<string, HTMLButtonElement | null>>(new Map());

  useEffect(() => {
    if (itemToAutoOpen && !isDataLoading) {
        const trigger = dialogTriggers.current.get(`${itemToAutoOpen.type}-${itemToAutoOpen.id}`);
        if (trigger) {
            // Use a short timeout to ensure the UI is ready
            setTimeout(() => {
                trigger.click();
                setItemToAutoOpen(null); // Clear the auto-open item
            }, 100);
        }
    }
  }, [itemToAutoOpen, isDataLoading, setItemToAutoOpen]);

  if (!selectedTopic) return null;
  
  const toggleStatusFilter = (status: GoalStatus) => {
    setStatusFilters(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  const filteredGoals = goals.filter(goal => {
    if (goal.topicId !== selectedTopic?.id) return false;
    if (typeFilter === 'task') return false; 
    if (statusFilters.length === 0) return true;
    return statusFilters.includes(goal.status);
  });
  
  const filteredStandaloneTasks = tasks.filter(task => {
    // A task is a standalone task for the current topic if it has no goalId and its topicId matches.
    if (task.goalId || task.topicId !== selectedTopic?.id) {
      return false;
    }
    // If the type filter is 'goal', don't show any tasks.
    if (typeFilter === 'goal') {
      return false;
    }
    // If there are status filters, the task status must be included.
    if (statusFilters.length > 0 && !statusFilters.includes(task.status)) {
      return false;
    }
    return true;
  });


  if (isDataLoading) {
    return (
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <Skeleton class="h-8 w-24" />
          <Skeleton class="h-10 w-32" />
        </div>
        <div class="space-y-4">
          <Skeleton class="h-40 w-full" />
          <Skeleton class="h-40 w-full" />
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
    'chưa bắt đầu': 'bg-gray-500 border-gray-400 text-gray-100',
    'đang làm': 'bg-blue-500 border-blue-400 text-blue-100',
    'hoàn thành': 'bg-green-500 border-green-400 text-green-100',
    'thất bại': 'bg-red-500 border-red-400 text-red-100',
    'huỷ': 'bg-orange-500 border-orange-400 text-orange-100',
  }

  const priorityConfig: Record<GoalPriority, { color: string; icon: keyof typeof Icons, label: string }> = {
    'Thấp': { color: 'text-gray-500 dark:text-gray-400', icon: 'down', label: 'Ưu tiên: Thấp' },
    'Vừa': { color: 'text-blue-500 dark:text-blue-400', icon: 'ellipsis', label: 'Ưu tiên: Vừa' },
    'Cao': { color: 'text-red-500 dark:text-red-400', icon: 'up', label: 'Ưu tiên: Cao' },
  };
  
  return (
    <div class="space-y-6">
       <div class="flex items-start justify-between">
        <div>
            <h3 class="text-xl font-bold">Mục tiêu &amp; Nhiệm vụ</h3>
            {selectedTopic.description && <p class="text-muted-foreground mt-1 max-w-2xl">{selectedTopic.description}</p>}
        </div>
        <div class="flex gap-2 flex-shrink-0">
          <AddGoalDialog>
            <Button>
              <Icons.add class="mr-2 h-4 w-4" />
              Mục tiêu mới
            </Button>
          </AddGoalDialog>
        </div>
      </div>

      <div class="flex items-center gap-2 p-2 rounded-lg border bg-card">
        <span class="text-sm font-medium text-muted-foreground mr-2">Lọc theo:</span>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    {typeOptions[typeFilter]}
                    <Icons.down class="ml-2 h-4 w-4" />
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
                    Trạng thái
                    {statusFilters.length > 0 && <Badge variant="secondary" class="ml-2 rounded">{statusFilters.length}</Badge>}
                    <Icons.down class="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {Object.entries(statusOptions).map(([key, value]) => (
                    <DropdownMenuCheckboxItem 
                        key={key} 
                        checked={statusFilters.includes(key as GoalStatus)}
                        onSelect={(e) => e.preventDefault()}
                        onClick={() => toggleStatusFilter(key as GoalStatus)}
                    >
                        {value}
                    </DropdownMenuCheckboxItem>
                ))}
                 <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilters([])}>
                    Xóa tất cả bộ lọc
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredGoals.length > 0 && (
        <div class="space-y-4">
          {filteredGoals.map((goal) => {
            const endDate = getDateFromFirestore(goal.endDate);
            const priority = goal.priority || 'Vừa';
            const { color: priorityColor, icon: PriorityIcon, label: priorityLabel } = priorityConfig[priority];
            const IconComponent = Icons[PriorityIcon] as React.ElementType;
            const progress = calculateProgress(goal.id);

            return (
              <Collapsible key={goal.id} asChild>
                <Card class="overflow-hidden">
                  <div class="p-4">
                    <div class="flex justify-between items-start gap-2">
                      <div class="flex items-center gap-2 flex-1">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" class="h-8 w-8 flex-shrink-0">
                            <Icons.down class="h-4 w-4 transition-transform [&[data-state=open]]:-rotate-90" />
                          </Button>
                        </CollapsibleTrigger>
                        <h4 class="font-semibold text-base">{goal.title}</h4>
                      </div>
                      <div class="flex items-center flex-shrink-0">
                          <EditGoalDialog goalId={goal.id}>
                               <button ref={el => dialogTriggers.current.set(`goal-${goal.id}`, el)} class="hidden" />
                              <Button variant="ghost" size="icon" class="h-8 w-8">
                                  <Icons.edit class="h-4 w-4" />
                              </Button>
                          </EditGoalDialog>
                          <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" class="h-8 w-8">
                              <Icons.ellipsis class="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => duplicateGoal(goal.id)}>
                                  <Icons.copy class="mr-2 h-4 w-4" />
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem class="text-destructive" onClick={() => deleteGoal(goal.id)}>
                              <Icons.delete class="mr-2 h-4 w-4" />
                              Xóa mục tiêu
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                    </div>
                    
                    <div class="mt-2 flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pl-10">
                        <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <Badge variant="outline" class={cn("capitalize", statusColors[goal.status])}>
                                      <div class="w-2 h-2 rounded-full mr-2 bg-current"></div>
                                      {goal.status}
                                  </Badge>
                              </TooltipTrigger>
                              <TooltipContent><p>Trạng thái</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <div class={cn("flex items-center gap-1", priorityColor)}>
                                      <IconComponent class="h-4 w-4" />
                                      <span>{priority}</span>
                                  </div>
                              </TooltipTrigger>
                              <TooltipContent><p>{priorityLabel}</p></TooltipContent>
                          </Tooltip>
                          {endDate && (
                             <Tooltip>
                               <TooltipTrigger asChild>
                                  <div class="flex items-center gap-1">
                                      <Icons.calendar class="h-4 w-4" />
                                      <span>{format(endDate, 'd MMM, yyyy', { locale: vi })}</span>
                                      <span class="hidden sm:inline">({formatDistanceToNow(endDate, { addSuffix: true, locale: vi })})</span>
                                  </div>
                               </TooltipTrigger>
                               <TooltipContent><p>Hạn chót</p></TooltipContent>
                             </Tooltip>
                          )}
                        </TooltipProvider>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div class="px-4 pb-1">
                       <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger class="w-full">
                                 <Progress value={progress} class="h-2 w-full" />
                            </TooltipTrigger>
                            <TooltipContent><p>{Math.round(progress)}% hoàn thành</p></TooltipContent>
                        </Tooltip>
                       </TooltipProvider>
                    </div>

                    {(goal.description || (goal.customProperties && Object.keys(goal.customProperties).length > 0)) && (
                      <div class="px-4 pb-2 pt-4 space-y-4">
                         {goal.description && (
                            <div>
                                <Label class="text-xs font-semibold text-muted-foreground">Mô tả</Label>
                                <MarkdownRenderer class="text-sm">{goal.description}</MarkdownRenderer>
                            </div>
                         )}
                         {goal.customProperties && Object.keys(goal.customProperties).length > 0 && (
                            <div>
                                <Label class="text-xs font-semibold text-muted-foreground">Thuộc tính</Label>
                                <div class="flex items-center gap-x-4 gap-y-2 flex-wrap mt-2">
                                {Object.entries(goal.customProperties).map(([key, value]) => {
                                    const lowerValue = String(value).toLowerCase();
                                    if (lowerValue === 'true' || lowerValue === 'false') {
                                    return (
                                        <div key={key} class="flex items-center gap-2">
                                        <Checkbox checked={lowerValue === 'true'} disabled id={`goal-prop-${goal.id}-${key}`} />
                                        <Label htmlFor={`goal-prop-${goal.id}-${key}`} class="text-sm font-medium text-muted-foreground">
                                            {key}
                                        </Label>
                                        </div>
                                    );
                                    }
                                    return (
                                    <Badge key={key} variant="outline" class="font-normal">
                                        <span class="font-semibold mr-1.5">{key}:</span>
                                        <span>{String(value)}</span>
                                    </Badge>
                                    );
                                })}
                                </div>
                            </div>
                         )}
                      </div>
                    )}
                    
                    <div class="bg-secondary/50 p-4">
                        <TaskList goalId={goal.id} dialogTriggers={dialogTriggers} />
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )
          })}
        </div>
      )}

      {(typeFilter === 'all' || typeFilter === 'task') && (
        <Card>
            <CardHeader>
                <div class="flex items-center justify-between">
                    <h4 class="font-semibold text-base">Nhiệm vụ độc lập</h4>
                    <AddOrEditTaskDialog mode="add" topicId={selectedTopic.id}>
                        <Button variant="outline" size="sm">
                        <Icons.add class="mr-2 h-4 w-4" />
                        Thêm nhiệm vụ
                        </Button>
                    </AddOrEditTaskDialog>
                </div>
            </CardHeader>
            <CardContent>
                {filteredStandaloneTasks.length > 0 ? (
                    <TaskList tasks={filteredStandaloneTasks} dialogTriggers={dialogTriggers}/>
                ) : (
                    <div class="text-center py-4 text-sm text-muted-foreground">
                        Không có nhiệm vụ độc lập nào trong chủ đề này.
                    </div>
                )}
            </CardContent>
        </Card>
      )}
      
      {filteredGoals.length === 0 && filteredStandaloneTasks.length === 0 && (
        <div class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-card p-12 text-center">
            <Icons.goal class="h-12 w-12 text-muted-foreground" />
            <h3 class="mt-4 text-lg font-semibold">
                Không tìm thấy kết quả
            </h3>
            <p class="mt-2 text-sm text-muted-foreground">
                Hãy thử thay đổi bộ lọc hoặc tạo một mục tiêu / nhiệm vụ mới.
            </p>
            <div class="mt-6 flex gap-4">
                <AddOrEditTaskDialog mode="add" topicId={selectedTopic.id}>
                    <Button variant="outline">
                        <Icons.add class="mr-2 h-4 w-4" />
                        Thêm nhiệm vụ
                    </Button>
                </AddOrEditTaskDialog>
                <AddGoalDialog>
                    <Button>
                        <Icons.add class="mr-2 h-4 w-4" />
                        Mục tiêu mới
                    </Button>
                </AddGoalDialog>
                 {(statusFilters.length > 0 || typeFilter !== 'all') && (
                  <Button variant="outline" onClick={() => { setStatusFilters([]); setTypeFilter('all'); }}>
                    Xóa bộ lọc
                  </Button>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
