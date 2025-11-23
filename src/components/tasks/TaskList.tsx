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

const getDateFromFirestore = (date: any): Date | null => {
    if (!date) return null;
    if (typeof date === 'string') return parseISO(date);
    if (date.seconds) return new Date(date.seconds * 1000);
    if (date instanceof Date) return date;
    return null;
};

const difficultyColors: Record<TaskDifficulty, string> = {
    'Dễ': 'bg-green-500/20 text-green-700 border-green-500/30',
    'Vừa': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
    'Khó': 'bg-red-500/20 text-red-700 border-red-500/30',
};

const statusConfig: Record<TaskStatus, { color: string; label: string }> = {
    'chưa bắt đầu': { color: 'bg-gray-500', label: 'Chưa bắt đầu' },
    'đang làm': { color: 'bg-blue-500', label: 'Đang làm' },
    'hoàn thành': { color: 'bg-green-500', label: 'Hoàn thành' },
    'thất bại': { color: 'bg-red-500', label: 'Thất bại' },
    'huỷ': { color: 'bg-orange-500', label: 'Huỷ' },
};

export function TaskList({ goalId, tasks: customTasks }: { goalId?: string, tasks?: Task[] }) {
  const { tasks: allTasks, updateTask, deleteTask, isDataLoading, duplicateTask } = useAppContext();

  const tasksToRender = customTasks ? customTasks : allTasks.filter(task => task.goalId === goalId);

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
  
  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTask(taskId, { status });
  };

  return (
    <div className="space-y-4">
      {goalId && <h4 className="font-semibold">Công việc</h4>}
      <div className="space-y-2">
        {tasksToRender.map(task => {
          const startDate = getDateFromFirestore(task.startDate);
          const currentStatus = statusConfig[task.status];
          return (
            <div key={task.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-secondary/50 group">
              <Checkbox
                id={`task-check-${task.id}`}
                checked={task.status === 'hoàn thành'}
                onCheckedChange={(checked) => handleStatusChange(task.id, checked ? 'hoàn thành' : 'chưa bắt đầu')}
                className="mt-1"
                aria-label={`Mark task ${task.text} as complete`}
              />
              <div className="flex-grow">
                <AddOrEditTaskDialog taskId={task.id} mode="edit">
                  <span className="text-sm cursor-pointer">{task.text}</span>
                </AddOrEditTaskDialog>

                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge className="cursor-pointer">
                        <div className={cn("w-2 h-2 rounded-full mr-2", currentStatus.color)}></div>
                        {currentStatus.label}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {Object.entries(statusConfig).map(([statusKey, { label }]) => (
                        <DropdownMenuItem key={statusKey} onSelect={() => handleStatusChange(task.id, statusKey as TaskStatus)}>
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {task.difficulty && <Badge variant="outline" className={difficultyColors[task.difficulty]}>{task.difficulty}</Badge>}
                  
                  {startDate && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Icons.calendar className="h-3 w-3" />
                      {format(startDate, "d MMM, HH:mm", { locale: vi })}
                    </div>
                  )}
                </div>
                {task.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.notes}</p>}
                
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
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); deleteTask(task.id);}}>
                    <Icons.delete className="h-4 w-4 text-destructive" />
                  </Button>
              </div>
            </div>
          )}
        )}
      </div>
      {goalId && <AddTaskForm goalId={goalId} />}
    </div>
  );
}
