'use client';
import { useState, useMemo, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useAppContext } from "@/contexts/AppContext";
import { format, isSameDay, startOfWeek, addDays, eachDayOfInterval, getHours, setHours, setMinutes, parseISO, getMinutes, differenceInMinutes, startOfDay, endOfDay, areIntervalsOverlapping, max, min, isBefore, getDay, addWeeks, addMonths, addMinutes } from "date-fns";
import { vi } from 'date-fns/locale';
import { Icons } from "../icons";
import { Button } from "../ui/button";
import { EditGoalDialog } from "../goals/EditGoalDialog";
import { AddOrEditTaskDialog } from "../tasks/AddOrEditTaskDialog";
import { Goal, Task, GoalStatus, RecurrenceRule } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AddGoalDialog } from "../goals/AddGoalDialog";
import { Separator } from "../ui/separator";

const hours = Array.from({ length: 24 }, (_, i) => i);

const getDateFromFirestore = (date: any): Date | null => {
    if (!date) return null;
    if (typeof date === 'string') return parseISO(date);
    if (date && typeof date.toDate === 'function') return date.toDate();
    if (date.seconds) return new Date(date.seconds * 1000);
    if (date instanceof Date) return date;
    return null;
};

type ScheduledItem = (Goal | Task) & { type: 'goal' | 'task', startDate: Date, endDate: Date };
type PositionedItem = ScheduledItem & { top: number; height: number; left: number; width: number; };

const generateRecurrencesInRange = (task: Task, rangeStart: Date, rangeEnd: Date): Task[] => {
    if (!task.recurrence || !task.startDate) return [];

    const instances: Task[] = [];
    const originalStartDate = getDateFromFirestore(task.startDate);
    if (!originalStartDate || originalStartDate > rangeEnd) return [];

    const duration = task.endDate ? differenceInMinutes(getDateFromFirestore(task.endDate)!, originalStartDate) : 30;

    let currentDate = originalStartDate;
    const ruleEndDate = task.recurrence.endDate ? getDateFromFirestore(task.recurrence.endDate) : null;
    const dayNameToIndex: { [key: string]: number } = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

    while (isBefore(currentDate, ruleEndDate || rangeEnd)) {
        if (isBefore(currentDate, rangeStart)) {
            // Move to next possible date if current is before range
             switch (task.recurrence.frequency) {
                case 'daily':
                    currentDate = addDays(currentDate, task.recurrence.interval || 1);
                    break;
                case 'weekly':
                    currentDate = addWeeks(currentDate, task.recurrence.interval || 1);
                    break;
                case 'monthly':
                    currentDate = addMonths(currentDate, task.recurrence.interval || 1);
                    break;
            }
            continue;
        }

        let isValidDay = false;
        switch (task.recurrence.frequency) {
            case 'daily':
                isValidDay = true;
                break;
            case 'weekly':
                 if (task.recurrence.daysOfWeek && task.recurrence.daysOfWeek.length > 0) {
                    const currentDayOfWeek = getDay(currentDate);
                    isValidDay = task.recurrence.daysOfWeek.includes(Object.keys(dayNameToIndex).find(key => dayNameToIndex[key as keyof typeof dayNameToIndex] === currentDayOfWeek) as any);
                } else {
                    isValidDay = getDay(currentDate) === getDay(originalStartDate);
                }
                break;
            case 'monthly':
                isValidDay = currentDate.getDate() === originalStartDate.getDate();
                break;
        }
        
        if (isValidDay) {
            const instanceStartDate = currentDate;
            const instanceEndDate = addMinutes(instanceStartDate, duration);
            if (areIntervalsOverlapping({ start: instanceStartDate, end: instanceEndDate }, { start: rangeStart, end: rangeEnd })) {
                instances.push({
                    ...task,
                    id: `${task.id}-recur-${format(instanceStartDate, 'yyyy-MM-dd')}`,
                    startDate: instanceStartDate,
                    endDate: instanceEndDate,
                    status: task.status, // We might want to check for exceptions here later
                    recurrence: null,
                });
            }
        }
        
        // Increment date
        if (task.recurrence.frequency === 'weekly' && task.recurrence.daysOfWeek && task.recurrence.daysOfWeek.length > 0) {
             currentDate = addDays(currentDate, 1);
        } else {
             switch (task.recurrence.frequency) {
                case 'daily':
                    currentDate = addDays(currentDate, task.recurrence.interval || 1);
                    break;
                case 'weekly':
                    currentDate = addWeeks(currentDate, task.recurrence.interval || 1);
                    break;
                case 'monthly':
                    currentDate = addMonths(currentDate, task.recurrence.interval || 1);
                    break;
            }
        }
    }
    return instances;
}

