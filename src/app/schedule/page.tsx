'use client';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { GlobalScheduleView } from '@/components/details/GlobalScheduleView';
import { AppLayout } from '@/components/layout/AppLayout';

function SchedulePage() {
    return (
        <AuthGuard>
            <AppLayout>
                <GlobalScheduleView />
            </AppLayout>
        </AuthGuard>
    );
}

export default SchedulePage;
