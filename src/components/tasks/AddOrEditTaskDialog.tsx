'use client';
import { useState, type ReactNode, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAppContext } from '@/contexts/AppContext';
import { Icons } from '../icons';
import { format, setHours, setMinutes, parseISO, addDays, addWeeks, addMonths, isBefore, getDay } from "date-fns";
import { vi } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TaskStatus, TaskDifficulty, type Task, type RecurrenceRule, RecurrenceFrequency } from '@/lib/data';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { MarkdownRenderer } from '../ui/markdown-renderer';
import { Switch } from '../ui/switch';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';


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

function EditableMarkdown({ value, onChange, placeholder }: { value: string, onChange: (value: string) => void, placeholder: string }) {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="min-h-[150px] mt-2"
                onBlur={() => setIsEditing(false)}
                autoFocus
            />
        );
    }

    return (
        <div 
            className="min-h-[150px] mt-2 rounded-md border p-4 bg-secondary/50 cursor-text prose dark:prose-invert prose-sm max-w-none"
            onClick={() => setIsEditing(true)}
        >
            {value ? <MarkdownRenderer>{value}</MarkdownRenderer> : <p className="text-muted-foreground">{placeholder}</p>}
        </div>
    );
}

const generateRecurrenceDates = (rule: RecurrenceRule, startDate: Date | undefined, count = 5): Date[] => {
    if (!startDate) return [];

    const occurrences: Date[] = [];
    let currentDate = new Date(startDate);
    const ruleEndDate = getDateFromFirestore(rule.endDate);
    const dayNameToIndex: { [key: string]: number } = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

    while (occurrences.length < count && (!ruleEndDate || currentDate <= ruleEndDate)) {
        let validDay = false;
        switch (rule.frequency) {
            case 'daily':
                validDay = true;
                break;
            case 'weekly':
                if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
                    const currentDay = getDay(currentDate);
                    validDay = rule.daysOfWeek.some(day => dayNameToIndex[day] === currentDay);
                } else {
                    validDay = getDay(currentDate) === getDay(startDate);
                }
                break;
            case 'monthly':
                validDay = currentDate.getDate() === startDate.getDate();
                break;
        }

        if (validDay) {
            occurrences.push(new Date(currentDate));
        }

        switch (rule.frequency) {
            case 'daily':
                currentDate = addDays(currentDate, 1);
                break;
            case 'weekly':
                if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
                    currentDate = addDays(currentDate, 1);
                } else {
                    currentDate = addWeeks(currentDate, rule.interval || 1);
                }
                break;
            case 'monthly':
                currentDate = addMonths(currentDate, rule.interval || 1);
                break;
        }
    }
    
    // Complex weekly logic
    if (rule.frequency === 'weekly') {
        const weeklyOccurrences: Date[] = [];
        let weekSeed = new Date(startDate);
        
        while(weeklyOccurrences.length < count && (!ruleEndDate || weekSeed <= ruleEndDate)) {
             if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
                 rule.daysOfWeek.forEach(day => {
                     let dayIndex = dayNameToIndex[day];
                     let weekSeedDayIndex = getDay(weekSeed);
                     let dateInWeek = addDays(weekSeed, dayIndex - weekSeedDayIndex);

                     if(dateInWeek < startDate) return;

                      if (weeklyOccurrences.length < count && (!ruleEndDate || dateInWeek <= ruleEndDate)) {
                         weeklyOccurrences.push(dateInWeek);
                      }
                 })
             } else {
                if (weeklyOccurrences.length < count && (!ruleEndDate || weekSeed <= ruleEndDate)) {
                    weeklyOccurrences.push(new Date(weekSeed));
                }
             }
             weekSeed = addWeeks(weekSeed, rule.interval || 1);
        }
        return weeklyOccurrences.sort((a,b) => a.getTime() - b.getTime()).slice(0, count);
    }


    return occurrences;
};

