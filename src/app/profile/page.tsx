
'use client';
import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';

interface DeviceInfo {
  userAgent: string;
  screen: string;
}

interface LocationInfo {
    latitude: number;
    longitude: number;
    accuracy: number;
}

function ProfileView() {
  const { user, isUserLoading } = useUser();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDeviceInfo({
        userAgent: navigator.userAgent,
        screen: `${window.screen.width}x${window.screen.height}`,
      });
    }
  }, []);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
        setIsLocationLoading(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setIsLocationLoading(false);
        },
        (error) => {
            setLocationError(`Lỗi: ${error.message}`);
            setIsLocationLoading(false);
        }
      );
    } else {
        setLocationError("Trình duyệt của bạn không hỗ trợ định vị.");
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
        </CardContent></Card>
        <Card><CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Hồ sơ & Thông tin</h2>

        <Card>
            <CardHeader>
                <CardTitle>Thông tin Tài khoản</CardTitle>
                <CardDescription>Đây là thông tin cơ bản được liên kết với tài khoản của bạn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div>
                    <p className="font-medium">Địa chỉ Email</p>
                    <p className="text-muted-foreground">{user.email}</p>
                </div>
                <div>
                    <p className="font-medium">User ID</p>
                    <p className="text-muted-foreground break-all">{user.uid}</p>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Thông tin Thiết bị</CardTitle>
                <CardDescription>Thông tin về trình duyệt và màn hình bạn đang sử dụng.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                 {deviceInfo ? (
                    <>
                        <div>
                            <p className="font-medium">Trình duyệt (User Agent)</p>
                            <p className="text-muted-foreground">{deviceInfo.userAgent}</p>
                        </div>
                        <div>
                            <p className="font-medium">Độ phân giải màn hình</p>
                            <p className="text-muted-foreground">{deviceInfo.screen}</p>
                        </div>
                    </>
                ) : <Skeleton className="h-10 w-full"/>}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Thông tin Vị trí</CardTitle>
                <CardDescription>Nhấp vào nút bên dưới để cho phép ứng dụng truy cập vị trí hiện tại của bạn. Thông tin này chỉ được sử dụng một lần và không được lưu trữ.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                {isLocationLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Icons.ai className="h-4 w-4 animate-spin"/>
                        <span>Đang lấy vị trí...</span>
                    </div>
                ) : location ? (
                    <>
                        <div>
                            <p className="font-medium">Vĩ độ</p>
                            <p className="text-muted-foreground">{location.latitude}</p>
                        </div>
                         <div>
                            <p className="font-medium">Kinh độ</p>
                            <p className="text-muted-foreground">{location.longitude}</p>
                        </div>
                         <div>
                            <p className="font-medium">Độ chính xác</p>
                            <p className="text-muted-foreground">Trong vòng {location.accuracy.toFixed(2)} mét</p>
                        </div>
                    </>
                ) : locationError ? (
                    <p className="text-destructive">{locationError}</p>
                ) : (
                    <p className="text-muted-foreground">Chưa có thông tin vị trí.</p>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handleGetLocation} disabled={isLocationLoading}>
                   Lấy vị trí hiện tại
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}

export default function ProfilePage() {
    return (
        <AuthGuard>
            <ProfileView />
        </AuthGuard>
    )
}
