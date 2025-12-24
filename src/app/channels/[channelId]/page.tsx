'use client';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ChannelVisualizer } from './ChannelVisualizer';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Icons } from '@/components/icons';

function ChannelDetailPage() {
    const params = useParams();
    const channelId = params.channelId as string;

    return (
        <div className="h-full flex flex-col">
            <div className="mb-4">
                 <Button asChild variant="outline" size="sm">
                    <Link href="/channels">
                        <Icons.left className="mr-2 h-4 w-4" />
                        Quay lại danh sách Kênh
                    </Link>
                </Button>
            </div>
            {channelId ? <ChannelVisualizer channelId={channelId} /> : <p>Không tìm thấy kênh.</p>}
        </div>
    );
}


export default function ChannelDetail() {
    return (
        <AuthGuard>
            <ChannelDetailPage />
        </AuthGuard>
    )
}
