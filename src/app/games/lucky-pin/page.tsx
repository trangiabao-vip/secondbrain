'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';

export default function LuckyPinPage() {
  const [items, setItems] = useState<string[]>(['Ăn sáng', 'Xem phim', 'Đọc sách', 'Chơi game']);
  const [newItem, setNewItem] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const addItem = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      setItems([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (itemToRemove: string) => {
    setItems(items.filter(p => p !== itemToRemove));
  };

  const spinWheel = () => {
    if (items.length < 2) return;
    setSpinning(true);
    setResult(null);
    const spinDuration = Math.random() * 2000 + 2000; // 2-4 seconds
    setTimeout(() => {
      const winnerIndex = Math.floor(Math.random() * items.length);
      setResult(items[winnerIndex]);
      setSpinning(false);
    }, spinDuration);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-center">Vòng quay may mắn</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Các lựa chọn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Thêm lựa chọn mới"
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                />
                <Button onClick={addItem}>Thêm</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <Badge key={item} variant="secondary" className="text-base">
                    {item}
                    <button onClick={() => removeItem(item)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                      <Icons.close className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="min-h-[400px] flex flex-col items-center justify-center">
            <CardContent className="flex flex-col items-center justify-center text-center p-6 flex-grow">
              {!spinning && !result && (
                <div className="text-muted-foreground">
                  <Icons.luckyPin className="h-24 w-24 mx-auto mb-4" />
                  <p>Thêm ít nhất 2 lựa chọn và bắt đầu quay!</p>
                </div>
              )}
              {spinning && (
                 <div className="flex flex-col items-center gap-4">
                    <Icons.ai className="h-16 w-16 animate-spin text-primary" />
                    <p className="text-lg font-semibold">Đang quay...</p>
                 </div>
              )}
              {!spinning && result && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <p className="text-lg text-muted-foreground">Kết quả là:</p>
                  <h2 className="text-5xl font-bold text-primary animate-pulse">{result}</h2>
                </div>
              )}
            </CardContent>
            <CardFooter className="w-full">
              <Button onClick={spinWheel} disabled={spinning || items.length < 2} className="w-full text-lg py-6">
                {spinning ? 'Đang quay...' : 'Quay'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
