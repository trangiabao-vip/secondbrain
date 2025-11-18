
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
import { Textarea } from '../ui/textarea';

export function EditTopicDialog({ topicId, children }: { topicId: string, children: ReactNode }) {
  const { getTopicById, updateTopic } = useAppContext();
  const [topicName, setTopicName] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const topic = getTopicById(topicId);
      if (topic) {
        setTopicName(topic.name);
        setDescription(topic.description || '');
      }
    }
  }, [isOpen, topicId, getTopicById]);

  const handleUpdateTopic = () => {
    if (topicName.trim()) {
      updateTopic(topicId, topicName.trim(), description);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa chủ đề</DialogTitle>
          <DialogDescription>
            Cập nhật tên chủ đề của bạn.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="topic-name-edit">Tên chủ đề</Label>
              <Input
                id="topic-name-edit"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="e.g., 'Advanced CSS Techniques'"
              />
            </div>
             <div className="space-y-2">
                <Label htmlFor="topic-description-edit">Mô tả (Tùy chọn)</Label>
                <Textarea
                  id="topic-description-edit"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn gọn về chủ đề này"
                />
            </div>
            <div className="flex justify-end">
                <Button type="submit" onClick={handleUpdateTopic}>
                    Lưu thay đổi
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
