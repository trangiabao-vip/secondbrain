'use client';
import { useAppContext } from "@/contexts/AppContext";
import { Checkbox } from "@/components/ui/checkbox";
import { AddTaskForm } from "./AddTaskForm";
import { Button } from "../ui/button";
import { Icons } from "../icons";
import { format } from "date-fns";
import { vi } from 'date-fns/locale';

export function TaskList({ goalId }: { goalId: string }) {
  const { tasks, updateTask, deleteTask } = useAppContext();
  const goalTasks = tasks.filter(task => task.goalId === goalId);

  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Công việc</h4>
      <div className="space-y-2">
        {goalTasks.map(task => (
          <div key={task.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-secondary/50 group">
            <Checkbox
              id={`task-${task.id}`}
              checked={task.completed}
              onCheckedChange={(checked) => updateTask(task.id, !!checked)}
              className="mt-1"
            />
            <div className="flex-grow">
                <label
                htmlFor={`task-${task.id}`}
                className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                >
                {task.text}
                </label>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                    <span>Tạo lúc: {format(new Date(task.createdAt), "HH:mm, dd/MM/yy", { locale: vi })}</span>
                    {task.scheduledDate && (
                        <div className="flex items-center gap-1">
                            <Icons.calendar className="h-3 w-3" />
                            {format(new Date(task.scheduledDate), "d MMM", { locale: vi })}
                        </div>
                    )}
                </div>
            </div>
            
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => deleteTask(task.id)}>
              <Icons.delete className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
      <AddTaskForm goalId={goalId} />
    </div>
  );
}
