"use client";

import { DAYS_OF_WEEK } from "@/lib/constants/calendar";
import { cn } from "@/lib/utils";
import type { Event } from "@/types/db";

interface CalendarGridProps {
  year: number;
  month: number; // 1-12
  events: Event[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
}

interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
}

function getDaysInMonth(year: number, month: number): DayCell[] {
  const days: DayCell[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // First day of the month
  const firstDay = new Date(year, month - 1, 1);
  // Last day of the month
  const lastDay = new Date(year, month, 0);

  // Get the day of week for the first day (0 = Sunday, convert to Monday = 0)
  let startDayOfWeek = firstDay.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Add days from previous month
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 2, prevMonthLastDay - i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
      events: [],
    });
  }

  // Add days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month - 1, day);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      events: [],
    });
  }

  // Add days from next month to complete the grid (6 rows)
  const remainingDays = 42 - days.length; // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month, day);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
      events: [],
    });
  }

  return days;
}

function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function CalendarGrid({
  year,
  month,
  events,
  onDateClick,
  onEventClick,
}: CalendarGridProps) {
  const days = getDaysInMonth(year, month);

  // Map events to days
  const daysWithEvents = days.map((day) => {
    const dateStr = getDateString(day.date);
    const dayEvents = events.filter((event) => {
      const eventDate = event.start_date.split("T")[0];
      return eventDate === dateStr;
    });
    return { ...day, events: dayEvents };
  });

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header - Days of week */}
      <div className="grid grid-cols-7 bg-muted">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground border-b"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {daysWithEvents.map((day, index) => (
          <button
            type="button"
            key={index}
            onClick={() => onDateClick(day.date)}
            className={cn(
              "min-h-24 p-1 border-b border-r text-left transition-colors hover:bg-muted/50",
              !day.isCurrentMonth && "bg-muted/30 text-muted-foreground",
              day.isToday && "bg-primary/5"
            )}
          >
            <div
              className={cn(
                "text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full",
                day.isToday && "bg-primary text-primary-foreground"
              )}
            >
              {day.date.getDate()}
            </div>

            {/* Events for this day */}
            <div className="space-y-1">
              {day.events.slice(0, 3).map((event) => (
                <button
                  type="button"
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                  className="w-full text-left text-xs p-1 rounded truncate"
                  style={{
                    backgroundColor: `${event.color}20`,
                    color: event.color,
                  }}
                >
                  {event.title}
                </button>
              ))}
              {day.events.length > 3 && (
                <div className="text-xs text-muted-foreground px-1">
                  +{day.events.length - 3} más
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
