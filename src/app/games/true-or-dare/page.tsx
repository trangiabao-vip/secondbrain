'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const questionsByCategory = {
  'kinh-dien': {
    name: 'Kinh điển',
    truths: [
      "Điều gì là bí mật lớn nhất mà bạn chưa bao giờ kể cho ai nghe?",
      "Lần cuối cùng bạn nói dối là khi nào và về điều gì?",
      "Nếu bạn có thể hoán đổi cuộc sống với bất kỳ ai trong một ngày, đó sẽ là ai và tại sao?",
      "Điều gì khiến bạn xấu hổ nhất?",
      "Nỗi sợ hãi lớn nhất của bạn là gì?",
      "Bạn đã bao giờ 'stalk' người yêu cũ trên mạng xã hội chưa?",
    ],
    dares: [
      "Hát một bài hát bạn yêu thích thật to.",
      "Gọi điện cho một người bạn và giả vờ là nhân viên giao bánh pizza.",
      "Đăng một bức ảnh ngớ ngẩn của bạn lên mạng xã hội.",
      "Nói chuyện với giọng của một nhân vật hoạt hình trong 5 phút tới.",
      "Hãy thử một điệu nhảy TikTok đang thịnh hành.",
      "Để người khác vẽ một thứ gì đó lên mặt bạn bằng bút.",
    ],
  },
  'vui-ve': {
    name: 'Vui vẻ',
    truths: [
      "Kể về một lần bạn cười đến đau cả bụng.",
      "Món ăn kỳ lạ nhất bạn từng thử là gì?",
      "Nếu là một loại đồ ăn, bạn sẽ là món gì?",
      "Thói quen kỳ quặc nhất của bạn là gì?",
      "Bạn sẽ làm gì nếu trúng xổ số 1 triệu đồng?",
    ],
    dares: [
      "Nhảy múa không có nhạc trong 1 phút.",
      "Cố gắng liếm khuỷu tay của chính mình.",
      "Nói một câu chuyện cười mà không ai thấy buồn cười.",
      "Giả vờ là một con mèo trong 2 phút.",
      "Gửi một tin nhắn vô nghĩa cho người thứ 5 trong danh bạ của bạn.",
    ],
  },
  'sau-sac': {
    name: 'Sâu sắc',
    truths: [
      "Điều gì bạn tự hào nhất về bản thân?",
      "Bài học cuộc sống lớn nhất bạn đã học được là gì?",
      "Nếu có thể nói điều gì đó với bản thân 10 năm trước, bạn sẽ nói gì?",
      "Theo bạn, ý nghĩa của cuộc sống là gì?",
      "Điều gì làm bạn cảm thấy thực sự hạnh phúc?",
    ],
    dares: [
      "Viết một lời cảm ơn đến một người quan trọng với bạn và gửi cho họ.",
      "Chia sẻ một mục tiêu lớn trong cuộc đời bạn với mọi người.",
      "Dành 2 phút để nói những điều bạn biết ơn trong cuộc sống.",
      "Hứa sẽ làm một việc tốt cho người khác vào ngày mai.",
      "Nhìn vào mắt một người trong nhóm và nói một điều bạn ngưỡng mộ ở họ.",
    ],
  },
};

type GameMode = 'truth' | 'dare' | null;
type CategoryKey = keyof typeof questionsByCategory;

export default function TrueOrDarePage() {
  const [players, setPlayers] = useState<string[]>(['Người chơi 1', 'Người chơi 2']);
  const [newPlayer, setNewPlayer] = useState('');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('kinh-dien');
  const [mode, setMode] = useState<GameMode>(null);
  const [question, setQuestion] = useState('');
  const [cardKey, setCardKey] = useState(0);

  const addPlayer = () => {
    if (newPlayer.trim() && !players.includes(newPlayer.trim())) {
      setPlayers([...players, newPlayer.trim()]);
      setNewPlayer('');
    }
  };

  const removePlayer = (playerToRemove: string) => {
    const playerIndex = players.indexOf(playerToRemove);
    setPlayers(players.filter(p => p !== playerToRemove));
    // Adjust current player index if needed
    if (playerIndex < currentPlayerIndex) {
        setCurrentPlayerIndex(prev => prev - 1);
    } else if (playerIndex === currentPlayerIndex && playerIndex === players.length -1) {
        setCurrentPlayerIndex(0);
    }
  };

  const getNewQuestion = (type: 'truth' | 'dare') => {
    setMode(type);
    const category = questionsByCategory[selectedCategory];
    const list = type === 'truth' ? category.truths : category.dares;
    const newQuestion = list[Math.floor(Math.random() * list.length)];
    setQuestion(newQuestion);
    setCardKey(prev => prev + 1);
    // Move to next player after getting a new question
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
  };
  
  const currentPlayer = players.length > 0 ? players[currentPlayerIndex] : null;


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-center">Thật hay Thách</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Panel: Players & Categories */}
        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                <CardTitle>Người chơi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                        value={newPlayer}
                        onChange={(e) => setNewPlayer(e.target.value)}
                        placeholder="Thêm người chơi mới"
                        onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                        />
                        <Button onClick={addPlayer}>Thêm</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {players.map((player, index) => (
                        <Badge key={player} variant={index === currentPlayerIndex ? "default" : "secondary"} className="text-base cursor-pointer" onClick={() => setCurrentPlayerIndex(index)}>
                            {player}
                            <button onClick={(e) => { e.stopPropagation(); removePlayer(player); }} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                            <Icons.close className="h-3 w-3" />
                            </button>
                        </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Thể loại</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedCategory} onValueChange={(value: CategoryKey) => setSelectedCategory(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn thể loại câu hỏi" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(questionsByCategory).map(key => (
                                <SelectItem key={key} value={key}>{questionsByCategory[key as CategoryKey].name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        </div>

        {/* Right Panel: Game */}
        <div className="md:col-span-2">
            <Card className="w-full max-w-lg mx-auto text-center">
                <CardHeader>
                <CardTitle className="flex flex-col items-center justify-center gap-2">
                    {currentPlayer && <p className="text-sm font-medium text-muted-foreground">Lượt của: <span className="font-bold text-primary">{currentPlayer}</span></p>}
                    <div className="flex items-center gap-2">
                        {mode === 'truth' && <><Icons.interest className="text-blue-400" /> Thật</>}
                        {mode === 'dare' && <><Icons.trueOrDare className="text-red-400" /> Thách</>}
                        {!mode && "Hãy chọn Thật hoặc Thách"}
                    </div>
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
                        <Button onClick={() => getNewQuestion('truth')} variant="outline" className="w-full" disabled={players.length === 0}>
                            Thật
                        </Button>
                        <Button onClick={() => getNewQuestion('dare')} variant="destructive" className="w-full" disabled={players.length === 0}>
                            Thách
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
