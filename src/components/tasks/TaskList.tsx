

'use client';
import { useAppContext } from "@/contexts/AppContext";
import { Checkbox } from "@/components/ui/checkbox";
import { AddTaskForm } from "./AddTaskForm";
import { Button } from "../ui/button";
import { Icons } from "../icons";
import { format, parseISO } from "date-fns";
import { vi } from 'date-fns/locale';
import { AddOrEditTaskDialog } from "./AddOrEditTaskDialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Task, TaskDifficulty, TaskStatus } from "@/lib/data";
import { Badge } from "../ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";
import { MarkdownRenderer } from "../ui/markdown-renderer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";

const getDateFromFirestore = (date: any): Date | null => {
    if (!date) return null;
    if (typeof date === 'string') return parseISO(date);
    if (date.seconds) return new Date(date.seconds * 1000);
    if (date instanceof Date) return date;
    return null;
};

const difficultyColors: Record<TaskDifficulty, string> = {
    'Dễ': 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300',
    'Vừa': 'border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
    'Khó': 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
};

const statusConfig: Record<TaskStatus, { color: string; label: string }> = {
    'chưa bắt đầu': { color: 'bg-gray-400', label: 'Chưa bắt đầu' },
    'đang làm': { color: 'bg-blue-500', label: 'Đang làm' },
    'hoàn thành': { color: 'bg-green-500', label: 'Hoàn thành' },
    'thất bại': { color: 'bg-red-500', label: 'Thất bại' },
};

interface TaskListProps {
  goalId?: string;
  tasks?: Task[];
}


