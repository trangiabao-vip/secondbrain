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
      addTask({ text: taskText.trim(), goalId });
      setTaskText('');
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        placeholder="Thêm nhiệm vụ nhanh và nhấn Enter..."
        value={taskText}
        onChange={(e) => setTaskText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
      />
      <AddOrEditTaskDialog mode="add" goalId={goalId}>
        <Button variant="secondary">
          <Icons.add className="h-4 w-4" />
        </Button>
      </AddOrEditTaskDialog>
    </div>
  );
}
