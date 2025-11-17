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
import { AITopicSuggester } from '../ai/AITopicSuggester';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Separator } from '../ui/separator';

export function AddTopicDialog({ children }: { children: ReactNode }) {
  const { addTopic, selectedInterest } = useAppContext();
  const [topicName, setTopicName] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAddTopic = () => {
    if (topicName.trim() && selectedInterest) {
      const randomImageId = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)].id;
      addTopic(topicName.trim(), randomImageId);
      setTopicName('');
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
              onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
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
