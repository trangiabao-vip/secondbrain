

'use client';
import { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
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
};

const typeOptions = {
    'all': 'Tất cả loại',
    'goal': 'Chỉ mục tiêu',
    'task': 'Chỉ nhiệm vụ',
};

export function GoalsView() {
  const { goals, tasks, selectedTopic, deleteGoal, updateGoal, isDataLoading, duplicateGoal, itemToAutoOpen, setItemToAutoOpen, handleDragEnd } = useAppContext();
  const [statusFilters, setStatusFilters] = useLocalStorage<GoalStatus[]>('goalsViewStatusFilters', ['chưa bắt đầu', 'đang làm']);
  const [typeFilter, setTypeFilter] = useLocalStorage<'all' | 'goal' | 'task'>('goalsViewTypeFilter', 'all');
  
  useEffect(() => {
    if (!itemToAutoOpen || isDataLoading) {
        return;
    }

    const { type, id, goalId } = itemToAutoOpen;

    const openItem = (itemType: 'goal' | 'task', itemId: string) => {
        const trigger = document.getElementById(`trigger-${itemType}-${itemId}`);
        if (trigger) {
            trigger.click();
            return true;
        }
        return false;
    };
    
    let timeoutId: NodeJS.Timeout | null = null;

    if (type === 'task' && goalId) {
        const goalCollapsibleTrigger = document.getElementById(`collapsible-trigger-goal-${goalId}`);
        if (goalCollapsibleTrigger) {
            const isClosed = goalCollapsibleTrigger.getAttribute('data-state') === 'closed';
            if (isClosed) {
                goalCollapsibleTrigger.click();
                timeoutId = setTimeout(() => {
                    openItem(type, id);
                }, 250); 
            } else {
                openItem(type, id);
            }
        }
    } else {
        openItem(type, id);
    }

    setItemToAutoOpen(null);
    
    return () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
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

  const topicGoals = goals.filter(goal => goal.topicId === selectedTopic.id);

  const filteredGoals = topicGoals.filter(goal => {
    if (typeFilter === 'task') return false; 
    if (statusFilters.length === 0) return true;
    return statusFilters.includes(goal.status);
  }).sort((a,b) => a.order - b.order);
  
  const filteredStandaloneTasks = tasks.filter(task => {
    // Must be a standalone task (no goalId)
    if (task.goalId) return false;
    
    // And it must belong to the selected topic
    if (task.topicId !== selectedTopic.id) return false;
    
    // And it must match the UI filters
    if (typeFilter === 'goal') return false;
    if (statusFilters.length > 0 && !statusFilters.includes(task.status)) return false;
    
    return true;
  });


  if (isDataLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
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
  }

  const priorityConfig: Record<GoalPriority, { color: string; icon: keyof typeof Icons, label: string }> = {
    'Thấp': { color: 'text-gray-500 dark:text-gray-400', icon: 'down', label: 'Ưu tiên: Thấp' },
    'Vừa': { color: 'text-blue-500 dark:text-blue-400', icon: 'ellipsis', label: 'Ưu tiên: Vừa' },
    'Cao': { color: 'text-red-500 dark:text-red-400', icon: 'up', label: 'Ưu tiên: Cao' },
  };
  
  return (
    <div className="space-y-6">
       <div className="flex items-start justify-between">
        <div>
            <h3 className="text-xl font-bold">Mục tiêu &amp; Nhiệm vụ</h3>
            {selectedTopic.description && <p className="text-muted-foreground mt-1 max-w-2xl">{selectedTopic.description}</p>}
        </div>
        <div className="flex gap-2 flex-shrink-0">
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
                    Trạng thái
                    {statusFilters.length > 0 && <Badge variant="secondary" className="ml-2 rounded">{statusFilters.length}</Badge>}
                    <Icons.down className="ml-2 h-4 w-4" />
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
      <DragDropContext onDragEnd={handleDragEnd}>
        {filteredGoals.length > 0 && (
          <Droppable droppableId={`goalsDroppable-${selectedTopic.id}`}>
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {filteredGoals.map((goal, index) => {
                  const endDate = getDateFromFirestore(goal.endDate);
                  const priority = goal.priority || 'Vừa';
                  const { color: priorityColor, icon: PriorityIcon, label: priorityLabel } = priorityConfig[priority];
                  const IconComponent = Icons[PriorityIcon] as React.ElementType;
                  const progress = calculateProgress(goal.id);

                  return (
                    <Draggable key={goal.id} draggableId={goal.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps}>
                          <Collapsible key={goal.id} asChild>
                            <Card className="overflow-hidden">
                              <div className="p-4">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex items-center gap-2 flex-1">
                                    <span {...provided.dragHandleProps} className="cursor-grab text-muted-foreground hover:text-foreground">
                                      <Icons.drag className="h-5 w-5" />
                                    </span>
                                    <CollapsibleTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" id={`collapsible-trigger-goal-${goal.id}`}>
                                        <Icons.down className="h-4 w-4 transition-transform [&[data-state=open]]:-rotate-90" />
                                      </Button>
                                    </CollapsibleTrigger>
                                    <h4 className="font-semibold text-base">{goal.title}</h4>
                                  </div>
                                  <div className="flex items-center flex-shrink-0">
                                      <EditGoalDialog goalId={goal.id}>
                                          <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-8 w-8"
                                              id={`trigger-goal-${goal.id}`}
                                          >
                                              <Icons.edit className="h-4 w-4" />
                                          </Button>
                                      </EditGoalDialog>
                                      <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
                                                  </DropdownMenuSubContent>
                                              </DropdownMenuPortal>
                                          </DropdownMenuSub>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem className="text-destructive" onClick={() => deleteGoal(goal.id)}>
                                          <Icons.delete className="mr-2 h-4 w-4" />
                                          Xóa mục tiêu
                                          </DropdownMenuItem>
                                      </DropdownMenuContent>
                                      </DropdownMenu>
                                  </div>
                                </div>
                                
                                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pl-12">
                                    <TooltipProvider>
                                      <Tooltip>
                                          <TooltipTrigger asChild>
                                              <Badge variant="outline" className={cn("capitalize", statusColors[goal.status])}>
                                                  <div className="w-2 h-2 rounded-full mr-2 bg-current"></div>
                                                  {goal.status}
                                              </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent><p>Trạng thái</p></TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                          <TooltipTrigger asChild>
                                              <div className={cn("flex items-center gap-1", priorityColor)}>
                                                  <IconComponent className="h-4 w-4" />
                                                  <span>{priority}</span>
                                              </div>
                                          </TooltipTrigger>
                                          <TooltipContent><p>{priorityLabel}</p></TooltipContent>
                                      </Tooltip>
                                      {endDate && (
                                         <Tooltip>
                                           <TooltipTrigger asChild>
                                              <div className="flex items-center gap-1">
                                                  <Icons.calendar className="h-4 w-4" />
                                                  <span>{format(endDate, 'd MMM, yyyy', { locale: vi })}</span>
                                                  <span className="hidden sm:inline">({formatDistanceToNow(endDate, { addSuffix: true, locale: vi })})</span>
                                              </div>
                                           </TooltipTrigger>
                                           <TooltipContent><p>Hạn chót</p></TooltipContent>
                                         </Tooltip>
                                      )}
                                    </TooltipProvider>
                                </div>
                              </div>

                              <CollapsibleContent>
                                <div className="px-4 pb-1">
                                   <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger className="w-full">
                                             <Progress value={progress} className="h-2 w-full" />
                                        </TooltipTrigger>
                                        <TooltipContent><p>{Math.round(progress)}% hoàn thành</p></TooltipContent>
                                    </Tooltip>
                                   </TooltipProvider>
                                </div>

                                {(goal.description || (goal.customProperties && Object.keys(goal.customProperties).length > 0)) && (
                                  <div className="px-4 pb-2 pt-4 space-y-4">
                                     {goal.description && (
                                        <div>
                                            <Label className="text-xs font-semibold text-muted-foreground">Mô tả</Label>
                                            <MarkdownRenderer className="text-sm">{goal.description}</MarkdownRenderer>
                                        </div>
                                     )}
                                     {goal.customProperties && Object.keys(goal.customProperties).length > 0 && (
                                        <div>
                                            <Label className="text-xs font-semibold text-muted-foreground">Thuộc tính</Label>
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
                                                    <span className="font-semibold mr-1.5">{key}:</span>
                                                    <span>{String(value)}</span>
                                                </Badge>
                                                );
                                            })}
                                            </div>
                                        </div>
                                     )}
                                  </div>
                                )}
                                
                                <div className="bg-secondary/50 p-4">
                                    <TaskList goalId={goal.id} />
                                </div>
                              </CollapsibleContent>
                            </Card>
                          </Collapsible>
                        </div>
                      )}
                    </Draggable>
                  )
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
      </DragDropContext>
      
      {(typeFilter === 'all' || typeFilter === 'task') && (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-base">Nhiệm vụ độc lập</h4>
                    <AddOrEditTaskDialog mode="add" topicId={selectedTopic.id}>
                        <Button variant="outline" size="sm">
                        <Icons.add className="mr-2 h-4 w-4" />
                        Thêm nhiệm vụ
                        </Button>
                    </AddOrEditTaskDialog>
                </div>
            </CardHeader>
            <CardContent>
                {filteredStandaloneTasks.length > 0 ? (
                    <TaskList tasks={filteredStandaloneTasks} />
                ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                        Không có nhiệm vụ độc lập nào trong chủ đề này.
                    </div>
                )}
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
                <AddOrEditTaskDialog mode="add" topicId={selectedTopic.id}>
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
