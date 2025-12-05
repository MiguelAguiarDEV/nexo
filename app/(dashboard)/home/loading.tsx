import { PageHeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl">
        <PageHeaderSkeleton />
      </div>
    </div>
  );
}
