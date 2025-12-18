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

type ScheduledItem = (Goal | Task) & { type: 'goal' | 'task', startDate: Date, endDate: Date };
type PositionedItem = ScheduledItem & { top: number; height: number; left: number; width: number; };

const calculateLayout = (items: ScheduledItem[]): PositionedItem[] => {
    const sortedItems = items
        .map(item => {
            const startDate = getDateFromFirestore(item.startDate);
            if (!startDate) return null;
            const hasTime = getHours(startDate) !== 0 || getMinutes(startDate) !== 0;
            const endDate = getDateFromFirestore(item.endDate) || addMinutes(startDate, 30);
            const duration = differenceInMinutes(endDate, startDate);

            if (!hasTime && duration >= 1440) return null;

            return { ...item, startDate, endDate };
        })
        .filter((item): item is ScheduledItem => !!item)
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    const positionedItems: PositionedItem[] = [];
    let i = 0;
    while (i < sortedItems.length) {
        let overlappingGroup: ScheduledItem[] = [sortedItems[i]];
        let groupEndTime = sortedItems[i].endDate;
        
        // Find all events that overlap with the current event or subsequent events in the group
        for (let j = i + 1; j < sortedItems.length; j++) {
            if (sortedItems[j].startDate < groupEndTime) {
                overlappingGroup.push(sortedItems[j]);
                if (sortedItems[j].endDate > groupEndTime) {
                    groupEndTime = sortedItems[j].endDate;
                }
            }
        }

        const columns: ScheduledItem[][] = [];
        overlappingGroup.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        for (const event of overlappingGroup) {
            let placed = false;
            for (let colIndex = 0; colIndex < columns.length; colIndex++) {
                const column = columns[colIndex];
                // Check if the event overlaps with ANY event in the current column
                const hasOverlap = column.some(e => areIntervalsOverlapping({start: e.startDate, end: e.endDate}, {start: event.startDate, end: event.endDate}));
                if (!hasOverlap) {
                    column.push(event);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                columns.push([event]);
            }
        }

        const numColumns = columns.length;
        for (let colIndex = 0; colIndex < numColumns; colIndex++) {
            for (const event of columns[colIndex]) {
                const top = (getHours(event.startDate) * 64) + (getMinutes(event.startDate) / 60 * 64);
                const height = differenceInMinutes(event.endDate, event.startDate) / 60 * 64;
                positionedItems.push({
                    ...event,
                    top,
                    height,
                    left: (100 / numColumns) * colIndex,
                    width: (100 / numColumns),
                });
            }
        }
        
        i += overlappingGroup.length;
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
                            <EditTaskDialog key={item.id} taskId={item.id}>
                              {content}
                            </EditTaskDialog>
                          );
                        }
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
                              <EditTaskDialog taskId={item.id} key={item.id}>
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

    