function TaskDialogContent({ taskId, initialGoalId, mode, closeDialog }: { taskId?: string, initialGoalId?: string, mode: 'add' | 'edit', closeDialog: () => void }) {
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
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>({
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [],
  });

  const topicGoals = goals.filter(g => g.topicId === selectedTopic?.id);
  const isRecurringInstance = taskId?.includes('-recur-');
  const originalTaskId = isRecurringInstance ? taskId.split('-recur-')[0] : taskId;

  useEffect(() => {
    if (mode === 'edit' && taskId) {
      const task = getTaskById(originalTaskId!);
      if (task) {
        setTaskText(task.text);
        setNotes(task.notes || '');
        setDifficulty(task.difficulty || 'Vừa');
        
        let currentStatus = task.status;
        let sDate;

        if (isRecurringInstance) {
          const instanceTask = getTaskById(taskId);
          currentStatus = instanceTask?.status ?? 'chưa bắt đầu';
          const dateStr = taskId.split('-recur-')[1];
          sDate = parseISO(dateStr);
          const originalStartDate = getDateFromFirestore(task.startDate);
          if (originalStartDate) {
              sDate.setHours(originalStartDate.getHours(), originalStartDate.getMinutes());
          }
        } else {
            sDate = getDateFromFirestore(task.startDate);
        }

        setStatus(currentStatus);
        setSelectedGoalId(task.goalId || undefined);
        setStartDate(sDate);
        if (sDate) setStartTime(format(sDate, "HH:mm"));
        else setStartTime('09:00');
        
        let eDate;
        if (isRecurringInstance && task.startDate && task.endDate) {
            const originalStartDate = getDateFromFirestore(task.startDate)!;
            const originalEndDate = getDateFromFirestore(task.endDate)!;
            const duration = originalEndDate.getTime() - originalStartDate.getTime();
            eDate = new Date(sDate!.getTime() + duration);
        } else {
            eDate = getDateFromFirestore(task.endDate);
        }

        setEndDate(eDate);
        if (eDate) setEndTime(format(eDate, "HH:mm"));
        else setEndTime('10:00');

        if (task.customProperties) {
          setCustomProperties(
            Object.entries(task.customProperties).map(([key, value], index) => ({ id: index, key, value: String(value) }))
          );
        } else {
          setCustomProperties([]);
        }

        if (task.recurrence && !isRecurringInstance) {
          setIsRecurring(true);
          setRecurrenceRule(task.recurrence);
        } else {
          setIsRecurring(false);
          setRecurrenceRule({ frequency: 'weekly', interval: 1, daysOfWeek: [] });
        }
      }
    } else {
      setSelectedGoalId(initialGoalId);
    }
  }, [taskId, mode, getTaskById, initialGoalId, isRecurringInstance, originalTaskId]);

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
        recurrence: isRecurring && !isRecurringInstance ? recurrenceRule : null,
        customProperties: customPropsObject,
      };
      
      if (!taskData.goalId && selectedTopic) {
        taskData.topicId = selectedTopic.id;
      }

      if (mode === 'edit' && taskId) {
        updateTask(taskId, taskData);
      } else {
        addTask(taskData);
      }
      closeDialog();
    }
  };

  const handleDeleteSeries = () => {
    if (originalTaskId) {
      deleteTask(originalTaskId);
      closeDialog();
    }
  }

  const handleCancelInstance = () => {
    if (isRecurringInstance && taskId) {
       updateTask(taskId, { status: 'huỷ' });
      closeDialog();
    }
  }

  const handleDuplicateTask = () => {
    if (originalTaskId) {
      duplicateTask(originalTaskId);
      closeDialog();
    }
  };

  const handleRecurrenceChange = (field: keyof RecurrenceRule, value: any) => {
    setRecurrenceRule(prev => ({...prev, [field]: value}));
  }
  
  const recurrencePreviewDates = useMemo(() => {
    if (isRecurring && startDate) {
      return generateRecurrenceDates(recurrenceRule, startDate);
    }
    return [];
  }, [isRecurring, recurrenceRule, startDate]);

  const daysOfWeekMap = [
    { id: 'SU', label: 'CN' },
    { id: 'MO', label: 'T2' },
    { id: 'TU', label: 'T3' },
    { id: 'WE', label: 'T4' },
    { id: 'TH', label: 'T5' },
    { id: 'FR', label: 'T6' },
    { id: 'SA', label: 'T7' },
  ] as const;

  return (
    <>
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
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-notes">Ghi chú (Tùy chọn)</Label>
            <EditableMarkdown
                value={notes}
                onChange={setNotes}
                placeholder="Thêm ghi chú hoặc chi tiết... Hỗ trợ Markdown."
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
                  <SelectItem value="huỷ">Huỷ</SelectItem>
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
          <Separator/>
          <div className="space-y-4">
              <div className="flex items-center space-x-2">
                  <Switch id="recurrence-switch" checked={isRecurring} onCheckedChange={setIsRecurring} disabled={isRecurringInstance}/>
                  <Label htmlFor="recurrence-switch">Lặp lại nhiệm vụ</Label>
              </div>
              {isRecurring && (
                  <div className="grid gap-4 p-4 border rounded-lg">
                      <div className='flex items-center gap-2'>
                          Lặp lại mỗi
                          <Input 
                              type="number" 
                              className="w-16" 
                              value={recurrenceRule.interval}
                              onChange={e => handleRecurrenceChange('interval', parseInt(e.target.value) || 1)}
                              min="1"
                          />
                          <Select value={recurrenceRule.frequency} onValueChange={(v: RecurrenceFrequency) => handleRecurrenceChange('frequency', v)}>
                              <SelectTrigger className="w-32">
                                  <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="daily">Ngày</SelectItem>
                                  <SelectItem value="weekly">Tuần</SelectItem>
                                  <SelectItem value="monthly">Tháng</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      {recurrenceRule.frequency === 'weekly' && (
                          <div>
                              <Label className="mb-2 block">Vào các ngày</Label>
                              <ToggleGroup 
                                  type="multiple"
                                  variant="outline"
                                  value={recurrenceRule.daysOfWeek}
                                  onValueChange={v => handleRecurrenceChange('daysOfWeek', v)}
                              >
                                  {daysOfWeekMap.map(day => (
                                      <ToggleGroupItem key={day.id} value={day.id}>{day.label}</ToggleGroupItem>
                                  ))}
                              </ToggleGroup>
                          </div>
                      )}
                      <div>
                        <Label>Ngày kết thúc (Tùy chọn)</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className="w-full justify-start text-left font-normal mt-2"
                            >
                                <Icons.calendar className="mr-2 h-4 w-4" />
                                {recurrenceRule.endDate ? format(getDateFromFirestore(recurrenceRule.endDate)!, "PPP", { locale: vi }) : <span>Không bao giờ</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                locale={vi}
                                mode="single"
                                selected={getDateFromFirestore(recurrenceRule.endDate)}
                                onSelect={d => handleRecurrenceChange('endDate', d)}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                      </div>
                      <div className='mt-2'>
                          <Label className="mb-2 block">Xem trước</Label>
                          <div className="p-3 bg-muted/50 rounded-md">
                              {recurrencePreviewDates.length > 0 ? (
                                  <ul className='space-y-1 text-sm text-muted-foreground'>
                                  {recurrencePreviewDates.map((date, i) => (
                                      <li key={i}>{format(date, "EEEE, dd MMMM, yyyy", {locale: vi})}</li>
                                  ))}
                                  </ul>
                              ) : (
                                  <p className="text-sm text-muted-foreground">
                                      {startDate ? "Không có ngày lặp lại nào sắp tới." : "Vui lòng chọn ngày bắt đầu để xem trước."}
                                  </p>
                              )}
                          </div>
                      </div>
                  </div>
              )}
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
                  {isRecurringInstance ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="destructive">
                          <Icons.delete className="mr-2 h-4 w-4" />
                          Xóa...
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleCancelInstance}>
                          <Icons.close className="mr-2 h-4 w-4" />
                          Hủy bỏ nhiệm vụ này
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDeleteSeries} className="text-destructive">
                          <Icons.delete className="mr-2 h-4 w-4" />
                          Xóa toàn bộ chuỗi
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button variant="destructive" onClick={handleDeleteSeries}>
                      <Icons.delete className="mr-2 h-4 w-4" />
                      Xóa
                    </Button>
                  )}
                  <Button variant="secondary" onClick={handleDuplicateTask}>
                    <Icons.copy className="mr-2 h-4 w-4" />
                    Nhân bản
                  </Button>
              </div>
          ) : <div></div>}
          <div className='flex gap-2'>
              <DialogClose asChild>
                  <Button variant="outline">Hủy</Button>
              </DialogClose>
              <Button type="submit" onClick={handleSubmit}>
                  {mode === 'edit' ? 'Lưu thay đổi' : 'Thêm nhiệm vụ'}
              </Button>
          </div>
      </DialogFooter>
    </>
  );
}

export function AddOrEditTaskDialog({ taskId, goalId: initialGoalId, children, mode }: AddOrEditTaskDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        {isOpen && <TaskDialogContent taskId={taskId} initialGoalId={initialGoalId} mode={mode} closeDialog={() => setIsOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}
