
'use client';
import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Bell, Camera, Mic, Wifi, WifiOff, Globe, Monitor, Bot, Languages, Cookie, Cpu, MemoryStick, Battery, BatteryCharging, Signal, Info, Database, Eye, Move3d, Orbit, Sun, Speaker, Nfc, ClipboardPaste, Repeat } from 'lucide-react';

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

type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

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
  
  // New permissions state
  const [clipboardReadPermission, setClipboardReadPermission] = useState<PermissionStatus | null>(null);
  const [clipboardWritePermission, setClipboardWritePermission] = useState<PermissionStatus | null>(null);
  const [backgroundSyncPermission, setBackgroundSyncPermission] = useState<PermissionStatus | null>(null);
  const [persistentStoragePermission, setPersistentStoragePermission] = useState<PermissionStatus | null>(null);
  const [screenWakeLockPermission, setScreenWakeLockPermission] = useState<PermissionStatus | null>(null);
  const [accelerometerPermission, setAccelerometerPermission] = useState<PermissionStatus | null>(null);
  const [gyroscopePermission, setGyroscopePermission] = useState<PermissionStatus | null>(null);
  const [ambientLightSensorPermission, setAmbientLightSensorPermission] = useState<PermissionStatus | null>(null);
  const [speakerSelectionPermission, setSpeakerSelectionPermission] = useState<PermissionStatus | null>(null);
  const [nfcPermission, setNfcPermission] = useState<PermissionStatus | null>(null);


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
      const checkQueryablePermission = async (name: PermissionName, setter: React.Dispatch<React.SetStateAction<PermissionStatus | null>>) => {
        if ('permissions' in navigator) {
            try {
                const status = await navigator.permissions.query({ name });
                setter(status.state as PermissionStatus);
                status.onchange = () => setter(status.state as PermissionStatus);
            } catch (e) {
                console.warn(`Could not query permission ${name}:`, e);
                setter('unsupported');
            }
        } else {
          setter('unsupported');
        }
      }
      
      checkQueryablePermission('notifications', setNotificationPermission);
      checkQueryablePermission('camera', setCameraPermission);
      checkQueryablePermission('microphone', setMicPermission);
      checkQueryablePermission('clipboard-read', setClipboardReadPermission);
      checkQueryablePermission('clipboard-write', setClipboardWritePermission);
      checkQueryablePermission('background-sync', setBackgroundSyncPermission);
      checkQueryablePermission('accelerometer', setAccelerometerPermission);
      checkQueryablePermission('gyroscope', setGyroscopePermission);
      checkQueryablePermission('ambient-light-sensor', setAmbientLightSensorPermission);
      checkQueryablePermission('speaker-selection', setSpeakerSelectionPermission);
      checkQueryablePermission('nfc', setNfcPermission);


      if (navigator.storage && navigator.storage.persisted) {
        navigator.storage.persisted().then(persisted => {
          setPersistentStoragePermission(persisted ? 'granted' : 'prompt');
        });
      } else {
        setPersistentStoragePermission('unsupported');
      }
  
      if ('wakeLock' in navigator) {
        setScreenWakeLockPermission('prompt');
      } else {
        setScreenWakeLockPermission('unsupported');
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

  const handleRequestMedia = async (type: 'camera' | 'microphone') => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ [type === 'camera' ? 'video' : 'audio']: true });
          // Stop tracks immediately after getting permission to avoid leaving camera/mic on
          stream.getTracks().forEach(track => track.stop());
          if (type === 'camera') setCameraPermission('granted');
          if (type === 'microphone') setMicPermission('granted');
      } catch (err) {
          console.error(`Lỗi khi yêu cầu quyền ${type}:`, err);
          if (type === 'camera') setCameraPermission('denied');
          if (type === 'microphone') setMicPermission('denied');
      }
  };

  const handleUnsupported = () => {
    alert("Tính năng này không được trình duyệt của bạn hỗ trợ hoặc yêu cầu thiết lập đặc biệt (ví dụ: HTTPS).");
  };

  const handleRequestClipboardWrite = async () => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
       handleUnsupported();
       return;
   }
   try {
       await navigator.clipboard.writeText(' ');
       alert('Đã cấp quyền ghi vào Clipboard (quyền này thường được cấp tự động).');
       setClipboardWritePermission('granted');
   } catch (err: any) {
       if(err.name === 'NotAllowedError') {
           setClipboardWritePermission('denied');
       }
       console.error('Clipboard write request failed:', err);
   }
 };

 const handleRequestPersistentStorage = async () => {
    if (navigator.storage && navigator.storage.persist) {
        const persisted = await navigator.storage.persist();
        setPersistentStoragePermission(persisted ? 'granted' : 'denied');
        alert(persisted ? 'Đã cấp quyền Lưu trữ bền bỉ.' : 'Yêu cầu Lưu trữ bền bỉ đã bị từ chối.');
    } else {
        handleUnsupported();
    }
  };

  const handleRequestScreenWakeLock = async () => {
    if ('wakeLock' in navigator) {
        try {
            const wakeLock = await navigator.wakeLock.request('screen');
            setScreenWakeLockPermission('granted');
            alert('Đã bật khóa màn hình. Nó sẽ được giải phóng khi bạn rời khỏi trang.');
            wakeLock.addEventListener('release', () => {
                setScreenWakeLockPermission('prompt');
            });
        } catch (err: any) {
            setScreenWakeLockPermission('denied');
            console.error('Screen Wake Lock request failed:', err);
        }
    } else {
        handleUnsupported();
    }
  };


  const renderPermissionStatus = (status: PermissionStatus | null, requestFn: () => void, featureName: string) => {
    if (status === 'unsupported') {
      return <Badge variant="secondary">Không hỗ trợ</Badge>;
    }
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
                <CardTitle className="flex items-center gap-2"><Icons.clipboard />Quyền Truy cập & Tính năng</CardTitle>
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
                 {/* Clipboard Write */}
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><ClipboardPaste className="h-4 w-4" />Ghi vào Clipboard</div>
                        {renderPermissionStatus(clipboardWritePermission, handleRequestClipboardWrite, 'Ghi vào Clipboard')}
                    </div>
                </div>
                {/* Background Sync */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Repeat className="h-4 w-4" />Đồng bộ nền</div>
                        {renderPermissionStatus(backgroundSyncPermission, handleUnsupported, 'Đồng bộ nền')}
                    </div>
                </div>
                {/* Persistent Storage */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Database className="h-4 w-4" />Lưu trữ bền bỉ</div>
                        {renderPermissionStatus(persistentStoragePermission, handleRequestPersistentStorage, 'Lưu trữ bền bỉ')}
                    </div>
                </div>
                {/* Screen Wake Lock */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Eye className="h-4 w-4" />Khóa màn hình</div>
                        {renderPermissionStatus(screenWakeLockPermission, handleRequestScreenWakeLock, 'Khóa màn hình')}
                    </div>
                </div>
                {/* Accelerometer */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Move3d className="h-4 w-4" />Cảm biến gia tốc</div>
                        {renderPermissionStatus(accelerometerPermission, handleUnsupported, 'Cảm biến gia tốc')}
                    </div>
                </div>
                {/* Gyroscope */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Orbit className="h-4 w-4" />Cảm biến con quay</div>
                        {renderPermissionStatus(gyroscopePermission, handleUnsupported, 'Cảm biến con quay')}
                    </div>
                </div>
                 {/* Ambient Light */}
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Sun className="h-4 w-4" />Cảm biến ánh sáng</div>
                        {renderPermissionStatus(ambientLightSensorPermission, handleUnsupported, 'Cảm biến ánh sáng')}
                    </div>
                </div>
                 {/* Speaker Selection */}
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Speaker className="h-4 w-4" />Chọn loa</div>
                        {renderPermissionStatus(speakerSelectionPermission, handleUnsupported, 'Chọn loa')}
                    </div>
                </div>
                 {/* NFC */}
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Nfc className="h-4 w-4" />NFC</div>
                        {renderPermissionStatus(nfcPermission, handleUnsupported, 'NFC')}
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
