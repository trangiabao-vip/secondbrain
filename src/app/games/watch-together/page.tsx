'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import ReactPlayer from 'react-player/youtube';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { type WatchRoom } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { generateId } from '@/lib/utils';
import { AuthGuard } from '@/components/auth/AuthGuard';

const SYNC_THRESHOLD = 2; // seconds

function WatchTogetherPage() {
  const { firestore, user } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const playerRef = useRef<ReactPlayer>(null);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isReady, setIsReady] = useState(false);
  const isUpdatingFromFirestore = useRef(false);

  // Set room ID from URL query param
  useEffect(() => {
    const queryRoomId = searchParams.get('roomId');
    if (queryRoomId) {
      setRoomId(queryRoomId);
    }
  }, [searchParams]);

  const roomRef = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    return doc(firestore, 'watchRooms', roomId);
  }, [firestore, roomId]);

  const { data: roomData } = useDoc<WatchRoom>(roomRef);

  // Effect to handle state synchronization from Firestore
  useEffect(() => {
    if (roomData && playerRef.current && isReady) {
      isUpdatingFromFirestore.current = true;

      // Sync video URL
      if (roomData.videoUrl && videoUrl !== roomData.videoUrl) {
        setVideoUrl(roomData.videoUrl);
      }

      // Sync currentTime - seek if the difference is significant
      const playerCurrentTime = playerRef.current.getCurrentTime() || 0;
      if (Math.abs(playerCurrentTime - roomData.currentTime) > SYNC_THRESHOLD) {
        playerRef.current.seekTo(roomData.currentTime, 'seconds');
      }
      
      // Let subsequent updates be from the user
      // A small delay helps prevent race conditions
      setTimeout(() => {
        isUpdatingFromFirestore.current = false;
      }, 500);
    }
  }, [roomData, isReady]);


  const createRoom = () => {
    if (!firestore || !user) return;
    const newRoomId = generateId();
    const newRoomRef = doc(firestore, 'watchRooms', newRoomId);
    setDocumentNonBlocking(newRoomRef, {
      isPlaying: false,
      currentTime: 0,
      createdAt: serverTimestamp(),
      lastUpdatedBy: user.uid,
    }, {});
    router.push(`${pathname}?roomId=${newRoomId}`);
    setRoomId(newRoomId);
  };
  
  const updateVideoUrl = () => {
    if (!roomRef || !user) return;
    updateDocumentNonBlocking(roomRef, { videoUrl, lastUpdatedBy: user.uid });
  };
  
  const handlePlayerStateChange = (state: 'play' | 'pause') => {
      if (isUpdatingFromFirestore.current || !roomRef || !user || !isReady) return;
      
      const isPlaying = state === 'play';

      if (roomData?.isPlaying !== isPlaying) {
          updateDocumentNonBlocking(roomRef, { isPlaying, lastUpdatedBy: user.uid });
      }
  };

  const handleSeek = (seconds: number) => {
    if (isUpdatingFromFirestore.current || !roomRef || !user || !isReady) return;
     if (Math.abs((roomData?.currentTime || 0) - seconds) > SYNC_THRESHOLD) {
        updateDocumentNonBlocking(roomRef, { currentTime: seconds, lastUpdatedBy: user.uid });
     }
  }

  const copyInviteLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Đã sao chép!',
      description: 'Đường dẫn mời đã được sao chép vào clipboard.',
    });
  }

  if (!roomId) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <Icons.watchTogether className="h-24 w-24 mb-4 text-primary" />
        <h1 className="text-2xl font-bold mb-2">Xem phim chung</h1>
        <p className="text-muted-foreground mb-6">Tạo một phòng mới để bắt đầu xem video với bạn bè.</p>
        <Button onClick={createRoom}>
            <Icons.add className="mr-2 h-4 w-4" />
            Tạo phòng mới
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Phòng xem phim chung</CardTitle>
          <CardDescription>Dán một link video YouTube để bắt đầu. Mời bạn bè bằng cách chia sẻ đường dẫn URL.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex gap-2">
                <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Dán link video YouTube vào đây"
                />
                <Button onClick={updateVideoUrl}>Đặt video</Button>
                 <Button variant="outline" onClick={copyInviteLink}>
                    <Icons.copy className="mr-2 h-4 w-4"/>
                    Mời
                </Button>
            </div>

            <div className="aspect-video w-full bg-slate-900/50 rounded-lg overflow-hidden">
                {videoUrl && ReactPlayer.canPlay(videoUrl) ? (
                    <ReactPlayer
                        ref={playerRef}
                        url={videoUrl}
                        width="100%"
                        height="100%"
                        controls
                        playing={roomData?.isPlaying}
                        onReady={() => setIsReady(true)}
                        onPlay={() => handlePlayerStateChange('play')}
                        onPause={() => handlePlayerStateChange('pause')}
                        onSeek={handleSeek}
                        config={{
                            youtube: {
                                playerVars: {
                                    // Make sure controls are always visible
                                    // Note: some vars might not work with all videos
                                    controls: 1,
                                }
                            }
                        }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Icons.watchTogether className="h-16 w-16 mb-4"/>
                        <p>Đang chờ video...</p>
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default function WatchTogether() {
    return (
        <AuthGuard>
            <WatchTogetherPage />
        </AuthGuard>
    )
}
