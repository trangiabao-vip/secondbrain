'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

const games = [
  {
    id: 'true-or-dare',
    title: 'True or Dare',
    description: 'Một trò chơi cổ điển để khám phá bí mật hoặc thực hiện những thử thách táo bạo.',
    icon: Icons.trueOrDare,
  },
  {
    id: 'lucky-pin',
    title: 'Lucky Pin',
    description: 'Quay bánh xe may mắn để xem ai là người được chọn cho thử thách tiếp theo.',
    icon: Icons.luckyPin,
  }
];

export function GameView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Khu vực Game</h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {games.map((game) => (
          <Card key={game.id} className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
            <CardHeader className="p-4">
               <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <game.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold">{game.title}</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">
              <CardDescription>{game.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button className="w-full" disabled>
                    Chơi ngay
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