const calculateLayout = (items: ScheduledItem[]): PositionedItem[] => {
    // 1. Filter out all-day events and sort by start time
    const timedItems = items
        .map(item => ({
            ...item,
            startDate: getDateFromFirestore(item.startDate),
            endDate: getDateFromFirestore(item.endDate) || addMinutes(getDateFromFirestore(item.startDate)!, 30),
        }))
        .filter(item => {
            const hasTime = getHours(item.startDate!) !== 0 || getMinutes(item.startDate!) !== 0;
            const duration = differenceInMinutes(item.endDate!, item.startDate!);
            return hasTime || duration < 1440;
        })
        .sort((a, b) => a.startDate!.getTime() - b.startDate!.getTime() || b.endDate!.getTime() - a.endDate!.getTime());

    if (!timedItems.length) return [];

    // 2. Identify groups of overlapping events
    const eventGroups: ScheduledItem[][] = [];
    if (timedItems.length > 0) {
        let currentGroup = [timedItems[0]];
        let currentGroupEndTime = timedItems[0].endDate!.getTime();

        for (let i = 1; i < timedItems.length; i++) {
            const event = timedItems[i];
            if (event.startDate!.getTime() < currentGroupEndTime) {
                currentGroup.push(event);
                if (event.endDate!.getTime() > currentGroupEndTime) {
                    currentGroupEndTime = event.endDate!.getTime();
                }
            } else {
                eventGroups.push(currentGroup);
                currentGroup = [event];
                currentGroupEndTime = event.endDate!.getTime();
            }
        }
        eventGroups.push(currentGroup);
    }
    
    // 3. Position events within each group
    const positionedItems: PositionedItem[] = [];
    for (const group of eventGroups) {
        const columns: { events: ScheduledItem[], endTime: number }[] = [];
        group.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        for (const event of group) {
            let placed = false;
            for (const col of columns) {
                if (col.endTime <= event.startDate.getTime()) {
                    col.events.push(event);
                    col.endTime = event.endDate.getTime();
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                columns.push({ events: [event], endTime: event.endDate.getTime() });
            }
        }

        const numCols = columns.length;
        for (let i = 0; i < numCols; i++) {
            for (const event of columns[i].events) {
                const top = (getHours(event.startDate) * 64) + (getMinutes(event.startDate) / 60 * 64);
                const height = differenceInMinutes(event.endDate, event.startDate) / 60 * 64;
                positionedItems.push({
                    ...event,
                    top,
                    height: Math.max(height, 24),
                    left: (i / numCols) * 100,
                    width: (1 / numCols) * 100,
                });
            }
        }
    }

    return positionedItems;
};


export function GlobalScheduleView() {
  const { goals, tasks } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const week = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday as start of the week
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [currentDate]);

  const scheduledItems = useMemo((): ScheduledItem[] => {
    const rangeStart = startOfDay(startOfWeek(currentDate, { weekStartsOn: 0 }));
    const rangeEnd = endOfDay(addDays(rangeStart, 6));

    const goalItems: ScheduledItem[] = goals
        .filter(g => g.startDate && g.status !== 'huỷ')
        .map(g => ({ ...g, type: 'goal' as const, startDate: getDateFromFirestore(g.startDate)!, endDate: getDateFromFirestore(g.endDate) || addMinutes(getDateFromFirestore(g.startDate)!, 30) }))
        .filter((item): item is ScheduledItem => !!item.startDate);

    const baseTasks: ScheduledItem[] = tasks
        .filter(t => t.startDate && !t.recurrence && t.status !== 'huỷ')
        .map(t => ({ ...t, type: 'task' as const, startDate: getDateFromFirestore(t.startDate)!, endDate: getDateFromFirestore(t.endDate) || addMinutes(getDateFromFirestore(t.startDate)!, 30) }))
        .filter((item): item is ScheduledItem => !!item.startDate);

    const recurringTaskInstances: ScheduledItem[] = tasks
        .filter(t => t.recurrence && t.startDate)
        .flatMap(t => generateRecurrencesInRange(t, rangeStart, rangeEnd))
        .map(t => ({ ...t, type: 'task' as const, startDate: getDateFromFirestore(t.startDate)!, endDate: getDateFromFirestore(t.endDate)!, status: t.status || 'chưa bắt đầu' }))
        .filter((item): item is ScheduledItem => !!item.startDate)
        .filter(item => !tasks.some(existingTask => existingTask.id === item.id) && item.status !== 'huỷ');
        
    return [...goalItems, ...baseTasks, ...recurringTaskInstances];
  }, [goals, tasks, currentDate]);

  const getScheduledItemsForDay = (day: Date): ScheduledItem[] => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const dayItems: ScheduledItem[] = [];

    scheduledItems.forEach(item => {
        const itemStart = getDateFromFirestore(item.startDate);
        if (!itemStart) return;

        const itemEnd = getDateFromFirestore(item.endDate) || addMinutes(itemStart, 30);
        
        if (areIntervalsOverlapping({ start: itemStart, end: itemEnd }, { start: dayStart, end: dayEnd })) {
            const displayStart = max([itemStart, dayStart]);
            const displayEnd = min([itemEnd, dayEnd]);
            
            dayItems.push({
                ...item,
                startDate: displayStart,
                endDate: displayEnd,
            });
        }
    });

    return dayItems;
};
  
  const getItemsForAllday = (day: Date) => {
    return scheduledItems.filter(item => {
        const startDate = getDateFromFirestore(item.startDate);
        if (!startDate) return false;
        
        const hasTime = getHours(startDate) !== 0 || getMinutes(startDate) !== 0;
        const endDate = getDateFromFirestore(item.endDate)
        if(!endDate) return false;
        
        if(hasTime) return false;

        const isMultiDay = differenceInMinutes(endDate, startDate) >= 1440;

        return isSameDay(startDate, day) || (isMultiDay && areIntervalsOverlapping({ start: day, end: endOfDay(day) }, { start: startDate, end: endDate }));
    });
  };

  const goToPreviousWeek = () => setCurrentDate(prev => addDays(prev, -7));
  const goToNextWeek = () => setCurrentDate(prev => addDays(prev, 7));
  const goToToday = () => setCurrentDate(new Date());

  const statusColors: Record<GoalStatus, string> = {
    'chưa bắt đầu': 'bg-gray-500/80 border-gray-700 hover:bg-gray-500',
    'đang làm': 'bg-blue-500/80 border-blue-700 hover:bg-blue-500',
    'hoàn thành': 'bg-green-500/80 border-green-700 hover:bg-green-500',
    'thất bại': 'bg-red-500/80 border-red-700 hover:bg-red-500',
    'huỷ': 'bg-orange-500/80 border-orange-700 hover:bg-orange-500',
  }

  const timeIndicatorTop = (getHours(currentTime) + getMinutes(currentTime) / 60) * 64;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">
                Tháng {format(currentDate, 'M, yyyy', { locale: vi })}
            </h2>
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <Icons.calendar className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                <Calendar
                    locale={vi}
                    mode="single"
                    selected={currentDate}
                    onSelect={(date) => date && setCurrentDate(date)}
                    className="w-full"
                />
                </PopoverContent>
            </Popover>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek} className="h-8 w-8">
            <Icons.left className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>Hôm nay</Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek} className="h-8 w-8">
            <Icons.right className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[auto,1fr] min-w-[1000px]">
          {/* Time column */}
          <div className="w-16 text-xs text-center text-muted-foreground sticky left-0 bg-background z-20">
            <div className="h-10 border-b"></div>
            <div className="h-28 flex items-center justify-center border-b">Cả ngày</div>
            {hours.map(hour => (
              <div key={hour} className="h-16 text-right pr-2 relative">
                <span className="relative -top-2">
                  {format(setMinutes(setHours(new Date(), hour), 0), 'HH:00')}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="grid grid-cols-7">
            {week.map(day => {
              const dayItems = getScheduledItemsForDay(day);
              const layout = calculateLayout(dayItems);
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className="border-l relative">
                  <div className={`h-10 border-b text-center py-1 sticky top-0 bg-background z-10 ${isToday ? 'text-primary' : ''}`}>
                    <p className="text-xs">{format(day, 'eee', { locale: vi })}</p>
                    <p className="font-semibold text-lg">{format(day, 'd')}</p>
                  </div>
                  {/* All day section */}
                  <div className="h-28 border-b p-1 space-y-1 overflow-y-auto">
                    {getItemsForAllday(day).map(item => {
                      const originalId = item.id.includes('-recur-') ? item.id.split('-recur-')[0] : item.id;
                      const content = (
                         <div className={cn(
                          "text-xs rounded-sm px-1.5 py-0.5 whitespace-nowrap border cursor-pointer hover:bg-opacity-80 flex items-center gap-1.5",
                           item.type === 'goal'
                            ? 'bg-blue-500/20 text-blue-900 border-blue-500/50 dark:text-blue-200'
                            : 'bg-secondary/80 text-secondary-foreground border-secondary-foreground/50'
                        )}>
                           {item.type === 'goal' ? <Icons.goal className="h-3 w-3 flex-shrink-0" /> : <Icons.task className="h-3 w-3 flex-shrink-0" />}
                          <span className="truncate">{(item as Goal).title || (item as Task).text}</span>
                        </div>
                      );

                      if (item.type === 'goal') {
                        return (
                          <EditGoalDialog key={item.id} goalId={originalId}>
                            {content}
                          </EditGoalDialog>
                        );
                      } else {
                        return (
                          <AddOrEditTaskDialog key={item.id} mode="edit" taskId={item.id}>
                            {content}
                          </AddOrEditTaskDialog>
                        );
                      }
                    })}
                  </div>

                  {/* Hourly section */}
                  <div className="relative">
                    {hours.map(hour => {
                        const slotDate = setMinutes(setHours(day, hour), 0);
                        return (
                        <Popover key={hour}>
                            <PopoverTrigger asChild>
                            <div className="h-16 border-b relative group cursor-pointer">
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-primary/10 transition-opacity flex items-center justify-center">
                                    <Icons.add className="h-6 w-6 text-primary/70" />
                                </div>
                            </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2" align="start">
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium text-muted-foreground px-2 py-1">Tạo lúc {format(slotDate, 'HH:mm')}</p>
                                <Separator />
                                <AddOrEditTaskDialog mode="add" startDate={slotDate}>
                                <Button variant="ghost" className="w-full justify-start">
                                    <Icons.task className="mr-2 h-4 w-4" />
                                    Nhiệm vụ mới
                                </Button>
                                </AddOrEditTaskDialog>
                                <AddGoalDialog startDate={slotDate}>
                                <Button variant="ghost" className="w-full justify-start">
                                    <Icons.goal className="mr-2 h-4 w-4" />
                                    Mục tiêu mới
                                </Button>
                                </AddGoalDialog>
                            </div>
                            </PopoverContent>
                        </Popover>
                        );
                    })}
                     {isToday && (
                        <div className="absolute w-full z-20 pointer-events-none" style={{ top: `${timeIndicatorTop}px` }}>
                            <div className="relative">
                                <div className="h-0.5 bg-red-500"></div>
                                <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500"></div>
                            </div>
                        </div>
                    )}
                    {layout.map(item => {
                        const originalId = item.id.includes('-recur-') ? item.id.split('-recur-')[0] : item.id;
                        const content = (
                            <div
                                className={cn(
                                    "absolute rounded-lg p-2 shadow-sm z-10 border cursor-pointer hover:bg-opacity-90 overflow-hidden text-white",
                                    statusColors[item.status]
                                )}
                                style={{
                                    top: `${item.top}px`,
                                    height: `${Math.max(item.height, 24)}px`,
                                    left: `${item.left}%`,
                                    width: `${item.width}%`,
                                }}
                            >
                                <p className="text-xs font-bold truncate flex items-center gap-1.5">
                                  {item.type === 'goal' ? <Icons.goal className="h-3 w-3"/> : <Icons.task className="h-3 w-3"/>}
                                  {item.type === 'goal' ? (item as Goal).title : (item as Task).text}
                                </p>
                                <p className={cn(
                                  "text-[10px] opacity-80"
                                )}>
                                  {item.startDate && format(item.startDate, 'HH:mm')}
                                  {item.endDate && ` - ${format(item.endDate, 'HH:mm')}`}
                                </p>
                            </div>
                        );

                        if (item.type === 'goal') {
                          return (
                            <EditGoalDialog goalId={originalId} key={item.id}>
                              {content}
                            </EditGoalDialog>
                          );
                        } else {
                          return (
                            <AddOrEditTaskDialog taskId={item.id} mode="edit" key={item.id}>
                              {content}
                            </AddOrEditTaskDialog>
                          );
                        }
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
