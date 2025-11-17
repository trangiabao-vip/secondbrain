'use client';
import { useState, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/contexts/AppContext';

export function AddInterestDialog({ children }: { children: ReactNode }) {
  const { addInterest } = useAppContext();
  const [interestName, setInterestName] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAddInterest = () => {
    if (interestName.trim()) {
      addInterest(interestName.trim());
      setInterestName('');
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm sở thích mới</DialogTitle>
          <DialogDescription>
            Đam mê hoặc sở thích bạn muốn tập trung vào là gì?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="interest-name" className="text-right">
              Tên
            </Label>
            <Input
              id="interest-name"
              value={interestName}
              onChange={(e) => setInterestName(e.target.value)}
              className="col-span-3"
              placeholder="ví dụ: 'Viết sáng tạo'"
              onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleAddInterest}>
            Thêm sở thích
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
