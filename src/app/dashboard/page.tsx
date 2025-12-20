'use client';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardView }
from '@/components/dashboard/DashboardView';

function DashboardPage() {
    return (
        <AuthGuard>
            <DashboardView />
        </AuthGuard>
    );
}

export default DashboardPage;
