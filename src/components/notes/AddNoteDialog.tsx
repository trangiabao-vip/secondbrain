'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/contexts/AppContext';
import { TipTapEditor } from './TipTapEditor';
import { Icons } from '../icons';
import { useToast } from '@/hooks/use-toast';

export function AddNoteDialog({ 
  children, 
  defaultDate,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: { children?: React.ReactNode, defaultDate?: Date, open?: boolean, onOpenChange?: (open: boolean) => void }) {
  const { addNote } = useAppContext();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalOnOpenChange !== undefined ? externalOnOpenChange : setInternalOpen;

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề ghi chú",
        variant: "destructive",
      });
      return;
    }

    await addNote({
      title: title.trim(),
      content: content,
      tags: [],
    });

    toast({
      title: "Thành công",
      description: "Ghi chú đã được tạo",
    });

    setIsOpen(false);
    setTitle('');
    setContent('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ghi chú mới</DialogTitle>
          <DialogDescription>
            Tạo một ghi chú kiến thức hoặc nhật ký mới.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="note-title">Tiêu đề</Label>
            <Input
              id="note-title"
              placeholder="Nhập tiêu đề ghi chú..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Nội dung</Label>
            <TipTapEditor
              content={content}
              onChange={setContent}
              placeholder="Bắt đầu viết điều gì đó tuyệt vời..."
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Hủy</Button>
          </DialogClose>
          <Button onClick={handleSave}>Lưu ghi chú</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