export function TaskList({ goalId, tasks: customTasks }: TaskListProps) {
  const { tasks: allTasks, updateTask, deleteTask, isDataLoading, duplicateTask, goals, topics } = useAppContext();
  const [showCompleted, setShowCompleted] = useLocalStorage(`tasksShowCompleted-${goalId || 'standalone'}`, false);

  let tasksToRender: Task[];

  if (customTasks) {
    tasksToRender = customTasks;
  } else {
    tasksToRender = allTasks.filter(task => task.goalId === goalId);
  }
  
  tasksToRender.sort((a, b) => a.order - b.order);

  const filteredTasks = showCompleted ? tasksToRender : tasksToRender.filter(t => t.status !== 'hoàn thành');
  const completedCount = tasksToRender.filter(t => t.status === 'hoàn thành').length;


  if (isDataLoading) {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold">Công việc</h4>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        {goalId && <Skeleton className="h-10 w-full" />}
      </div>
    );
  }
  
  const handleStatusChange = (task: Task, status: TaskStatus) => {
    updateTask(task.id, { status });
  };
  
  if (tasksToRender.length === 0 && goalId) {
     return (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Công việc</h4>
          <p className="text-sm text-muted-foreground">Chưa có nhiệm vụ nào cho mục tiêu này.</p>
          {goalId && <AddTaskForm goalId={goalId} />}
        </div>
      )
  }

  if (tasksToRender.length === 0 && !goalId) {
    return null;
  }
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        {goalId && <h4 className="text-sm font-semibold text-muted-foreground">Công việc</h4>}
        {completedCount > 0 && (
          <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => setShowCompleted(!showCompleted)}>
            {showCompleted ? 'Ẩn' : 'Hiện'} {completedCount} nhiệm vụ đã hoàn thành
          </Button>
        )}
      </div>
      <div className="space-y-1">
        {filteredTasks.map((task, index) => {
          const startDate = getDateFromFirestore(task.startDate);
          const currentStatus = statusConfig[task.status];
          const parentGoal = task.goalId ? goals.find(g => g.id === task.goalId) : null;
          const parentTopic = parentGoal 
              ? topics.find(t => t.id === parentGoal.topicId) 
              : (task.topicId ? topics.find(t => t.id === task.topicId) : null);
          const isRecurringInstance = task.id.includes('-recur-');

          return (
            <div key={task.id} className={cn("flex items-start gap-3 p-2 rounded-md hover:bg-background/50 group", task.status === 'hoàn thành' && 'opacity-60')}>
              <Checkbox
                id={`task-check-${task.id}`}
                checked={task.status === 'hoàn thành'}
                onCheckedChange={(checked) => handleStatusChange(task, checked ? 'hoàn thành' : 'chưa bắt đầu')}
                className="mt-1"
                aria-label={`Mark task ${task.text} as complete`}
              />
              <div className="flex-grow">
                <AddOrEditTaskDialog taskId={task.id} mode="edit">
                  <button 
                    id={`trigger-task-${task.id}`}
                    className={cn("text-sm cursor-pointer text-left", task.status === 'hoàn thành' && 'line-through text-muted-foreground')}>
                      {task.text}
                  </button>
                </AddOrEditTaskDialog>

                {(parentTopic || parentGoal) && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5 pl-px">
                    {parentTopic && (
                      <div className="flex items-center gap-1.5">
                        <Icons.topic className="h-3 w-3" />
                        <span>{parentTopic.name}</span>
                      </div>
                    )}
                    {parentGoal && (
                      <div className="flex items-center gap-1.5">
                        {parentTopic && <Icons.right className="h-3 w-3" />}
                        <Icons.goal className="h-3 w-3" />
                        <span>{parentGoal.title}</span>
                      </div>
                    )}
                  </div>
                )}


                <div className="flex items-center gap-2 flex-wrap mt-2">
                    <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Badge variant="outline" className="cursor-pointer font-normal text-xs">
                                <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", currentStatus.color)}></div>
                                {currentStatus.label}
                            </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                            {Object.entries(statusConfig).map(([statusKey, { label }]) => (
                                <DropdownMenuItem key={statusKey} onSelect={() => handleStatusChange(task, statusKey as TaskStatus)}>
                                {label}
                                </DropdownMenuItem>
                            ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TooltipTrigger>
                        <TooltipContent><p>Trạng thái</p></TooltipContent>
                    </Tooltip>
                    </TooltipProvider>


                    {task.difficulty && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="outline" className={cn("font-normal text-xs", difficultyColors[task.difficulty])}>{task.difficulty}</Badge>
                            </TooltipTrigger>
                            <TooltipContent><p>Độ khó</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    )}
                    
                    {startDate && (
                        <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Icons.calendar className="h-3 w-3" />
                                {format(startDate, "d MMM, HH:mm", { locale: vi })}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent><p>Thời gian</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    )}

                    {task.recurrence && (
                    <TooltipProvider>
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Icons.recurrence className="h-3 w-3" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>Nhiệm vụ lặp lại</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    )}
                </div>
                {task.notes && <MarkdownRenderer className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.notes}</MarkdownRenderer>}
                
                {task.customProperties && Object.keys(task.customProperties).length > 0 && (
                    <div className="flex items-center gap-x-4 gap-y-2 flex-wrap mt-2">
                    {Object.entries(task.customProperties).map(([key, value]) => {
                        const lowerValue = String(value).toLowerCase();
                        if (lowerValue === 'true' || lowerValue === 'false') {
                            return (
                            <div key={key} className="flex items-center gap-2">
                                <Checkbox checked={lowerValue === 'true'} disabled id={`task-prop-${task.id}-${key}`} />
                                <Label htmlFor={`task-prop-${task.id}-${key}`} className="text-xs font-medium text-muted-foreground">
                                {key}
                                </Label>
                            </div>
                            );
                        }
                        return (
                            <Badge key={key} variant="outline" className="font-normal text-xs">
                            <span className="font-semibold mr-1">{key}:</span>
                            <span>{String(value)}</span>
                            </Badge>
                        );
                    })}
                    </div>
                )}
                </div>
                
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <AddOrEditTaskDialog taskId={task.id} mode="edit">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Icons.edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </AddOrEditTaskDialog>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); duplicateTask(task.id);}}>
                    <Icons.copy className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                                <Icons.delete className="h-4 w-4 text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {isRecurringInstance
                                        ? `Hành động này sẽ xóa toàn bộ chuỗi nhiệm vụ lặp lại "${task.text}".`
                                        : `Hành động này sẽ xóa nhiệm vụ "${task.text}".`}
                                    <br/><br/>
                                    Bạn có thể hoàn tác hành động này trong vài giây sau khi xóa.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={() => deleteTask(task.id)}
                                >
                                    Xóa
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
          )})}
      </div>
      {goalId && <AddTaskForm goalId={goalId} />}
    </div>
  );
}
