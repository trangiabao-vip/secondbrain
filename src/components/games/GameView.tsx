'use client';
import { Icons } from "@/components/icons";

export function GameView() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-background p-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icons.game className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Khu vực Game</h2>
      <p className="mt-2 text-muted-foreground">
        Đây là nơi sẽ chứa các game do bạn tạo ra.
      </p>
      <p className="mt-1 text-muted-foreground">
        Hiện tại chưa có game nào. Hãy bắt đầu sáng tạo!
      </p>
    </div>
  );
}
