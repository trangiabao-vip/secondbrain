'use client';

import { AppLayout } from "@/components/layout/AppLayout";
import { type ReactNode } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function GamesLayout({ children }: { children: ReactNode }) {
    return (
        <AuthGuard>
            <AppLayout>
                {children}
            </AppLayout>
        </AuthGuard>
    )
}
