// Event colors for calendar
export const EVENT_COLORS = [
  { value: "#ef4444", label: "Rojo", class: "bg-red-500" },
  { value: "#f97316", label: "Naranja", class: "bg-orange-500" },
  { value: "#eab308", label: "Amarillo", class: "bg-yellow-500" },
  { value: "#22c55e", label: "Verde", class: "bg-green-500" },
  { value: "#06b6d4", label: "Cyan", class: "bg-cyan-500" },
  { value: "#3b82f6", label: "Azul", class: "bg-blue-500" },
  { value: "#8b5cf6", label: "Violeta", class: "bg-violet-500" },
  { value: "#ec4899", label: "Rosa", class: "bg-pink-500" },
  { value: "#6b7280", label: "Gris", class: "bg-gray-500" },
] as const;

export const DEFAULT_EVENT_COLOR = "#3b82f6"; // Blue

// Days of the week (Spanish)
export const DAYS_OF_WEEK = [
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
  "Dom",
] as const;

export const DAYS_OF_WEEK_FULL = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

// Months (Spanish)
export const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;
