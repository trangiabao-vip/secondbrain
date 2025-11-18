

'use client';
import { useAppContext } from "@/contexts/AppContext";
import { Checkbox } from "@/components/ui/checkbox";
import { AddTaskForm } from "./AddTaskForm";
import { Button } from "../ui/button";
import { Icons } from "../icons";
import { format } from "date-fns";
import { vi } from 'date-fns/locale';
import { AddOrEditTaskDialog } from "./AddOrEditTaskDialog";
import { Skeleton } from "@/components/ui/skeleton";

export function TaskList({ goalId }: { goalId: string }) {
  const { tasks, updateTask, deleteTask, isDataLoading } = useAppContext();
  const goalTasks = tasks.filter(task => task.goalId === goalId);

  const getTaskDate = (date: any) => {
    if (!date) return null;
    if (typeof date === 'string') return new Date(date);
    if (date.seconds) return new Date(date.seconds * 1000);
    return null;
  }

  if (isDataLoading) {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold">Công việc</h4>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Công việc</h4>
      <div className="space-y-2">
        {goalTasks.map(task => {
          const createdAt = getTaskDate(task.createdAt);
          const scheduledDate = getTaskDate(task.scheduledDate);
          return (
            <AddOrEditTaskDialog taskId={task.id} mode="edit" key={task.id}>
              <div className="flex items-start gap-3 p-2 rounded-md hover:bg-secondary/50 group cursor-pointer">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.status === 'hoàn thành'}
                  onCheckedChange={(checked) => updateTask(task.id, checked ? 'hoàn thành' : 'chưa bắt đầu')}
                  className="mt-1"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-grow">
                    <label
                    htmlFor={`task-${task.id}`}
                    className={`text-sm ${task.status === 'hoàn thành' ? 'line-through text-muted-foreground' : ''}`}
                    >
                    {task.text}
                    </label>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        {createdAt && <span>Tạo lúc: {format(createdAt, "HH:mm, dd/MM/yy", { locale: vi })}</span>}
                        {scheduledDate && (
                            <div className="flex items-center gap-1">
                                <Icons.calendar className="h-3 w-3" />
                                {format(scheduledDate, "d MMM, HH:mm", { locale: vi })}
                            </div>
                        )}
                    </div>
                </div>
                
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteTask(task.id);}}>
                  <Icons.delete className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </AddOrEditTaskDialog>
          )}
        )}
      </div>
      <AddTaskForm goalId={goalId} />
    </div>
  );
}
