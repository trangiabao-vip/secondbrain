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
import type { Task, TaskDifficulty } from "@/lib/data";
import { Badge } from "../ui/badge";

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

  return (
    <div className="space-y-4">
      {goalId && <h4 className="font-semibold">Công việc</h4>}
      <div className="space-y-2">
        {tasksToRender.map(task => {
          const startDate = getDateFromFirestore(task.startDate);
          return (
            <AddOrEditTaskDialog taskId={task.id} mode="edit" key={task.id}>
              <div className="flex items-start gap-3 p-2 rounded-md hover:bg-secondary/50 group cursor-pointer">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.status === 'hoàn thành'}
                  onCheckedChange={(checked) => updateTask(task.id, {status: checked ? 'hoàn thành' : 'chưa bắt đầu'})}
                  className="mt-1"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-grow">
                    <div className="flex items-center gap-2 flex-wrap">
                         <label
                            htmlFor={`task-${task.id}`}
                            className={`text-sm ${task.status === 'hoàn thành' ? 'line-through text-muted-foreground' : ''}`}
                            >
                            {task.text}
                        </label>
                        {task.difficulty && <Badge variant="outline" className={difficultyColors[task.difficulty]}>{task.difficulty}</Badge>}
                    </div>
                    {(task.notes || startDate || (task.customProperties && Object.keys(task.customProperties).length > 0)) && (
                        <div className="text-xs text-muted-foreground flex flex-col items-start gap-1 mt-1">
                           {task.notes && <p className="line-clamp-2">{task.notes}</p>}
                            {startDate && (
                                <div className="flex items-center gap-1">
                                    <Icons.calendar className="h-3 w-3" />
                                    {format(startDate, "d MMM, HH:mm", { locale: vi })}
                                </div>
                            )}
                            {task.customProperties && Object.keys(task.customProperties).length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap mt-1">
                                {Object.entries(task.customProperties).map(([key, value]) => (
                                  <Badge key={key} variant="outline" className="font-normal text-xs">
                                    <span className="font-semibold mr-1">{key}:</span>
                                    <span>{value}</span>
                                  </Badge>
                                ))}
                              </div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); duplicateTask(task.id);}}>
                      <Icons.copy className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); deleteTask(task.id);}}>
                      <Icons.delete className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
              </div>
            </AddOrEditTaskDialog>
          )}
        )}
      </div>
      {goalId && <AddTaskForm goalId={goalId} />}
    </div>
  );
}
