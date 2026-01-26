// Date formatting utilities

export function formatDistanceToNow(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMinutes < 1) {
    return "justo ahora";
  }
  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes} min`;
  }
  if (diffInHours < 24) {
    return `hace ${diffInHours}h`;
  }
  if (diffInDays < 7) {
    return `hace ${diffInDays}d`;
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(date);
}
