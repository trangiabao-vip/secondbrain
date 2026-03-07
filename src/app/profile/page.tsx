'use client';
import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Bell, Camera, Mic, Wifi, WifiOff, Globe, Monitor, Bot, Languages, Cookie, Clipboard, Cpu, MemoryStick, Battery, BatteryCharging, Signal, Info } from 'lucide-react';

interface DeviceInfo {
  userAgent: string;
  screen: string;
  language: string;
  isOnline: boolean;
  cookiesEnabled: boolean;
}

interface HardwareInfo {
  cpuCores?: number;
  memory?: number;
  platform?: string;
  connectionType?: string;
  battery?: {
    level: number;
    charging: boolean;
  };
}

interface LocationInfo {
    latitude: number;
    longitude: number;
    accuracy: number;
}

type PermissionStatus = 'granted' | 'denied' | 'prompt';

function ProfileView() {
  const { user, isUserLoading } = useUser();
  const [deviceInfo, setDeviceInfo] = useState<Partial<DeviceInfo>>({});
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo>({});
  const [isHardwareInfoLoading, setIsHardwareInfoLoading] = useState(true);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  
  const [notificationPermission, setNotificationPermission] = useState<PermissionStatus | null>(null);
  const [cameraPermission, setCameraPermission] = useState<PermissionStatus | null>(null);
  const [micPermission, setMicPermission] = useState<PermissionStatus | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator) {
      // Basic info
      setDeviceInfo({
        userAgent: navigator.userAgent,
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        isOnline: navigator.onLine,
        cookiesEnabled: navigator.cookieEnabled,
      });

      const updateOnlineStatus = () => setDeviceInfo(prev => ({ ...prev, isOnline: navigator.onLine }));
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
      
      // Permissions
      if ('permissions' in navigator) {
          navigator.permissions.query({ name: 'notifications' }).then(status => {
              setNotificationPermission(status.state);
              status.onchange = () => setNotificationPermission(status.state);
          });
      }

      // Advanced Hardware & Network Info
      const getAdvancedInfo = async () => {
        setIsHardwareInfoLoading(true);
        const info: HardwareInfo = {};
        try {
          if ('hardwareConcurrency' in navigator) info.cpuCores = navigator.hardwareConcurrency;
          if ('deviceMemory' in navigator) info.memory = (navigator as any).deviceMemory;
          if ((navigator as any).userAgentData) {
            const uaData = await (navigator as any).userAgentData.getHighEntropyValues(['platform']);
            info.platform = uaData.platform;
          } else if ('platform' in navigator) {
            info.platform = navigator.platform;
          }
          if ('connection' in navigator) info.connectionType = (navigator as any).connection.effectiveType;

          if ('getBattery' in navigator) {
            const battery = await (navigator as any).getBattery();
            info.battery = {
              level: battery.level * 100,
              charging: battery.charging,
            };
          }
        } catch (error) {
          console.warn("Could not retrieve some advanced device info:", error);
        } finally {
          setHardwareInfo(info);
          setIsHardwareInfoLoading(false);
        }
      };

      getAdvancedInfo();

      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
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

  const handleRequestNotification = () => {
    if (!('Notification' in window)) {
        alert('Trình duyệt này không hỗ trợ thông báo trên máy tính để bàn');
        return;
    }
    Notification.requestPermission().then(permission => {
        setNotificationPermission(permission as PermissionStatus);
    });
  };

  const checkMediaPermission = async (name: 'camera' | 'microphone') => {
      if ('permissions' in navigator) {
          try {
            const status = await navigator.permissions.query({ name: name as PermissionName });
            if (name === 'camera') setCameraPermission(status.state);
            if (name === 'microphone') setMicPermission(status.state);
            status.onchange = () => {
                if (name === 'camera') setCameraPermission(status.state);
                if (name === 'microphone') setMicPermission(status.state);
            };
          } catch (e) {
             console.error(`Không thể truy vấn quyền ${name}:`, e);
             if (name === 'camera') setCameraPermission('prompt');
             if (name === 'microphone') setMicPermission('prompt');
          }
      }
  }

  const handleRequestMedia = async (type: 'camera' | 'microphone') => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ [type === 'camera' ? 'video' : 'audio']: true });
          // Stop tracks immediately after getting permission to avoid leaving camera/mic on
          stream.getTracks().forEach(track => track.stop());
          checkMediaPermission(type);
      } catch (err) {
          console.error(`Lỗi khi yêu cầu quyền ${type}:`, err);
          checkMediaPermission(type);
      }
  };

  useEffect(() => {
    checkMediaPermission('camera');
    checkMediaPermission('microphone');
  }, []);

  const renderPermissionStatus = (status: PermissionStatus | null, requestFn: () => void, featureName: string) => {
    if (status === 'granted') {
      return <Badge variant="secondary" className="bg-green-500/10 text-green-700">Đã cho phép</Badge>;
    }
    if (status === 'denied') {
      return <Badge variant="destructive">Đã từ chối</Badge>;
    }
    return <Button size="sm" onClick={requestFn}>Yêu cầu quyền</Button>;
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

        {/* User Account Card */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Icons.businessCard />Thông tin Tài khoản</CardTitle>
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

        {/* Browser & Device Info */}
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot />Thông tin Trình duyệt</CardTitle>
                <CardDescription>Thông tin kỹ thuật về môi trường trình duyệt của bạn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                 {Object.keys(deviceInfo).length > 0 ? (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="font-medium flex items-center gap-2"><Bot className="h-4 w-4"/>Trình duyệt (User Agent)</div>
                            <p className="text-muted-foreground text-right break-all">{deviceInfo.userAgent}</p>
                        </div>
                         <div className="flex items-center justify-between">
                            <div className="font-medium flex items-center gap-2"><Monitor className="h-4 w-4"/>Độ phân giải màn hình</div>
                            <p className="text-muted-foreground">{deviceInfo.screen}</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="font-medium flex items-center gap-2"><Languages className="h-4 w-4"/>Ngôn ngữ</div>
                            <p className="text-muted-foreground">{deviceInfo.language}</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="font-medium flex items-center gap-2"><Cookie className="h-4 w-4"/>Cookies</div>
                            <p className="text-muted-foreground">{deviceInfo.cookiesEnabled ? 'Đã bật' : 'Đã tắt'}</p>
                        </div>
                    </>
                ) : <Skeleton className="h-10 w-full"/>}
            </CardContent>
        </Card>

        {/* Hardware & Network Info */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Cpu />Thông tin Phần cứng & Mạng</CardTitle>
                <CardDescription>Thông tin kỹ thuật về phần cứng và kết nối mạng của thiết bị này.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                {isHardwareInfoLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="font-medium flex items-center gap-2">{deviceInfo.isOnline ? <Wifi className="h-4 w-4"/> : <WifiOff className="h-4 w-4"/>}Trạng thái mạng</div>
                            <Badge variant={deviceInfo.isOnline ? 'secondary' : 'destructive'}>{deviceInfo.isOnline ? 'Online' : 'Offline'}</Badge>
                        </div>
                         <div className="flex items-center justify-between">
                            <div className="font-medium flex items-center gap-2"><Signal className="h-4 w-4"/>Loại kết nối mạng</div>
                            <p className="text-muted-foreground capitalize">{hardwareInfo.connectionType || 'Không có'}</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="font-medium flex items-center gap-2"><Cpu className="h-4 w-4"/>Nhân CPU</div>
                            <p className="text-muted-foreground">{hardwareInfo.cpuCores || 'Không có'}</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="font-medium flex items-center gap-2"><MemoryStick className="h-4 w-4"/>Bộ nhớ thiết bị (Ước tính)</div>
                            <p className="text-muted-foreground">{hardwareInfo.memory ? `${hardwareInfo.memory} GB` : 'Không có'}</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="font-medium flex items-center gap-2"><Info className="h-4 w-4"/>Nền tảng</div>
                            <p className="text-muted-foreground">{hardwareInfo.platform || 'Không có'}</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="font-medium flex items-center gap-2">{hardwareInfo.battery?.charging ? <BatteryCharging className="h-4 w-4"/> : <Battery className="h-4 w-4"/>}Pin</div>
                            <p className="text-muted-foreground">{hardwareInfo.battery ? `${Math.round(hardwareInfo.battery.level)}% ${hardwareInfo.battery.charging ? '(Đang sạc)' : ''}` : 'Không có'}</p>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
        
        {/* Permissions Card */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clipboard />Quyền Truy cập & Tính năng</CardTitle>
                <CardDescription>Các tính năng yêu cầu quyền truy cập vào thiết bị của bạn. Thông tin này không được lưu trữ.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
                {/* Geolocation */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Globe className="h-4 w-4" />Vị trí địa lý</div>
                        {renderPermissionStatus(location ? 'granted' : (locationError ? 'denied' : 'prompt'), handleGetLocation, 'Vị trí')}
                    </div>
                     {isLocationLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Icons.ai className="h-4 w-4 animate-spin"/>
                            <span>Đang lấy vị trí...</span>
                        </div>
                    ) : location ? (
                        <div className="text-xs text-muted-foreground pl-6">
                            Vĩ độ: {location.latitude}, Kinh độ: {location.longitude} (Chính xác: {location.accuracy.toFixed(2)}m)
                        </div>
                    ) : locationError ? (
                        <p className="text-destructive text-xs pl-6">{locationError}</p>
                    ) : null}
                </div>
                 {/* Notifications */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Bell className="h-4 w-4" />Thông báo đẩy</div>
                        {renderPermissionStatus(notificationPermission, handleRequestNotification, 'Thông báo')}
                    </div>
                </div>
                {/* Camera */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Camera className="h-4 w-4" />Máy ảnh</div>
                        {renderPermissionStatus(cameraPermission, () => handleRequestMedia('camera'), 'Máy ảnh')}
                    </div>
                </div>
                {/* Microphone */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Mic className="h-4 w-4" />Microphone</div>
                        {renderPermissionStatus(micPermission, () => handleRequestMedia('microphone'), 'Microphone')}
                    </div>
                </div>
            </CardContent>
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
