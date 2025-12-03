import { getEventsForMonth } from "./actions";
import { CalendarPageClient } from "./calendar-page-client";

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Get current month if not specified
  const today = new Date();
  const year = params.year
    ? Number.parseInt(params.year, 10)
    : today.getFullYear();
  const month = params.month
    ? Number.parseInt(params.month, 10)
    : today.getMonth() + 1;

  // Validate
  const validYear = Number.isNaN(year) ? today.getFullYear() : year;
  const validMonth =
    Number.isNaN(month) || month < 1 || month > 12
      ? today.getMonth() + 1
      : month;

  const events = await getEventsForMonth(validYear, validMonth);

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus eventos y citas
          </p>
        </div>

        <CalendarPageClient
          events={events}
          initialYear={validYear}
          initialMonth={validMonth}
        />
      </div>
    </div>
  );
}
