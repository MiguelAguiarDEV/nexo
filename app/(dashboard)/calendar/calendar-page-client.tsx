"use client";

import { Button } from "@/components/ui/button";
import { MONTHS } from "@/lib/constants/calendar";
import type { Event } from "@/types/db";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CalendarGrid } from "./calendar-grid";
import { EventDrawer } from "./event-drawer";

interface CalendarPageClientProps {
  events: Event[];
  initialYear: number;
  initialMonth: number;
}

export function CalendarPageClient({
  events,
  initialYear,
  initialMonth,
}: CalendarPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const year = initialYear;
  const month = initialMonth;

  const goToMonth = (newYear: number, newMonth: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("year", String(newYear));
    params.set("month", String(newMonth));
    router.push(`/calendar?${params.toString()}`);
  };

  const goToPrevMonth = () => {
    if (month === 1) {
      goToMonth(year - 1, 12);
    } else {
      goToMonth(year, month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      goToMonth(year + 1, 1);
    } else {
      goToMonth(year, month + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    goToMonth(today.getFullYear(), today.getMonth() + 1);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setDrawerOpen(true);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setSelectedDate(null);
    setDrawerOpen(true);
  };

  const handleAddClick = () => {
    setSelectedDate(new Date());
    setSelectedEvent(null);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={goToPrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-base sm:text-xl font-semibold ml-1 sm:ml-2">
            {MONTHS[month - 1]} {year}
          </h2>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs sm:text-sm px-2 sm:px-3"
            onClick={goToToday}
          >
            Hoy
          </Button>
          <Button
            size="sm"
            className="h-8 px-2 sm:px-3"
            onClick={handleAddClick}
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Evento</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <CalendarGrid
        year={year}
        month={month}
        events={events}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
      />

      {/* Event Drawer */}
      <EventDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedDate={selectedDate}
        event={selectedEvent}
      />
    </div>
  );
}
