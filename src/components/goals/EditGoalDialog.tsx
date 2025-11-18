'use client';
import { useState, type ReactNode, useEffect } from 'react';
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
import { vi } from 'date-fns/locale';

export function EditGoalDialog({ goalId, children }: { goalId: string, children: ReactNode }) {
  const { getGoalById, updateGoal, deleteGoal } = useAppContext();
  const [goalTitle, setGoalTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const goal = getGoalById(goalId);
      if (goal) {
        setGoalTitle(goal.title);
        setDueDate(goal.dueDate ? new Date(goal.dueDate) : undefined);
      }
    }
  }, [isOpen, goalId, getGoalById]);

  const handleUpdateGoal = () => {
    if (goalTitle.trim()) {
      updateGoal(goalId, goalTitle.trim(), dueDate);
      setIsOpen(false);
    }
  };

  const handleDeleteGoal = () => {
    deleteGoal(goalId);
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa mục tiêu</DialogTitle>
          <DialogDescription>
            Cập nhật chi tiết mục tiêu của bạn.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="goal-title-edit">Mục tiêu</Label>
              <Input
                id="goal-title-edit"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="ví dụ: 'Thành thạo React Hooks'"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-date-edit">Hạn chót (Tùy chọn)</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                    >
                        <Icons.calendar className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP", { locale: vi }) : <span>Chọn một ngày</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        locale={vi}
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex justify-between">
                <Button variant="destructive" onClick={handleDeleteGoal}>
                    <Icons.delete className="mr-2 h-4 w-4" />
                    Xóa
                </Button>
                <Button type="submit" onClick={handleUpdateGoal}>
                    Lưu thay đổi
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
