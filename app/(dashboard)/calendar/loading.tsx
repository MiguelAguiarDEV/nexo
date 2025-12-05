import {
  CalendarGridSkeleton,
  PageHeaderSkeleton,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <PageHeaderSkeleton />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
            <div className="h-6 w-32 rounded bg-muted animate-pulse ml-2" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-16 rounded bg-muted animate-pulse" />
            <div className="h-8 w-24 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <CalendarGridSkeleton />
      </div>
    </div>
  );
}
