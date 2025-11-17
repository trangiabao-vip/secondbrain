'use client';
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { AddInterestDialog } from "./interests/AddInterestDialog";

export function WelcomeScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-background p-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icons.logo className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Chào mừng đến với Trung tâm Sở thích</h2>
      <p className="mt-2 text-muted-foreground">
        Sắp xếp đam mê của bạn. Đạt được mục tiêu của bạn.
      </p>
      <p className="mt-1 text-muted-foreground">
        Bắt đầu bằng cách thêm sở thích đầu tiên của bạn.
      </p>
      <div className="mt-6">
        <AddInterestDialog>
          <Button>
            <Icons.add className="mr-2 h-4 w-4" />
            Thêm sở thích
          </Button>
        </AddInterestDialog>
      </div>
    </div>
  );
}
