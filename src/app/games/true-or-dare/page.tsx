'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { motion, AnimatePresence } from 'framer-motion';

const truths = [
    "Điều gì là bí mật lớn nhất mà bạn chưa bao giờ kể cho ai nghe?",
    "Lần cuối cùng bạn nói dối là khi nào và về điều gì?",
    "Nếu bạn có thể hoán đổi cuộc sống với bất kỳ ai trong một ngày, đó sẽ là ai và tại sao?",
    "Điều gì khiến bạn xấu hổ nhất?",
    "Nỗi sợ hãi lớn nhất của bạn là gì?",
];

const dares = [
    "Hát một bài hát bạn yêu thích thật to.",
    "Gọi điện cho một người bạn và giả vờ là nhân viên giao bánh pizza.",
    "Đăng một bức ảnh ngớ ngẩn của bạn lên mạng xã hội.",
    "Nói chuyện với giọng của một nhân vật hoạt hình trong 5 phút tới.",
    "Hãy thử một điệu nhảy TikTok đang thịnh hành.",
];

type GameMode = 'truth' | 'dare' | null;

export default function TrueOrDarePage() {
  const [mode, setMode] = useState<GameMode>(null);
  const [question, setQuestion] = useState('');
  const [cardKey, setCardKey] = useState(0);

  const getNewQuestion = (type: 'truth' | 'dare') => {
    setMode(type);
    const list = type === 'truth' ? truths : dares;
    const newQuestion = list[Math.floor(Math.random() * list.length)];
    setQuestion(newQuestion);
    setCardKey(prev => prev + 1); // To re-trigger animation
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[80vh]">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Thật hay Thách</h1>
      
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            {mode === 'truth' && <><Icons.interest className="text-blue-400" /> Thật</>}
            {mode === 'dare' && <><Icons.trueOrDare className="text-red-400" /> Thách</>}
            {!mode && "Chọn một loại"}
          </CardTitle>
        </CardHeader>
        <CardContent className="min-h-[150px] flex items-center justify-center p-6">
            <AnimatePresence mode="wait">
                <motion.div
                    key={cardKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-lg font-medium"
                >
                    {question || "Nhấn nút 'Thật' hoặc 'Thách' để bắt đầu!"}
                </motion.div>
            </AnimatePresence>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <div className="flex justify-center gap-4 w-full">
                <Button onClick={() => getNewQuestion('truth')} variant="outline" className="w-full">
                    Thật
                </Button>
                <Button onClick={() => getNewQuestion('dare')} variant="destructive" className="w-full">
                    Thách
                </Button>
            </div>
             {mode && (
                <Button onClick={() => getNewQuestion(mode)} className="w-full">
                    <Icons.ai className="mr-2 h-4 w-4" />
                    Lấy câu hỏi mới
                </Button>
             )}
        </CardFooter>
      </Card>
    </div>
  );
}
