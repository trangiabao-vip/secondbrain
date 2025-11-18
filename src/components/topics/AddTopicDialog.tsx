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
import { AITopicSuggester } from '../ai/AITopicSuggester';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';

export function AddTopicDialog({ children }: { children: ReactNode }) {
  const { addTopic, selectedInterest } = useAppContext();
  const [topicName, setTopicName] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAddTopic = () => {
    if (topicName.trim() && selectedInterest) {
      const randomImageId = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)].id;
      addTopic(topicName.trim(), randomImageId, description);
      setTopicName('');
      setDescription('');
      setIsOpen(false);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setTopicName(suggestion);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm chủ đề mới</DialogTitle>
          <DialogDescription>
            Thêm một chủ đề mới vào sở thích của bạn: "{selectedInterest?.name}"
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
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 -top-3 -translate-x-1/2 bg-background px-2 text-xs text-muted-foreground">HOẶC</span>
          </div>
          <AITopicSuggester onSuggestionClick={handleSuggestion} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
