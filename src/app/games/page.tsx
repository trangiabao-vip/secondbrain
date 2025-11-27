'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import Link from "next/link";

const games = [
  {
    id: 'true-or-dare',
    title: 'True or Dare',
    description: 'Một trò chơi cổ điển để khám phá bí mật hoặc thực hiện những thử thách táo bạo.',
    icon: Icons.trueOrDare,
    href: '/games/true-or-dare',
  },
  {
    id: 'lucky-pin',
    title: 'Lucky Pin',
    description: 'Quay bánh xe may mắn để xem ai là người được chọn cho thử thách tiếp theo.',
    icon: Icons.luckyPin,
    href: '/games/lucky-pin',
  },
  {
    id: 'watch-together',
    title: 'Xem phim chung',
    description: 'Cùng bạn bè và người thân xem những bộ phim yêu thích trong thời gian thực.',
    icon: Icons.watchTogether,
    href: '/games/watch-together',
  },
  {
    id: 'business-card',
    title: 'Danh thiếp',
    description: 'Tạo và xem trước danh thiếp cá nhân của bạn một cách nhanh chóng và đơn giản.',
    icon: Icons.businessCard,
    href: '/games/business-card',
  },
  {
    id: 'who-is-the-spy',
    title: 'Ai là gián điệp',
    description: 'Một trò chơi suy luận xã hội, nơi người thường phải tìm ra gián điệp có từ khóa khác biệt.',
    icon: Icons.whoIsTheSpy,
    href: '/games/who-is-the-spy',
  }
];

export default function GamesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Khu vực Game</h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {games.map((game) => (
            <Card key={game.id} className="flex flex-col overflow-hidden transition-all hover:shadow-lg h-full">
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
              <CardFooter className="p-4 pt-0 mt-auto">
                  <Button asChild className="w-full">
                      <Link href={game.href} prefetch={false}>Chơi ngay</Link>
                  </Button>
              </CardFooter>
            </Card>
        ))}
      </div>
    </div>
  );
}
