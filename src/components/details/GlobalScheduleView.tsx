'use client';
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useAppContext } from "@/contexts/AppContext";
import { format, isSameDay, startOfWeek, addDays, eachDayOfInterval, getHours, setHours, setMinutes, isSameHour } from "date-fns";
import { vi } from 'date-fns/locale';
import { Icons } from "../icons";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

const hours = Array.from({ length: 24 }, (_, i) => i);

export function GlobalScheduleView() {
  const { goals, tasks } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());

  const week = useMemo(() => {
    const start = startOfWeek(currentDate, { locale: vi });
    const end = addDays(start, 6);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const scheduledItems = useMemo(() => [
    ...goals.filter(g => g.dueDate).map(g => ({ ...g, type: 'goal' as const, date: new Date(g.dueDate!) })),
    ...tasks.filter(t => t.scheduledDate).map(t => ({ ...t, type: 'task' as const, date: new Date(t.scheduledDate!) }))
  ], [goals, tasks]);

  const getItemsForHour = (day: Date, hour: number) => {
    const startOfHour = setMinutes(setHours(day, hour), 0);
    return scheduledItems.filter(item => 
      isSameDay(item.date, day) && isSameHour(item.date, startOfHour)
    );
  };
  
  const getItemsForAllday = (day: Date) => {
    return scheduledItems.filter(item => 
      isSameDay(item.date, day) && item.type === 'goal'
    );
  }

  const goToPreviousWeek = () => {
    setCurrentDate(prev => addDays(prev, -7));
  }

  const goToNextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7));
  }

  const goToToday = () => {
    setCurrentDate(new Date());
  }

  return (
    <div className="flex gap-6 h-full">
      <div className="w-64 hidden @4xl/main:block">
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
            {format(startOfWeek(currentDate, { locale: vi }), 'MMMM yyyy', { locale: vi })}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <Icons.left className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>Hôm nay</Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <Icons.right className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-[auto,1fr] min-w-[800px]">
            {/* Time column */}
            <div className="w-16">
              <div className="h-10 border-b border-border"></div>
              <div className="h-10 border-b border-border text-center text-xs pt-1">Cả ngày</div>
              {hours.map(hour => (
                <div key={hour} className="h-24 text-right pr-2">
                  <span className="text-xs text-muted-foreground relative -top-2">
                    {format(setHours(new Date(), hour), 'haaa')}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="grid grid-cols-7">
              {week.map(day => (
                <div key={day.toISOString()} className="border-l border-border">
                  <div className="h-10 border-b border-border text-center py-2">
                    <p className="text-xs text-muted-foreground">{format(day, 'eee', { locale: vi })}</p>
                    <p className={`font-semibold text-lg ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>{format(day, 'd')}</p>
                  </div>
                  {/* All day section */}
                  <div className="h-10 border-b border-border p-1 space-y-1 overflow-hidden">
                    {getItemsForAllday(day).map(item => (
                      <div key={`${item.type}-${item.id}`} className="bg-green-800/50 text-white text-xs rounded px-1 py-0.5 truncate">
                        <Icons.goal className="h-3 w-3 inline mr-1"/>
                        {item.title}
                      </div>
                    ))}
                  </div>

                  {/* Hourly section */}
                  <div className="relative">
                    {hours.map(hour => (
                      <div key={hour} className="h-24 border-b border-border relative p-1">
                        {getItemsForHour(day, hour).map(item => (
                            <div key={`${item.type}-${item.id}`} className="absolute inset-x-1 bg-secondary rounded-lg p-2 shadow z-10">
                                <p className="text-xs font-bold truncate">{item.type === 'task' ? item.text : item.title}</p>
                                <p className="text-xs text-muted-foreground">{format(item.date, 'HH:mm')}</p>
                            </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
