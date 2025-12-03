"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EVENT_COLORS, MONTHS } from "@/lib/constants/calendar";
import { cn } from "@/lib/utils";
import type { Event } from "@/types/db";
import { Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { addEvent, deleteEvent, updateEvent } from "./actions";

interface EventDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  event: Event | null; // If editing existing event
}

export function EventDrawer({
  open,
  onOpenChange,
  selectedDate,
  event,
}: EventDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [color, setColor] = useState<string>(EVENT_COLORS[5].value); // Blue default

  // Reset form when opening
  useEffect(() => {
    if (open) {
      if (event) {
        // Editing existing event
        setTitle(event.title);
        setDescription(event.description || "");
        setLocation(event.location || "");
        setColor(event.color);
        setIsAllDay(event.is_all_day);

        // Parse dates
        if (event.start_date.includes("T")) {
          const [date, time] = event.start_date.split("T");
          setStartDate(date);
          setStartTime(time.substring(0, 5));
        } else {
          setStartDate(event.start_date);
          setStartTime("");
        }

        if (event.end_date) {
          if (event.end_date.includes("T")) {
            const [date, time] = event.end_date.split("T");
            setEndDate(date);
            setEndTime(time.substring(0, 5));
          } else {
            setEndDate(event.end_date);
            setEndTime("");
          }
        } else {
          setEndDate("");
          setEndTime("");
        }
      } else if (selectedDate) {
        // New event
        setTitle("");
        setDescription("");
        setLocation("");
        setColor(EVENT_COLORS[5].value);
        setIsAllDay(false);

        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        setStartDate(`${year}-${month}-${day}`);
        setStartTime("09:00");
        setEndDate("");
        setEndTime("");
      }
    }
  }, [open, event, selectedDate]);

  const handleSubmit = () => {
    if (!title.trim() || !startDate) return;

    startTransition(async () => {
      const start_date = isAllDay
        ? startDate
        : startTime
        ? `${startDate}T${startTime}:00`
        : startDate;

      const end_date =
        endDate && !isAllDay
          ? endTime
            ? `${endDate}T${endTime}:00`
            : endDate
          : endDate || null;

      if (event) {
        // Update existing
        await updateEvent(event.id, {
          title,
          description: description || undefined,
          location: location || undefined,
          start_date,
          end_date: end_date || undefined,
          is_all_day: isAllDay,
          color,
        });
      } else {
        // Create new
        await addEvent({
          title,
          description: description || undefined,
          location: location || undefined,
          start_date,
          end_date: end_date || undefined,
          is_all_day: isAllDay,
          color,
        });
      }

      onOpenChange(false);
    });
  };

  const handleDelete = () => {
    if (!event) return;

    if (!confirm("¿Eliminar este evento?")) return;

    startTransition(async () => {
      await deleteEvent(event.id);
      onOpenChange(false);
    });
  };

  const formatDateForTitle = (date: Date | null) => {
    if (!date) return "";
    return `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle>
              {event ? "Editar evento" : "Nuevo evento"}
            </DrawerTitle>
            <DrawerDescription>
              {event
                ? "Modifica los detalles del evento"
                : selectedDate
                ? formatDateForTitle(selectedDate)
                : "Añade un nuevo evento"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Reunión, cita, recordatorio..."
                autoFocus
              />
            </div>

            {/* All day toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Todo el día</span>
            </label>

            {/* Start date/time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="startDate">Fecha inicio *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              {!isAllDay && (
                <div>
                  <Label htmlFor="startTime">Hora inicio</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* End date/time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="endDate">Fecha fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              {!isAllDay && (
                <div>
                  <Label htmlFor="endTime">Hora fin</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Opcional"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Descripción</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notas adicionales..."
                className="w-full min-h-20 p-2 border rounded-md text-sm resize-none"
              />
            </div>

            {/* Color picker */}
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-transform",
                      c.class,
                      color === c.value &&
                        "ring-2 ring-offset-2 ring-primary scale-110"
                    )}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <DrawerFooter>
            <div className="flex gap-2 w-full">
              {event && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1">
                  Cancelar
                </Button>
              </DrawerClose>
              <Button
                onClick={handleSubmit}
                disabled={isPending || !title.trim() || !startDate}
                className="flex-1"
              >
                {isPending ? "Guardando..." : event ? "Guardar" : "Crear"}
              </Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
