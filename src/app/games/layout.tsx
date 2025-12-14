'use client';

import { GamePageLayout } from "@/components/layout/GamePageLayout";
import { type ReactNode } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function GamesLayout({ children }: { children: ReactNode }) {
    return (
        <AuthGuard>
            <GamePageLayout>
                {children}
            </GamePageLayout>
        </AuthGuard>
    )
}
