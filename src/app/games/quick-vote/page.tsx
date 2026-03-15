
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, Crown } from 'lucide-react';

type GameState = 'setup' | 'voting' | 'results';
type Player = { name: string; votes: number };

export default function QuickVotePage() {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [players, setPlayers] = useState<Player[]>([]);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [question, setQuestion] = useState('Ai có khả năng...');
    const [votedPlayers, setVotedPlayers] = useState<string[]>([]);

    const addPlayer = () => {
        if (newPlayerName.trim() && !players.some(p => p.name === newPlayerName.trim())) {
            setPlayers([...players, { name: newPlayerName.trim(), votes: 0 }]);
            setNewPlayerName('');
        }
    };

    const removePlayer = (name: string) => {
        setPlayers(players.filter(p => p.name !== name));
    };

    const startGame = () => {
        if (players.length < 2) return;
        setGameState('voting');
    };

    const handleVote = (name: string) => {
        // Always increment vote count on click
        setPlayers(players.map(p => p.name === name ? { ...p, votes: p.votes + 1 } : p));

        // Keep track of who has been voted for at least once for UI highlighting, without duplicates.
        if (!votedPlayers.includes(name)) {
            setVotedPlayers([...votedPlayers, name]);
        }
    };
    
    const showResults = () => {
        setGameState('results');
    }

    const resetGame = () => {
        setGameState('setup');
        setPlayers([]);
        setVotedPlayers([]);
        setQuestion('Ai có khả năng...');
    };
    
    const playAgain = () => {
        setGameState('voting');
        setPlayers(players.map(p => ({ ...p, votes: 0 })));
        setVotedPlayers([]);
    }
    
    const renderSetup = () => (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>Thiết lập Bình chọn</CardTitle>
                <CardDescription>Thêm người tham gia và đặt câu hỏi bình chọn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="question">Câu hỏi / Chủ đề bình chọn</Label>
                    <Input 
                        id="question"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="ví dụ: Ai là người hài hước nhất?"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Người tham gia</Label>
                    <div className="flex gap-2">
                        <Input
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        placeholder="Thêm người chơi mới"
                        onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                        />
                        <Button onClick={addPlayer}>Thêm</Button>
                    </div>
                     <div className="flex flex-wrap gap-2 pt-2">
                        {players.map((player) => (
                        <Badge key={player.name} variant="secondary" className="text-base">
                            {player.name}
                            <button onClick={() => removePlayer(player.name)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                            <Icons.close className="h-3 w-3" />
                            </button>
                        </Badge>
                        ))}
                    </div>
                </div>
                 {players.length < 2 && (
                    <Alert variant="destructive">
                        <Users className="h-4 w-4" />
                        <AlertTitle>Cần thêm người chơi</AlertTitle>
                        <AlertDescription>
                            Bạn cần ít nhất 2 người tham gia để bắt đầu bình chọn.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={startGame} disabled={players.length < 2}>Bắt đầu Bình chọn</Button>
            </CardFooter>
        </Card>
    );

    const renderVoting = () => (
        <div className="text-center">
             <h2 className="text-2xl font-bold mb-2">{question}</h2>
             <p className="text-muted-foreground mb-8">Nhấn vào tên để bình chọn. Bạn có thể bình chọn nhiều lần.</p>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {players.map((player, index) => (
                    <Card 
                        key={index} 
                        onClick={() => handleVote(player.name)}
                        className={`p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${votedPlayers.includes(player.name) ? 'bg-primary text-primary-foreground shadow-lg scale-105' : 'bg-secondary hover:bg-secondary/80'}`}
                    >
                         <h3 className="font-semibold text-lg">{player.name}</h3>
                         <p className="font-bold text-2xl">{player.votes}</p>
                    </Card>
                 ))}
             </div>
             <Button className="mt-8" onClick={showResults}>Xem Kết quả</Button>
        </div>
    );

    const renderResults = () => {
        const maxVotes = Math.max(...players.map(p => p.votes));
        const winners = players.filter(p => p.votes === maxVotes && maxVotes > 0);

        return (
            <Card className="w-full max-w-lg mx-auto text-center">
                <CardHeader>
                    <CardTitle>Kết quả Bình chọn</CardTitle>
                     <CardDescription>{question}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {winners.length > 0 ? (
                        <div className="p-4 bg-yellow-500/10 text-yellow-700 rounded-lg">
                            <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                                <Icons.crown className="h-6 w-6"/>
                                Người chiến thắng
                            </h3>
                            <p className="text-2xl font-bold mt-2">{winners.map(w => w.name).join(', ')}</p>
                            <p>Với {maxVotes} phiếu bầu!</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Không có ai được bình chọn.</p>
                    )}
                    
                    <div className="space-y-2 pt-4">
                        <h4 className="font-semibold">Bảng xếp hạng:</h4>
                        {players.sort((a,b) => b.votes - a.votes).map(player => (
                             <div key={player.name} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                                 <span>{player.name}</span>
                                 <span className="font-bold">{player.votes} phiếu</span>
                             </div>
                        ))}
                    </div>

                </CardContent>
                <CardFooter className="flex-col sm:flex-row gap-2">
                     <Button className="w-full" onClick={playAgain}>Bình chọn lại</Button>
                     <Button className="w-full" variant="outline" onClick={resetGame}>Chơi game mới</Button>
                </CardFooter>
            </Card>
        );
    }

    const renderContent = () => {
        switch (gameState) {
            case 'setup':
                return renderSetup();
            case 'voting':
                return renderVoting();
            case 'results':
                return renderResults();
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-6 text-center">Bình Chọn Nhanh</h1>
            <AnimatePresence mode="wait">
                <motion.div
                    key={gameState}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
