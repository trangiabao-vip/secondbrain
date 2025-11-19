'use client';
import { Icons } from "@/components/icons";

export function WatchTogetherView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Xem phim chung</h2>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-card p-12 text-center h-96">
        <Icons.watchTogether className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Tính năng sắp ra mắt</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Khu vực xem phim chung đang được xây dựng. Hãy quay lại sau!
        </p>
      </div>
    </div>
  );
}
