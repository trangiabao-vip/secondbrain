
'use client';
import { useState, type ReactNode, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/contexts/AppContext';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface SalesPageDialogProps {
  mode: 'add' | 'edit';
  pageId?: string;
  children: ReactNode;
}

export function SalesPageDialog({ mode, pageId, children }: SalesPageDialogProps) {
  const { getSalesPageById, addSalesPage, updateSalesPage } = useAppContext();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    if (isOpen && mode === 'edit' && pageId) {
      const page = getSalesPageById(pageId);
      if (page) {
        setTitle(page.title);
        setSlug(page.slug);
        setContent(page.content);
      }
    } else {
        setTitle('');
        setSlug('');
        setContent('');
    }
  }, [isOpen, mode, pageId, getSalesPageById]);

  const handleSubmit = async () => {
    if (!title.trim() || !slug.trim()) {
        toast({
            variant: 'destructive',
            title: 'Lỗi',
            description: 'Tiêu đề và đường dẫn không được để trống.',
        });
        return
    };

    const pageData = {
        title,
        slug: slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        content
    };

    if (mode === 'add') {
      await addSalesPage(pageData);
    } else if (pageId) {
      updateSalesPage(pageId, pageData);
    }
    
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
             {mode === 'add' ? 'Tạo trang bán hàng mới' : 'Chỉnh sửa trang bán hàng'}
          </DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết cho trang của bạn.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-4">
            <div className="space-y-2">
                <Label htmlFor="sp-title">Tiêu đề</Label>
                <Input
                  id="sp-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tiêu đề trang hấp dẫn"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="sp-slug">Đường dẫn (slug)</Label>
                <Input
                  id="sp-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="vi-du-ten-san-pham"
                />
                 <p className="text-xs text-muted-foreground">
                    Chỉ sử dụng chữ thường, số và dấu gạch ngang.
                 </p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="sp-content">Nội dung</Label>
                <Textarea
                  id="sp-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Viết nội dung trang của bạn ở đây. Hỗ trợ Markdown."
                  className="min-h-[300px]"
                />
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit}>{mode === 'add' ? 'Tạo trang' : 'Lưu thay đổi'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
