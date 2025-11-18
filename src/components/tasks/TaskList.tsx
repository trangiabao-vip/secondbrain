

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
import type { Task } from "@/lib/data";

const getDateFromFirestore = (date: any): Date | null => {
    if (!date) return null;
    if (typeof date === 'string') return parseISO(date);
    if (date.seconds) return new Date(date.seconds * 1000);
    if (date instanceof Date) return date;
    return null;
};

export function TaskList({ goalId, tasks: customTasks }: { goalId?: string, tasks?: Task[] }) {
  const { tasks: allTasks, updateTask, deleteTask, isDataLoading } = useAppContext();

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

  return (
    <div className="space-y-4">
      {goalId && <h4 className="font-semibold">Công việc</h4>}
      <div className="space-y-2">
        {tasksToRender.map(task => {
          const createdAt = getDateFromFirestore(task.createdAt);
          const startDate = getDateFromFirestore(task.startDate);
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
                        {startDate && (
                            <div className="flex items-center gap-1">
                                <Icons.calendar className="h-3 w-3" />
                                {format(startDate, "d MMM, HH:mm", { locale: vi })}
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
      {goalId && <AddTaskForm goalId={goalId} />}
    </div>
  );
}
