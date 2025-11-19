'use client';
import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useAppContext } from "@/contexts/AppContext";
import { format, isSameDay, startOfWeek, addDays, eachDayOfInterval, getHours, setHours, setMinutes, parseISO, getMinutes, differenceInMinutes, startOfDay, endOfDay, areIntervalsOverlapping, max, min } from "date-fns";
import { vi } from 'date-fns/locale';
import { Icons } from "../icons";
import { Button } from "../ui/button";
import { EditGoalDialog } from "../goals/EditGoalDialog";
import { EditTaskDialog } from "../tasks/EditTaskDialog";
import { Goal, Task } from "@/lib/data";
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

const calculateLayout = (items: ScheduledItem[]): PositionedItem[] => {
    const positionedItems: PositionedItem[] = [];
    
    const timedItems = items
        .map(item => {
            const startDate = getDateFromFirestore(item.startDate);
            if (!startDate) return null;
            const hasTime = getHours(startDate) !== 0 || getMinutes(startDate) !== 0;
            if (!hasTime) return null;

            let displayStart = startDate;
            let displayEnd = getDateFromFirestore(item.endDate) || setMinutes(startDate, getMinutes(startDate) + 30);
            
            const durationMinutes = differenceInMinutes(displayEnd, displayStart);
            if (durationMinutes <= 0) return null;

            const startHour = getHours(displayStart);
            const startMinutes = getMinutes(displayStart);
            const top = (startHour * 64) + (startMinutes / 60 * 64);
            const height = (durationMinutes / 60) * 64;
            
            return { ...item, top, height, startDate: displayStart, endDate: displayEnd };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    let columns: Array<typeof timedItems> = [];
    let lastEventEnding: Date | null = null;

    timedItems.forEach(event => {
        if (lastEventEnding && event.startDate >= lastEventEnding) {
            packColumns(columns, positionedItems);
            columns = [];
            lastEventEnding = null;
        }

        let placed = false;
        for (let i = 0; i < columns.length; i++) {
            const col = columns[i];
            const lastInCol = col[col.length - 1];
            if (lastInCol.endDate! <= event.startDate) {
                col.push(event);
                placed = true;
                break;
            }
        }

        if (!placed) {
            columns.push([event]);
        }

        if (!lastEventEnding || event.endDate! > lastEventEnding) {
            lastEventEnding = event.endDate;
        }
    });

    if (columns.length > 0) {
        packColumns(columns, positionedItems);
    }

    return positionedItems;
};


const packColumns = (columns: any[][], positionedItems: any[]) => {
    const numColumns = columns.length;
    for (let i = 0; i < numColumns; i++) {
        const col = columns[i];
        for (let j = 0; j < col.length; j++) {
            const event = col[j];
            positionedItems.push({
                ...event,
                width: 100 / numColumns,
                left: (i * 100) / numColumns,
            });
        }
    }
};


export function GlobalScheduleView() {
  const { goals, tasks } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());

  const week = useMemo(() => {
    const start = startOfWeek(currentDate, { locale: vi });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [currentDate]);

  const scheduledItems = useMemo((): ScheduledItem[] => {
    const goalItems: ScheduledItem[] = goals
        .filter(g => g.startDate)
        .map(g => ({ ...g, type: 'goal' as const, startDate: getDateFromFirestore(g.startDate)!, endDate: getDateFromFirestore(g.endDate) }))
        .filter(item => item.startDate);

    const taskItems: ScheduledItem[] = tasks
        .filter(t => t.startDate)
        .map(t => ({ ...t, type: 'task' as const, startDate: getDateFromFirestore(t.startDate)!, endDate: getDateFromFirestore(t.endDate) }))
        .filter(item => item.startDate);
        
    return [...goalItems, ...taskItems];
  }, [goals, tasks]);

  const getScheduledItemsForDay = (day: Date) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    return scheduledItems
      .filter(item => {
        const startDate = getDateFromFirestore(item.startDate);
        if (!startDate) return false;
        const endDate = getDateFromFirestore(item.endDate) || startDate;
        
        const itemInterval = { start: startDate, end: endDate };
        const dayInterval = { start: dayStart, end: dayEnd };

        return areIntervalsOverlapping(itemInterval, dayInterval);
      })
      .map(item => {
        const itemStart = getDateFromFirestore(item.startDate)!;
        const itemEnd = getDateFromFirestore(item.endDate) || itemStart;

        // Clamp the event's start and end times to the current day
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
  }

  const goToPreviousWeek = () => setCurrentDate(prev => addDays(prev, -7));
  const goToNextWeek = () => setCurrentDate(prev => addDays(prev, 6));
  const goToToday = () => setCurrentDate(new Date());

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
            Tháng {format(startOfWeek(currentDate, { locale: vi }), 'M, yyyy', { locale: vi })}
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
                return (
                  <div key={day.toISOString()} className="border-l">
                    <div className={`h-10 border-b text-center py-1 sticky top-0 bg-background z-10 ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>
                      <p className="text-xs">{format(day, 'eee', { locale: vi })}</p>
                      <p className="font-semibold text-lg">{format(day, 'd')}</p>
                    </div>
                    {/* All day section */}
                    <div className="h-10 border-b p-0.5 space-y-0.5 overflow-hidden">
                      {getItemsForAllday(day).map(item => (
                        <div key={`${item.type}-${item.id}`}>
                          {item.type === 'goal' ? (
                            <EditGoalDialog goalId={item.id}>
                              <div className="bg-primary/20 text-primary-foreground text-xs rounded-sm px-1 py-0.5 truncate border border-primary/50 cursor-pointer hover:bg-primary/30">
                                <Icons.goal className="h-3 w-3 inline mr-1 align-middle"/>
                                {(item as Goal).title}
                              </div>
                            </EditGoalDialog>
                          ) : (
                            <EditTaskDialog taskId={item.id}>
                               <div className="bg-secondary/80 text-secondary-foreground text-xs rounded-sm px-1 py-0.5 truncate border border-secondary/50 cursor-pointer hover:bg-secondary">
                                <Icons.task className="h-3 w-3 inline mr-1 align-middle"/>
                                {(item as Task).text}
                              </div>
                            </EditTaskDialog>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Hourly section */}
                    <div className="relative">
                      {hours.map(hour => (
                        <div key={hour} className="h-16 border-b relative"></div>
                      ))}
                      {layout.map(item => {
                          const content = (
                              <div
                                  className={cn(
                                      "absolute rounded-lg p-2 shadow-lg z-10 border cursor-pointer hover:bg-opacity-40 overflow-hidden",
                                      item.type === 'goal' 
                                          ? "bg-blue-900/30 border-blue-700 text-blue-100 hover:bg-blue-900/40"
                                          : "bg-slate-700/30 border-slate-500 text-slate-100 hover:bg-slate-700/40"
                                  )}
                                  style={{
                                      top: `${item.top}px`,
                                      height: `${Math.max(item.height - 2, 24)}px`,
                                      left: `${item.left}%`,
                                      width: `${item.width}%`,
                                  }}
                              >
                                  <p className="text-xs font-bold truncate flex items-center gap-1.5">
                                    {item.type === 'goal' ? <Icons.goal className="h-3 w-3"/> : <Icons.task className="h-3 w-3"/>}
                                    {item.type === 'goal' ? (item as Goal).title : (item as Task).text}
                                  </p>
                                  <p className={cn(
                                    "text-[10px]",
                                    item.type === 'goal' ? "text-blue-300" : "text-slate-300"
                                  )}>
                                    {item.startDate && format(item.startDate, 'HH:mm')}
                                    {item.endDate && ` - ${format(getDateFromFirestore(item.endDate)!, 'HH:mm')}`}
                                  </p>
                              </div>
                          );

                          if (item.type === 'goal') {
                            return (
                              <EditGoalDialog goalId={item.id} key={`${item.type}-${item.id}`}>
                                {content}
                              </EditGoalDialog>
                            );
                          } else {
                            return (
                              <EditTaskDialog taskId={item.id} key={`${item.type}-${item.id}`}>
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
