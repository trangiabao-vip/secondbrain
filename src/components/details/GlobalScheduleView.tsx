'use client';
import { useState, useMemo, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useAppContext } from "@/contexts/AppContext";
import { format, isSameDay, startOfWeek, addDays, eachDayOfInterval, getHours, setHours, setMinutes, parseISO, getMinutes, differenceInMinutes, startOfDay, endOfDay, areIntervalsOverlapping, max, min, isBefore, getDay, addWeeks, addMonths, addMinutes } from "date-fns";
import { vi } from 'date-fns/locale';
import { Icons } from "../icons";
import { Button } from "../ui/button";
import { EditGoalDialog } from "../goals/EditGoalDialog";
import { EditTaskDialog } from "../tasks/EditTaskDialog";
import { Goal, Task, GoalStatus, RecurrenceRule } from "@/lib/data";
import { cn } from "@/lib/utils";

const hours = Array.from({ length: 24 }, (_, i) => i);

const getDateFromFirestore = (date: any): Date | null => {
    if (!date) return null;
    if (typeof date === 'string') return parseISO(date);
    if (date && typeof date.toDate === 'function') return date.toDate();
    if (date.seconds) return new Date(date.seconds * 1000);
    if (date instanceof Date) return date;
    return null;
};

type ScheduledItem = (Goal | Task) & { type: 'goal' | 'task', startDate: Date, endDate?: Date };
type PositionedItem = ScheduledItem & { top: number; height: number; left: number; width: number; };

const generateRecurrencesInRange = (task: Task, rangeStart: Date, rangeEnd: Date): Task[] => {
    if (!task.recurrence || !task.startDate) return [];

    const occurrences: Task[] = [];
    const rule = task.recurrence;
    const taskStartDate = getDateFromFirestore(task.startDate);
    if (!taskStartDate) return [];

    const taskDuration = task.endDate ? differenceInMinutes(getDateFromFirestore(task.endDate)!, taskStartDate) : 30;
    
    let currentDate = new Date(taskStartDate);
    const dayNameToIndex = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

    // Move to the first potential start date within or before the range
    while(currentDate < rangeStart && (!rule.endDate || currentDate < getDateFromFirestore(rule.endDate)!)) {
         switch (rule.frequency) {
            case 'daily':
                currentDate = addDays(currentDate, rule.interval || 1);
                break;
            case 'weekly':
                currentDate = addWeeks(currentDate, rule.interval || 1);
                break;
            case 'monthly':
                currentDate = addMonths(currentDate, rule.interval || 1);
                break;
        }
    }
     // Go back one step to include events starting just before the range but overlapping into it
    switch (rule.frequency) {
        case 'daily': currentDate = addDays(currentDate, -(rule.interval || 1)); break;
        case 'weekly': currentDate = addWeeks(currentDate, -(rule.interval || 1)); break;
        case 'monthly': currentDate = addMonths(currentDate, -(rule.interval || 1)); break;
    }


    for (let i = 0; i < 100; i++) { // Limit to 100 iterations to prevent infinite loops
        if (rule.endDate && currentDate > getDateFromFirestore(rule.endDate)!) {
            break;
        }
        if (currentDate > rangeEnd) {
            break;
        }

        if (rule.frequency === 'weekly' && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
            for (const day of rule.daysOfWeek) {
                const dayIndex = dayNameToIndex[day as keyof typeof dayNameToIndex];
                const currentDayIndex = getDay(currentDate);
                const dateInWeek = addDays(currentDate, dayIndex - currentDayIndex);

                if (isBefore(dateInWeek, taskStartDate)) {
                  continue;
                }

                if (dateInWeek >= rangeStart && dateInWeek <= rangeEnd) {
                     const occurrenceStartDate = new Date(dateInWeek);
                     occurrenceStartDate.setHours(getHours(taskStartDate), getMinutes(taskStartDate));
                     const occurrenceEndDate = addMinutes(occurrenceStartDate, taskDuration);
                    
                    occurrences.push({
                        ...task,
                        id: `${task.id}-recur-${dateInWeek.getTime()}`,
                        startDate: occurrenceStartDate,
                        endDate: occurrenceEndDate,
                        status: 'chưa bắt đầu', // Force status to 'not started' for recurring instances
                    });
                }
            }
        } else {
             if (currentDate >= rangeStart && currentDate <= rangeEnd && !isBefore(currentDate, taskStartDate)) {
                  const occurrenceStartDate = new Date(currentDate);
                  occurrenceStartDate.setHours(getHours(taskStartDate), getMinutes(taskStartDate));
                  const occurrenceEndDate = addMinutes(occurrenceStartDate, taskDuration);
                 occurrences.push({
                     ...task,
                     id: `${task.id}-recur-${currentDate.getTime()}`,
                     startDate: occurrenceStartDate,
                     endDate: occurrenceEndDate,
                     status: 'chưa bắt đầu', // Force status to 'not started' for recurring instances
                 });
             }
        }
        
        switch (rule.frequency) {
            case 'daily':
                currentDate = addDays(currentDate, rule.interval || 1);
                break;
            case 'weekly':
                currentDate = addWeeks(currentDate, rule.interval || 1);
                break;
            case 'monthly':
                currentDate = addMonths(currentDate, rule.interval || 1);
                break;
            default:
                return occurrences;
        }
    }

    return occurrences.filter((value, index, self) =>
      index === self.findIndex((t) => t.id === value.id)
    );
}


