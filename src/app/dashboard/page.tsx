'use client';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardView }
from '@/components/dashboard/DashboardView';
import { AppLayout } from '@/components/layout/AppLayout';

function DashboardPage() {
    return (
        <AuthGuard>
            <AppLayout>
                <DashboardView />
            </AppLayout>
        </AuthGuard>
    );
}

export default DashboardPage;
