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
import { format, setHours, setMinutes, parse } from "date-fns";
import { vi } from 'date-fns/locale';
import { Checkbox } from '../ui/checkbox';

export function EditTaskDialog({ taskId, children }: { taskId: string, children: ReactNode }) {
  const { getTaskById, updateTask, deleteTask } = useAppContext();
  const [taskText, setTaskText] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [time, setTime] = useState('09:00');
  const [completed, setCompleted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const task = getTaskById(taskId);
      if (task) {
        setTaskText(task.text);
        setCompleted(task.completed);
        if (task.scheduledDate) {
            const date = new Date(task.scheduledDate);
            setScheduledDate(date);
            setTime(format(date, "HH:mm"));
        } else {
            setScheduledDate(undefined);
            setTime('09:00');
        }
      }
    }
  }, [isOpen, taskId, getTaskById]);

  const handleUpdateTask = () => {
    if (taskText.trim()) {
      let finalDate: Date | undefined = scheduledDate;
      if (finalDate) {
        try {
            const [hours, minutes] = time.split(':').map(Number);
            if (!isNaN(hours) && !isNaN(minutes)) {
                let tempDate = setHours(scheduledDate!, hours);
                finalDate = setMinutes(tempDate, minutes);
            }
        } catch (e) {
            // ignore time parsing errors, proceed with date only
        }
      }
      updateTask(taskId, completed, taskText.trim(), finalDate);
      setIsOpen(false);
    }
  };

  const handleDeleteTask = () => {
    deleteTask(taskId);
    setIsOpen(false);
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
        setScheduledDate(undefined);
        return;
    }
    let newDate = date;
    try {
        const [hours, minutes] = time.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
            newDate = setHours(newDate, hours);
            newDate = setMinutes(newDate, minutes);
        }
    } catch(e) {
        // time not set yet or invalid format
    }
    setScheduledDate(newDate);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa nhiệm vụ</DialogTitle>
          <DialogDescription>
            Cập nhật chi tiết nhiệm vụ của bạn.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="task-text-edit">Nhiệm vụ</Label>
              <Input
                id="task-text-edit"
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled-date-edit">Ngày đã lên lịch (Tùy chọn)</Label>
              <div className="flex gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                    >
                        <Icons.calendar className="mr-2 h-4 w-4" />
                        {scheduledDate ? format(scheduledDate, "PPP", { locale: vi }) : <span>Chọn một ngày</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        locale={vi}
                        mode="single"
                        selected={scheduledDate}
                        onSelect={handleDateSelect}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                {scheduledDate && (
                    <Input 
                        type="time" 
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-32"
                        step="900"
                    />
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="completed-edit" checked={completed} onCheckedChange={(checked) => setCompleted(!!checked)} />
              <Label htmlFor="completed-edit">Hoàn thành</Label>
            </div>
            <div className="flex justify-between">
                <Button variant="destructive" onClick={handleDeleteTask}>
                    <Icons.delete className="mr-2 h-4 w-4" />
                    Xóa
                </Button>
                <Button type="submit" onClick={handleUpdateTask}>
                    Lưu thay đổi
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
