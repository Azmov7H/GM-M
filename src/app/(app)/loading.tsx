import {
  PageHeaderSkeleton,
  StatsSkeleton,
  TableSkeleton,
} from "@/components/shared/loading";

export default function AppLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <StatsSkeleton />
      <TableSkeleton />
    </div>
  );
}
