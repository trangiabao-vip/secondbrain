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
import { cn } from '@/lib/utils';

const questionsByCategory: { [key: string]: { name: string; truths: string[]; dares: string[] } } = questions;

type GameMode = 'truth' | 'dare' | null;
type CategoryKey = keyof typeof questionsByCategory;
type GameState = 'setup' | 'playing' | 'reveal';

export default function TrueOrDarePage() {
  const [players, setPlayers] = useState<string[]>(['Người chơi 1', 'Người chơi 2']);
  const [newPlayer, setNewPlayer] = useState('');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('pha-bang');
  const [mode, setMode] = useState<GameMode>(null);
  const [question, setQuestion] = useState('');
  
  const [gameState, setGameState] = useState<GameState>('setup');

  const addPlayer = () => {
    if (newPlayer.trim() && !players.includes(newPlayer.trim())) {
      setPlayers([...players, newPlayer.trim()]);
      setNewPlayer('');
    }
  };

  const removePlayer = (playerToRemove: string) => {
    const playerIndex = players.indexOf(playerToRemove);
    setPlayers(players.filter(p => p !== playerToRemove));
    if (playerIndex < currentPlayerIndex) {
        setCurrentPlayerIndex(prev => prev - 1);
    } else if (playerIndex === currentPlayerIndex && playerIndex === players.length -1) {
        setCurrentPlayerIndex(0);
    }
  };

  const handleSelectChoice = (type: 'truth' | 'dare') => {
    setMode(type);
    const category = questionsByCategory[selectedCategory];
    const list = type === 'truth' ? category.truths : category.dares;
    const newQuestion = list[Math.floor(Math.random() * list.length)];
    setQuestion(newQuestion);
    setGameState('reveal');
  };
  
  const handleNextTurn = () => {
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length);
    setQuestion('');
    setMode(null);
    setGameState('playing');
  }
  
  const startGame = () => {
    if (players.length < 2) return;
    setCurrentPlayerIndex(0);
    setGameState('playing');
  }

  const resetGame = () => {
      setGameState('setup');
      setCurrentPlayerIndex(0);
  }

  const currentPlayer = players.length > 0 ? players[currentPlayerIndex] : null;

  const renderSetup = () => (
    <div className="w-full max-w-md mx-auto space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-center">Thật hay Thách</h1>
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
                    {players.map((player) => (
                    <Badge key={player} variant="secondary" className="text-base">
                        {player}
                        <button onClick={() => removePlayer(player)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
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
        <Button onClick={startGame} className="w-full" disabled={players.length < 2}>
            Bắt đầu chơi
        </Button>
    </div>
  );

  const renderPlaying = () => (
    <div className="text-center flex flex-col items-center justify-center h-full">
        <p className="text-xl text-muted-foreground">Lượt của:</p>
        <h2 className="text-5xl font-bold my-4">{currentPlayer}</h2>
        <p className="text-lg mb-8">Hãy chọn...</p>
        <div className="flex gap-4">
            <Button onClick={() => handleSelectChoice('truth')} variant="outline" className="w-32 h-16 text-lg">
                Thật
            </Button>
            <Button onClick={() => handleSelectChoice('dare')} variant="destructive" className="w-32 h-16 text-lg">
                Thách
            </Button>
        </div>
        <Button variant="link" onClick={resetGame} className="mt-12">Chơi lại từ đầu</Button>
    </div>
  );

  const renderReveal = () => (
    <motion.div 
        className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
    >
        <motion.div
             key={question}
             initial={{ opacity: 0, y: 50, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             transition={{ duration: 0.5, type: "spring" }}
             className="w-full max-w-2xl"
        >
            <Card className={cn(
                "text-center shadow-2xl",
                mode === 'truth' ? "border-blue-500" : "border-red-500"
            )}>
                <CardHeader>
                    <CardTitle className={cn(
                        "flex items-center justify-center gap-2 text-2xl",
                        mode === 'truth' ? "text-blue-500" : "text-red-500"
                    )}>
                        {mode === 'truth' && <><Icons.interest /> Thật</>}
                        {mode === 'dare' && <><Icons.trueOrDare /> Thách</>}
                    </CardTitle>
                </CardHeader>
                <CardContent className="min-h-[200px] flex items-center justify-center p-6">
                    <p className="text-2xl font-semibold">{question}</p>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleNextTurn} className="w-full text-lg py-6">Lượt tiếp theo</Button>
                </CardFooter>
            </Card>
        </motion.div>
    </motion.div>
  );
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 h-[calc(100vh-10rem)]">
        <AnimatePresence mode="wait">
            {gameState === 'setup' && (
                <motion.div
                    key="setup"
                    exit={{ opacity: 0, y: -20 }}
                >
                    {renderSetup()}
                </motion.div>
            )}
            {gameState === 'playing' && (
                 <motion.div
                    key="playing"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full"
                >
                    {renderPlaying()}
                </motion.div>
            )}
        </AnimatePresence>
        <AnimatePresence>
            {gameState === 'reveal' && renderReveal()}
        </AnimatePresence>
    </div>
  );
}
