'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import questions from '@/lib/true-or-dare-data.json';

const questionsByCategory: { [key: string]: { name: string; truths: string[]; dares: string[] } } = questions;

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
