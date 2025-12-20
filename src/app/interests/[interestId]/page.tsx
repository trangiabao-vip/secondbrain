'use client';

import { TopicGrid } from "@/components/topics/TopicGrid";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { useAppContext } from "@/contexts/AppContext";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function InterestPage() {
    const { interests } = useAppContext();

    if (interests.length === 0) {
        return (
            <AuthGuard>
                <WelcomeScreen />
            </AuthGuard>
        );
    }
    
    return (
        <AuthGuard>
            <TopicGrid />
        </AuthGuard>
    );
}
