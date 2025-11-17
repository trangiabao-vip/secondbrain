'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/AppContext';
import { Icons } from '../icons';

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
        placeholder="Add a new task..."
        value={taskText}
        onChange={(e) => setTaskText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
      />
      <Button onClick={handleAddTask} variant="secondary">
        <Icons.add className="h-4 w-4 mr-2" />
        Add Task
      </Button>
    </div>
  );
}
