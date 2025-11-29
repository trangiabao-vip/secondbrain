
'use client';
import { useState, type ReactNode } from 'react';
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
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Textarea } from '../ui/textarea';

export function AddTopicDialog({ children, interestId, parentId }: { children: ReactNode, interestId?: string, parentId?: string | null }) {
  const { addTopic, selectedInterest, selectedTopic } = useAppContext();
  const [topicName, setTopicName] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const finalInterestId = interestId || selectedTopic?.interestId || selectedInterest?.id;
  const finalParentId = parentId !== undefined ? parentId : selectedTopic?.id;
  const finalInterest = interestId ? { id: interestId, name: 'hiện tại' } : (selectedTopic || selectedInterest);

  const handleAddTopic = () => {
    if (topicName.trim() && finalInterestId) {
      const randomImageId = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)].id;
      addTopic(topicName.trim(), randomImageId, description, finalInterestId, finalParentId);
      setTopicName('');
      setDescription('');
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm chủ đề mới</DialogTitle>
          <DialogDescription>
            Thêm một chủ đề mới vào {finalParentId ? 'chủ đề' : 'sở thích'} của bạn: "{finalInterest?.name}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="topic-name">Tên chủ đề</Label>
            <Input
              id="topic-name"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="ví dụ: 'Kỹ thuật CSS nâng cao'"
              onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic-description">Mô tả (Tùy chọn)</Label>
            <Textarea
              id="topic-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn về chủ đề này"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" onClick={handleAddTopic}>
                Thêm chủ đề
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
