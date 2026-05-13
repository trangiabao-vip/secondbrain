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
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/contexts/AppContext';
import { Icons } from '../icons';
import { TipTapEditor } from '../notes/TipTapEditor';

interface WikiPageDialogProps {
  mode: 'add' | 'edit' | 'view';
  pageId?: string;
  children: ReactNode;
}

export function WikiPageDialog({ mode, pageId, children }: WikiPageDialogProps) {
  const { selectedTopic, getWikiPageById, addWikiPage, updateWikiPage } = useAppContext();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(mode === 'add' || mode === 'edit');
  
  const originalPage = pageId ? getWikiPageById(pageId) : null;

  useEffect(() => {
    if (isOpen) {
      if ((mode === 'edit' || mode === 'view') && originalPage) {
        setTitle(originalPage.title);
        setContent(originalPage.content);
      } else {
        setTitle('');
        setContent('');
      }
      setIsEditing(mode === 'add' || mode === 'edit');
    }
  }, [isOpen, mode, originalPage]);

  const handleSubmit = () => {
    if (!title.trim()) return;

    if (mode === 'add') {
      addWikiPage({ title, content });
    } else if (pageId) {
      updateWikiPage(pageId, { title, content });
    }
    
    setIsOpen(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setTitle('');
      setContent('');
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
             {isEditing 
                ? (mode === 'add' ? 'Thêm trang Wiki mới' : 'Chỉnh sửa trang Wiki')
                : title
             }
          </DialogTitle>
          {!isEditing && (
             <DialogDescription>
                Trong chủ đề: {selectedTopic?.name}
             </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="wiki-title">Tiêu đề</Label>
                <Input
                  id="wiki-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề trang..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wiki-content">Nội dung</Label>
                <TipTapEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Nhập nội dung của bạn ở đây. Hỗ trợ Markdown & #tags"
                />
              </div>
            </>
          ) : (
            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between pt-2">
          {mode === 'view' && !isEditing && (
            <Button onClick={() => setIsEditing(true)}>
                <Icons.edit className="mr-2 h-4 w-4" /> Chỉnh sửa
            </Button>
          )}
          {isEditing && (
             <>
                {mode === 'view' && <Button variant="ghost" onClick={() => setIsEditing(false)}>Hủy</Button>}
                <Button onClick={handleSubmit}>Lưu thay đổi</Button>
             </>
          )}
           {(mode !== 'view' && !isEditing) && (
             <DialogClose asChild>
                <Button variant="outline">Hủy</Button>
             </DialogClose>
           )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
