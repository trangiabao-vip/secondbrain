'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, AlertTriangle } from 'lucide-react';

const wordPairs = [
    { civilian: "Mặt trời", spy: "Mặt trăng" },
    { civilian: "Sữa", spy: "Nước" },
    { civilian: "Điện thoại", spy: "Máy tính bảng" },
    { civilian: "Ghế", spy: "Bàn" },
    { civilian: "Sách", spy: "Tạp chí" },
    { civilian: "Chó", spy: "Mèo" },
    { civilian: "Cà phê", spy: "Trà" },
    { civilian: "Bóng đá", spy: "Bóng rổ" },
    { civilian: "Guitar", spy: "Piano" },
    { civilian: "Mùa hè", spy: "Mùa đông" },
];

type GameState = 'setup' | 'distribution' | 'playing' | 'reveal';
type Player = { name: string; word: string; isSpy: boolean; revealed: boolean };

export default function WhoIsTheSpyPage() {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [players, setPlayers] = useState<Player[]>([]);
    const [numPlayers, setNumPlayers] = useState(4);
    const [numSpies, setNumSpies] = useState(1);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

    const [wordPair, setWordPair] = useState({ civilian: '', spy: '' });
    const [revealedPlayer, setRevealedPlayer] = useState<Player | null>(null);

    useEffect(() => {
        if (numSpies >= numPlayers) {
            setNumSpies(numPlayers - 1);
        }
    }, [numPlayers, numSpies]);

    const startGame = () => {
        if (numPlayers < 3) return;

        // Pick a random word pair
        const randomPair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
        setWordPair(randomPair);

        // Assign roles
        let playerList: Player[] = Array(numPlayers).fill(null).map((_, i) => ({
            name: `Người chơi ${i + 1}`,
            word: randomPair.civilian,
            isSpy: false,
            revealed: false
        }));

        // Assign spies
        let spiesAssigned = 0;
        while (spiesAssigned < numSpies) {
            const spyIndex = Math.floor(Math.random() * numPlayers);
            if (!playerList[spyIndex].isSpy) {
                playerList[spyIndex].isSpy = true;
                playerList[spyIndex].word = randomPair.spy;
                spiesAssigned++;
            }
        }
        
        setPlayers(playerList);
        setCurrentPlayerIndex(0);
        setGameState('distribution');
    };

    const handleNextPlayer = () => {
        if (currentPlayerIndex < players.length - 1) {
            setCurrentPlayerIndex(prev => prev + 1);
        } else {
            setGameState('playing');
        }
    };
    
    const handleRevealPlayer = (index: number) => {
        setRevealedPlayer(players[index]);
        setGameState('reveal');
    }

    const resetGame = () => {
        setGameState('setup');
        setPlayers([]);
        setRevealedPlayer(null);
    }
    
    const renderSetup = () => (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Thiết lập trò chơi</CardTitle>
                <CardDescription>Chọn số lượng người chơi và gián điệp.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <Label htmlFor="num-players">Số người chơi: {numPlayers}</Label>
                    <Slider
                        id="num-players"
                        min={3}
                        max={12}
                        step={1}
                        value={[numPlayers]}
                        onValueChange={(value) => setNumPlayers(value[0])}
                    />
                </div>
                <div className="space-y-4">
                    <Label htmlFor="num-spies">Số gián điệp: {numSpies}</Label>
                    <Slider
                        id="num-spies"
                        min={1}
                        max={numPlayers - 1}
                        step={1}
                        value={[numSpies]}
                        onValueChange={(value) => setNumSpies(value[0])}
                    />
                </div>
                <Alert>
                    <Users className="h-4 w-4" />
                    <AlertTitle>Luật chơi</AlertTitle>
                    <AlertDescription>
                        Sẽ có {numPlayers - numSpies} người thường và {numSpies} gián điệp. Mọi người sẽ nhận được một từ khóa, nhưng từ khóa của gián điệp sẽ khác. Hãy mô tả từ của bạn để tìm ra gián điệp!
                    </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={startGame}>Bắt đầu chơi</Button>
            </CardFooter>
        </Card>
    );

    const renderDistribution = () => (
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Lượt của {players[currentPlayerIndex].name}</h2>
            <p className="text-muted-foreground mb-6">Nhấn vào thẻ dưới đây để xem từ khóa của bạn. Đừng để người khác thấy!</p>
            <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-full max-w-sm mx-auto"
            >
                <Card className="min-h-[200px] flex items-center justify-center cursor-pointer group" onClick={(e) => (e.currentTarget.querySelector('.back')?.classList.toggle('hidden'))}>
                    <div className="front text-center p-6">
                        <Icons.whoIsTheSpy className="h-16 w-16 mx-auto mb-4 text-primary" />
                        <h3 className="text-xl font-bold">Nhấn để xem từ khóa</h3>
                    </div>
                    <div className="back hidden absolute p-6 text-center">
                         <h3 className="text-3xl font-bold tracking-widest">{players[currentPlayerIndex].word}</h3>
                         <p className="text-sm text-muted-foreground mt-2">Ghi nhớ từ này và nhấn Tiếp tục</p>
                    </div>
                </Card>
            </motion.div>
            <Button className="mt-8" onClick={handleNextPlayer}>
                {currentPlayerIndex < players.length - 1 ? 'Lượt tiếp theo' : 'Bắt đầu thảo luận'}
            </Button>
        </div>
    );
    
    const renderPlaying = () => (
        <div className="text-center">
             <h2 className="text-2xl font-bold mb-4">Vòng thảo luận</h2>
             <p className="text-muted-foreground mb-8">Lần lượt mỗi người chơi mô tả từ khóa của mình. Sau khi tất cả đã nói xong, hãy bình chọn ai là gián điệp.</p>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {players.map((player, index) => (
                    <Card key={index} className="p-4 flex flex-col items-center justify-center gap-2">
                         <Badge variant="secondary">{player.name}</Badge>
                         <Button variant="destructive" size="sm" onClick={() => handleRevealPlayer(index)}>Tiết lộ</Button>
                    </Card>
                 ))}
             </div>
        </div>
    );

    const renderReveal = () => (
        <Card className="w-full max-w-md mx-auto text-center">
            <CardHeader>
                <CardTitle>Kết quả</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-lg">Người chơi được tiết lộ là: <span className="font-bold text-primary">{revealedPlayer?.name}</span></p>
                {revealedPlayer?.isSpy ? (
                    <div className="p-4 bg-green-500/10 text-green-700 rounded-lg">
                        <h3 className="text-2xl font-bold">CHÍNH XÁC!</h3>
                        <p>{revealedPlayer.name} là Gián điệp!</p>
                        <p>Từ của gián điệp là: <span className="font-bold">{revealedPlayer.word}</span></p>
                    </div>
                ) : (
                     <div className="p-4 bg-red-500/10 text-red-700 rounded-lg">
                        <h3 className="text-2xl font-bold">SAI RỒI!</h3>
                        <p>{revealedPlayer?.name} là Người thường.</p>
                        <p>Từ của người thường là: <span className="font-bold">{revealedPlayer?.word}</span></p>
                    </div>
                )}
                <div>
                    <p className="font-semibold mt-4">Tất cả vai trò:</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                        {players.map((p, i) => (
                            <Badge key={i} variant={p.isSpy ? 'destructive' : 'secondary'}>{p.name}: {p.isSpy ? 'Gián điệp' : 'Người thường'}</Badge>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" onClick={resetGame}>Chơi lại</Button>
            </CardFooter>
        </Card>
    );

    const renderContent = () => {
        switch (gameState) {
            case 'setup':
                return renderSetup();
            case 'distribution':
                return renderDistribution();
            case 'playing':
                return renderPlaying();
            case 'reveal':
                return renderReveal();
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-6 text-center">Ai là Gián điệp</h1>
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
