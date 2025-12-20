'use client';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { GlobalScheduleView } from '@/components/details/GlobalScheduleView';

function SchedulePage() {
    return (
        <AuthGuard>
            <GlobalScheduleView />
        </AuthGuard>
    );
}

export default SchedulePage;