const calculateLayout = (items: ScheduledItem[]): PositionedItem[] => {
    const timedItems = items
        .map(item => {
            const startDate = getDateFromFirestore(item.startDate);
            if (!startDate) return null;
            const hasTime = getHours(startDate) !== 0 || getMinutes(startDate) !== 0;
            if (!hasTime && (!item.endDate || differenceInMinutes(getDateFromFirestore(item.endDate)!, startDate) >= 1440)) return null;

            let endDate = getDateFromFirestore(item.endDate) || setMinutes(startDate, getMinutes(startDate) + 30);
            return { ...item, startDate, endDate, top: 0, height: 0, left: 0, width: 0 };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    if (timedItems.length === 0) return [];

    let eventGroups: PositionedItem[][] = [];
    if (timedItems.length > 0) {
        let currentGroup: PositionedItem[] = [timedItems[0]];
        for (let i = 1; i < timedItems.length; i++) {
            const event = timedItems[i];
            const groupEndTime = currentGroup.reduce((maxEnd, ev) => (ev.endDate && ev.endDate > maxEnd ? ev.endDate : maxEnd), currentGroup[0].endDate!);

            if (event.startDate < groupEndTime) {
                currentGroup.push(event);
            } else {
                eventGroups.push(currentGroup);
                currentGroup = [event];
            }
        }
        eventGroups.push(currentGroup);
    }
    
    const finalLayout: PositionedItem[] = [];

    eventGroups.forEach(group => {
        const columns: PositionedItem[][] = [];
        group.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        group.forEach(event => {
            let placed = false;
            for (let i = 0; i < columns.length; i++) {
                const column = columns[i];
                const lastEventInColumn = column[column.length - 1];
                if (!lastEventInColumn || !areIntervalsOverlapping({start: event.startDate, end: event.endDate!}, {start: lastEventInColumn.startDate, end: lastEventInColumn.endDate!})) {
                    column.push(event);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                columns.push([event]);
            }
        });

        const numColumns = columns.length;
        columns.forEach((column, colIndex) => {
            column.forEach(event => {
                const startHour = getHours(event.startDate);
                const startMinutes = getMinutes(event.startDate);
                const top = (startHour * 64) + (startMinutes / 60 * 64);

                const durationMinutes = differenceInMinutes(event.endDate!, event.startDate);
                const height = (durationMinutes / 60) * 64;

                finalLayout.push({
                    ...event,
                    top,
                    height,
                    left: (100 / numColumns) * colIndex,
                    width: 100 / numColumns,
                });
            });
        });
    });

    return finalLayout;
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
    const rangeStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const rangeEnd = endOfDay(addDays(rangeStart, 6));

    const goalItems: ScheduledItem[] = goals
        .filter(g => g.startDate)
        .map(g => ({ ...g, type: 'goal' as const, startDate: getDateFromFirestore(g.startDate)!, endDate: getDateFromFirestore(g.endDate) }))
        .filter(item => item.startDate);

    const baseTasks: ScheduledItem[] = tasks
        .filter(t => t.startDate && !t.recurrence)
        .map(t => ({ ...t, type: 'task' as const, startDate: getDateFromFirestore(t.startDate)!, endDate: getDateFromFirestore(t.endDate) }))
        .filter(item => item.startDate);

    const recurringTaskInstances: ScheduledItem[] = tasks
        .filter(t => t.recurrence && t.startDate)
        .flatMap(t => generateRecurrencesInRange(t, rangeStart, rangeEnd))
        .map(t => ({ ...t, type: 'task' as const, startDate: getDateFromFirestore(t.startDate)!, endDate: getDateFromFirestore(t.endDate) }))
        .filter(item => item.startDate);
        
    return [...goalItems, ...baseTasks, ...recurringTaskInstances];
  }, [goals, tasks, currentDate]);

  const getScheduledItemsForDay = (day: Date) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    return scheduledItems
      .filter(item => {
        const startDate = getDateFromFirestore(item.startDate);
        if (!startDate) return false;
        const endDate = getDateFromFirestore(item.endDate) || setMinutes(startDate, getMinutes(startDate) + 30);
        
        const itemInterval = { start: startDate, end: endDate };
        const dayInterval = { start: dayStart, end: dayEnd };

        return areIntervalsOverlapping(itemInterval, dayInterval);
      })
      .map(item => {
        const itemStart = getDateFromFirestore(item.startDate)!;
        const itemEnd = getDateFromFirestore(item.endDate) || setMinutes(itemStart, getMinutes(itemStart) + 30);

        const displayStart = max([itemStart, dayStart]);
        const displayEnd = min([itemEnd, dayEnd]);

        return {
          ...item,
          startDate: displayStart,
          endDate: displayEnd,
        };
      });
  };
  
  const getItemsForAllday = (day: Date) => {
    return scheduledItems.filter(item => {
        const startDate = getDateFromFirestore(item.startDate);
        if (!startDate) return false;
        
        const hasTime = getHours(startDate) !== 0 || getMinutes(startDate) !== 0;

        return isSameDay(startDate, day) && !hasTime;
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
    <div className="flex gap-6 h-full">
      <div className="w-64 hidden @5xl/main:block">
        <div className="p-1">
          <Calendar
            locale={vi}
            mode="single"
            selected={currentDate}
            onSelect={(date) => date && setCurrentDate(date)}
            className="w-full"
          />
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between pb-4">
          <h2 className="text-xl font-bold">
            Tháng {format(startOfWeek(currentDate, { locale: vi, weekStartsOn: 0 }), 'M, yyyy', { locale: vi })}
          </h2>
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
              <div className="h-10 flex items-center justify-center border-b">Cả ngày</div>
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
                    <div className="h-10 border-b p-0.5 space-y-0.5 overflow-hidden">
                      {getItemsForAllday(day).map(item => {
                        const originalId = item.id.includes('-recur-') ? item.id.split('-recur-')[0] : item.id;
                        return (
                          <div key={item.id}>
                            {item.type === 'goal' ? (
                              <EditGoalDialog goalId={originalId}>
                                <div className="bg-primary/20 text-primary-foreground text-xs rounded-sm px-1 py-0.5 truncate border border-primary/50 cursor-pointer hover:bg-primary/30">
                                  <Icons.goal className="h-3 w-3 inline mr-1 align-middle"/>
                                  {(item as Goal).title}
                                </div>
                              </EditGoalDialog>
                            ) : (
                              <EditTaskDialog taskId={originalId}>
                                 <div className="bg-secondary/80 text-secondary-foreground text-xs rounded-sm px-1 py-0.5 truncate border border-secondary/50 cursor-pointer hover:bg-secondary">
                                  <Icons.task className="h-3 w-3 inline mr-1 align-middle"/>
                                  {(item as Task).text}
                                </div>
                              </EditTaskDialog>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Hourly section */}
                    <div className="relative">
                      {hours.map(hour => (
                        <div key={hour} className="h-16 border-b relative"></div>
                      ))}
                       {isToday && (
                          <div className="absolute w-full z-20" style={{ top: `${timeIndicatorTop}px` }}>
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
                                      height: `${Math.max(item.height - 2, 24)}px`,
                                      left: `calc(${item.left}% + 1px)`,
                                      width: `calc(${item.width}% - 2px)`,
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
                                    {item.endDate && ` - ${format(getDateFromFirestore(item.endDate)!, 'HH:mm')}`}
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
                              <EditTaskDialog taskId={originalId} key={item.id}>
                                {content}
                              </EditTaskDialog>
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
    </div>
  );
}
