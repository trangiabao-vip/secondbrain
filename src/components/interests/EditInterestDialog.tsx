'use client';
import { useState, type ReactNode, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/contexts/AppContext';

export function EditInterestDialog({ interestId, children }: { interestId: string, children: ReactNode }) {
  const { getInterestById, updateInterest } = useAppContext();
  const [interestName, setInterestName] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const interest = getInterestById(interestId);
      if (interest) {
        setInterestName(interest.name);
      }
    }
  }, [isOpen, interestId, getInterestById]);

  const handleUpdateInterest = () => {
    if (interestName.trim()) {
      updateInterest(interestId, interestName.trim());
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa sở thích</DialogTitle>
          <DialogDescription>
            Cập nhật tên sở thích của bạn.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="interest-name-edit">Tên sở thích</Label>
              <Input
                id="interest-name-edit"
                value={interestName}
                onChange={(e) => setInterestName(e.target.value)}
                placeholder="ví dụ: 'Viết sáng tạo'"
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateInterest()}
              />
            </div>
            <div className="flex justify-end">
                <Button type="submit" onClick={handleUpdateInterest}>
                    Lưu thay đổi
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
