import {
  PageHeaderSkeleton,
  ShoppingListSkeleton,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        <PageHeaderSkeleton />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-8 w-20 rounded bg-muted animate-pulse shrink-0"
            />
          ))}
        </div>
        <ShoppingListSkeleton />
      </div>
    </div>
  );
}
