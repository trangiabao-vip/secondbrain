'use client';
import { useAppContext } from "@/contexts/AppContext";
import { Checkbox } from "@/components/ui/checkbox";
import { AddTaskForm } from "./AddTaskForm";
import { Button } from "../ui/button";
import { Icons } from "../icons";
import { format } from "date-fns";

export function TaskList({ goalId }: { goalId: string }) {
  const { tasks, updateTask, deleteTask } = useAppContext();
  const goalTasks = tasks.filter(task => task.goalId === goalId);

  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Tasks</h4>
      <div className="space-y-2">
        {goalTasks.map(task => (
          <div key={task.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 group">
            <Checkbox
              id={`task-${task.id}`}
              checked={task.completed}
              onCheckedChange={(checked) => updateTask(task.id, !!checked)}
            />
            <label
              htmlFor={`task-${task.id}`}
              className={`flex-grow text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}
            >
              {task.text}
            </label>
            {task.scheduledDate && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Icons.calendar className="h-3 w-3" />
                    {format(new Date(task.scheduledDate), "MMM d")}
                </div>
            )}
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
