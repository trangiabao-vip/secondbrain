'use client';
import { useState, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAppContext } from '@/contexts/AppContext';
import { Icons } from '../icons';
import { format } from "date-fns";
import { AIGoalSuggester } from '../ai/AIGoalSuggester';
import { Separator } from '../ui/separator';

export function AddGoalDialog({ children }: { children: ReactNode }) {
  const { addGoal, selectedTopic } = useAppContext();
  const [goalTitle, setGoalTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isOpen, setIsOpen] = useState(false);

  const handleAddGoal = () => {
    if (goalTitle.trim()) {
      addGoal(goalTitle.trim(), dueDate);
      setGoalTitle('');
      setDueDate(undefined);
      setIsOpen(false);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setGoalTitle(suggestion);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Goal</DialogTitle>
          <DialogDescription>
            Set a new goal for your topic: "{selectedTopic?.name}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="goal-title">Goal</Label>
              <Input
                id="goal-title"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g., 'Master React Hooks'"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date (Optional)</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                    >
                        <Icons.calendar className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex justify-end">
                <Button type="submit" onClick={handleAddGoal}>
                    Add Goal
                </Button>
            </div>
            <div className="relative">
                <Separator />
                <span className="absolute left-1/2 -top-3 -translate-x-1/2 bg-background px-2 text-xs text-muted-foreground">OR</span>
            </div>
            <AIGoalSuggester onSuggestionClick={handleSuggestion}/>
        </div>
      </DialogContent>
    </Dialog>
  );
}
