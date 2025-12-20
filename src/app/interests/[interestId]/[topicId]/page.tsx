'use client';
import { AuthGuard } from "@/components/auth/AuthGuard";
import { TopicDetailView } from "@/components/details/TopicDetailView";

export default function TopicPage() {
    return (
        <AuthGuard>
            <TopicDetailView />
        </AuthGuard>
    );
}
