'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, arrayUnion, arrayRemove, collection, addDoc, query, orderBy } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import ReactPlayer from 'react-player/youtube';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { type WatchRoom, type ChatMessage, type Participant } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { generateId } from '@/lib/utils';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const SYNC_THRESHOLD = 2; // seconds

function ChatBox({ roomId }: { roomId: string }) {
  const { firestore, user } = useFirebase();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    return query(collection(firestore, 'watchRooms', roomId, 'messages'), orderBy('createdAt', 'asc'));
  }, [firestore, roomId]);

  const { data: messages } = useCollection<ChatMessage>(messagesQuery);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user) return;

    const messageData = {
      text: newMessage,
      userId: user.uid,
      displayName: user.email?.split('@')[0] || 'Anonymous',
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(firestore, 'watchRooms', roomId, 'messages'), messageData);
    setNewMessage('');
  };

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Bình luận trực tiếp</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 py-4">
          <div className="space-y-4">
            {messages?.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(msg.displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{msg.displayName}</p>
                  <div className="text-sm text-muted-foreground bg-secondary p-2 rounded-lg">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t p-4">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nhập bình luận..."
        />
        <Button type="submit" size="icon">
          <Icons.send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}

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

  useEffect(() => {
    if (!user || !roomRef) return;
    const participant: Participant = {
      uid: user.uid,
      displayName: user.email?.split('@')[0] || 'Anonymous',
    };
    updateDocumentNonBlocking(roomRef, { participants: arrayUnion(participant) });

    return () => {
      updateDocumentNonBlocking(roomRef, { participants: arrayRemove(participant) });
    };
  }, [user, roomRef]);

  useEffect(() => {
    if (roomData && playerRef.current && isReady) {
      isUpdatingFromFirestore.current = true;
      if (roomData.videoUrl && videoUrl !== roomData.videoUrl) {
        setVideoUrl(roomData.videoUrl);
      }
      const playerCurrentTime = playerRef.current.getCurrentTime() || 0;
      if (Math.abs(playerCurrentTime - roomData.currentTime) > SYNC_THRESHOLD) {
        playerRef.current.seekTo(roomData.currentTime, 'seconds');
      }
      setTimeout(() => {
        isUpdatingFromFirestore.current = false;
      }, 500);
    }
  }, [roomData, isReady, videoUrl]);

  const createRoom = () => {
    if (!firestore || !user) return;
    const newRoomId = generateId();
    const newRoomRef = doc(firestore, 'watchRooms', newRoomId);
    setDocumentNonBlocking(newRoomRef, {
      isPlaying: false,
      currentTime: 0,
      createdAt: serverTimestamp(),
      lastUpdatedBy: user.uid,
      participants: [],
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

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

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
    <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
      <div className="lg:col-span-2 flex flex-col gap-6">
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
                                  playerVars: { controls: 1 }
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
        <Card>
            <CardHeader>
                <CardTitle>Người tham gia ({roomData?.participants?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
                {roomData?.participants?.map(p => (
                    <div key={p.uid} className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{getInitials(p.displayName)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{p.displayName}</span>
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1 h-full">
        <ChatBox roomId={roomId} />
      </div>
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
