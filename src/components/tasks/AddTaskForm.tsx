'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/AppContext';
import { Icons } from '../icons';
import { AddOrEditTaskDialog } from './AddOrEditTaskDialog';

export function AddTaskForm({ goalId }: { goalId: string }) {
  const [taskText, setTaskText] = useState('');
  const { addTask } = useAppContext();

  const handleAddTask = () => {
    if (taskText.trim()) {
      addTask(taskText.trim(), goalId);
      setTaskText('');
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        placeholder="Thêm một công việc nhanh..."
        value={taskText}
        onChange={(e) => setTaskText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
      />
      <Button onClick={handleAddTask} variant="secondary">
        <Icons.add className="h-4 w-4" />
      </Button>
      <AddOrEditTaskDialog mode="add" goalId={goalId}>
        <Button variant="secondary" className="px-2.5">
            <Icons.ellipsis className="h-4 w-4" />
        </Button>
      </AddOrEditTaskDialog>
    </div>
  );
}
