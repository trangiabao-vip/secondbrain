'use client';
import { useState, type ReactNode, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { format, setHours, setMinutes, parseISO } from "date-fns";
import { vi } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TaskStatus, TaskDifficulty, type Task } from '@/lib/data';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';

interface AddOrEditTaskDialogProps {
  taskId?: string;
  goalId?: string;
  children: ReactNode;
  mode: 'add' | 'edit';
}

const getDateFromFirestore = (date: any): Date | undefined => {
    if (!date) return undefined;
    if (typeof date === 'string') return parseISO(date);
    if (date.seconds) return new Date(date.seconds * 1000);
    if (date instanceof Date) return date;
    return undefined;
};


export function AddOrEditTaskDialog({ taskId, goalId: initialGoalId, children, mode }: AddOrEditTaskDialogProps) {
  const { getTaskById, updateTask, deleteTask, addTask, goals, selectedTopic, duplicateTask } = useAppContext();
  
  const [taskText, setTaskText] = useState('');
  const [notes, setNotes] = useState('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('Vừa');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('10:00');
  const [status, setStatus] = useState<TaskStatus>('chưa bắt đầu');
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(initialGoalId);
  const [customProperties, setCustomProperties] = useState<Array<{id: number, key: string, value: string}>>([]);
  const [isOpen, setIsOpen] = useState(false);

  const topicGoals = goals.filter(g => g.topicId === selectedTopic?.id);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && taskId) {
        const task = getTaskById(taskId);
        if (task) {
          setTaskText(task.text);
          setNotes(task.notes || '');
          setDifficulty(task.difficulty || 'Vừa');
          setStatus(task.status);
          setSelectedGoalId(task.goalId || undefined);
          
          const sDate = getDateFromFirestore(task.startDate);
          if (sDate) {
            setStartDate(sDate);
            setStartTime(format(sDate, "HH:mm"));
          } else {
            setStartDate(undefined);
            setStartTime('09:00');
          }

          const eDate = getDateFromFirestore(task.endDate);
          if (eDate) {
            setEndDate(eDate);
            setEndTime(format(eDate, "HH:mm"));
          } else {
            setEndDate(undefined);
            setEndTime('10:00');
          }

           if (task.customProperties) {
            setCustomProperties(
              Object.entries(task.customProperties).map(([key, value], index) => ({ id: index, key, value: String(value) }))
            );
          } else {
            setCustomProperties([]);
          }
        }
      } else {
        // Reset for 'add' mode
        setTaskText('');
        setNotes('');
        setDifficulty('Vừa');
        setStatus('chưa bắt đầu');
        setStartDate(undefined);
        setStartTime('09:00');
        setEndDate(undefined);
        setEndTime('10:00');
        setSelectedGoalId(initialGoalId);
        setCustomProperties([]);
      }
    }
  }, [isOpen, taskId, getTaskById, mode, initialGoalId]);

  const combineDateTime = (date: Date, time: string) => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        return setMinutes(setHours(date, hours), minutes);
      }
    } catch (e) { /* ignore time parsing errors */ }
    return date;
  }
  
  const handleAddProperty = () => {
    setCustomProperties([...customProperties, { id: Date.now(), key: '', value: '' }]);
  };

  const handleRemoveProperty = (id: number) => {
    setCustomProperties(customProperties.filter(p => p.id !== id));
  };
  
  const handlePropertyChange = (id: number, field: 'key' | 'value', text: string) => {
    setCustomProperties(customProperties.map(p => p.id === id ? { ...p, [field]: text } : p));
  };

  const handleSubmit = () => {
    if (taskText.trim()) {
      const finalStartDate = startDate ? combineDateTime(startDate, startTime) : null;
      const finalEndDate = endDate ? combineDateTime(endDate, endTime) : null;
      
      const customPropsObject = customProperties
        .filter(p => p.key.trim() !== '')
        .reduce((acc, prop) => {
          acc[prop.key.trim()] = prop.value;
          return acc;
        }, {} as { [key: string]: string });

      const taskData: Partial<Omit<Task, 'id'>> = {
        text: taskText.trim(),
        notes: notes,
        difficulty: difficulty,
        status: status,
        startDate: finalStartDate,
        endDate: finalEndDate,
        goalId: selectedGoalId === 'none' || selectedGoalId === undefined ? null : selectedGoalId,
        customProperties: customPropsObject,
      };

      if (mode === 'edit' && taskId) {
        updateTask(taskId, taskData);
      } else {
        // Only assign topicId when creating a new standalone task
        if (!taskData.goalId && selectedTopic) {
          taskData.topicId = selectedTopic.id;
        }
        addTask(taskData);
      }
      setIsOpen(false);
    }
  };

  const handleDeleteTask = () => {
    if (taskId) {
      deleteTask(taskId);
      setIsOpen(false);
    }
  }

  const handleDuplicateTask = () => {
    if (taskId) {
      duplicateTask(taskId);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Chỉnh sửa nhiệm vụ' : 'Thêm nhiệm vụ mới'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Cập nhật chi tiết nhiệm vụ của bạn.' : 'Thêm một nhiệm vụ mới vào một trong các mục tiêu của bạn.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[80vh] overflow-y-auto pr-4">
            <div className="space-y-2">
              <Label htmlFor="task-text-edit">Nhiệm vụ</Label>
              <Input
                id="task-text-edit"
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-notes">Ghi chú (Tùy chọn)</Label>
              <Textarea
                id="task-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thêm ghi chú hoặc chi tiết..."
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="task-goal">Mục tiêu (Tùy chọn)</Label>
              <Select value={selectedGoalId || 'none'} onValueChange={setSelectedGoalId}>
                <SelectTrigger id="task-goal">
                  <SelectValue placeholder="Chọn một mục tiêu (hoặc để trống)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có mục tiêu</SelectItem>
                  {topicGoals.map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="difficulty-edit">Độ khó</Label>
                <Select value={difficulty} onValueChange={(value: TaskDifficulty) => setDifficulty(value)}>
                    <SelectTrigger id="difficulty-edit">
                    <SelectValue placeholder="Chọn độ khó" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="Dễ">Dễ</SelectItem>
                    <SelectItem value="Vừa">Vừa</SelectItem>
                    <SelectItem value="Khó">Khó</SelectItem>
                    </SelectContent>
                </Select>
                </div>
                <div className="space-y-2">
                <Label htmlFor="status-edit-task">Trạng thái</Label>
                <Select value={status} onValueChange={(value: TaskStatus) => setStatus(value)}>
                    <SelectTrigger id="status-edit-task">
                    <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="chưa bắt đầu">Chưa bắt đầu</SelectItem>
                    <SelectItem value="đang làm">Đang làm</SelectItem>
                    <SelectItem value="hoàn thành">Hoàn thành</SelectItem>
                    <SelectItem value="thất bại">Thất bại</SelectItem>
                    </SelectContent>
                </Select>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date-edit">Thời gian bắt đầu (Tùy chọn)</Label>
              <div className="flex gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                    >
                        <Icons.calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP", { locale: vi }) : <span>Chọn một ngày</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        locale={vi}
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                {startDate && (
                    <Input 
                        type="time" 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-32"
                        step="900"
                    />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date-edit">Thời gian kết thúc (Tùy chọn)</Label>
              <div className="flex gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                    >
                        <Icons.calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: vi }) : <span>Chọn một ngày</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        locale={vi}
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                {endDate && (
                    <Input 
                        type="time" 
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-32"
                        step="900"
                    />
                )}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Thuộc tính tùy chỉnh</Label>
              <div className="space-y-2">
                {customProperties.map((prop) => (
                  <div key={prop.id} className="flex items-center gap-2">
                    <Input 
                      placeholder="Tên thuộc tính" 
                      value={prop.key}
                      onChange={(e) => handlePropertyChange(prop.id, 'key', e.target.value)}
                    />
                    <Input 
                      placeholder="Giá trị" 
                      value={prop.value}
                      onChange={(e) => handlePropertyChange(prop.id, 'value', e.target.value)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveProperty(prop.id)} className='flex-shrink-0'>
                      <Icons.delete className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={handleAddProperty} className='mt-2'>
                <Icons.add className='mr-2 h-4 w-4' />
                Thêm thuộc tính
              </Button>
            </div>
        </div>
        <DialogFooter className="sm:justify-between pt-2">
            {mode === 'edit' ? (
                <div className='flex gap-2'>
                    <Button variant="destructive" onClick={handleDeleteTask}>
                        <Icons.delete className="mr-2 h-4 w-4" />
                        Xóa
                    </Button>
                    <Button variant="secondary" onClick={handleDuplicateTask}>
                      <Icons.copy className="mr-2 h-4 w-4" />
                      Nhân bản
                    </Button>
                </div>
            ) : <div></div>}
            <Button type="submit" onClick={handleSubmit}>
                {mode === 'edit' ? 'Lưu thay đổi' : 'Thêm nhiệm vụ'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
