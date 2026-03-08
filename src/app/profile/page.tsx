
'use client';
import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Bell, Camera, Mic, Wifi, WifiOff, Globe, Monitor, Bot, Languages, Cookie, Cpu, MemoryStick, Battery, BatteryCharging, Signal, Info, Database, Eye, Move3d, Orbit, Sun, Speaker, Nfc, ClipboardPaste, Repeat, LocateFixed, Music, Timer, CreditCard, AppWindow, Type, Bluetooth, Usb, ScreenShare, FileImage } from 'lucide-react';
import type { DeviceProfile } from '@/lib/data';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

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

type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported' | 'unknown';

function ProfileView() {
  const { user, firestore, isUserLoading } = useFirebase();
  const [deviceInfo, setDeviceInfo] = useState<Partial<DeviceInfo>>({});
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo>({});
  const [isHardwareInfoLoading, setIsHardwareInfoLoading] = useState(true);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  
  const [notificationPermission, setNotificationPermission] = useState<PermissionStatus | null>(null);
  const [cameraPermission, setCameraPermission] = useState<PermissionStatus | null>(null);
  const [micPermission, setMicPermission] = useState<PermissionStatus | null>(null);
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

  // 10 new permissions
  const [magnetometerPermission, setMagnetometerPermission] = useState<PermissionStatus | null>(null);
  const [midiPermission, setMidiPermission] = useState<PermissionStatus | null>(null);
  const [idleDetectionPermission, setIdleDetectionPermission] = useState<PermissionStatus | null>(null);
  const [paymentHandlerPermission, setPaymentHandlerPermission] = useState<PermissionStatus | null>(null);
  const [windowManagementPermission, setWindowManagementPermission] = useState<PermissionStatus | null>(null);
  const [localFontsPermission, setLocalFontsPermission] = useState<PermissionStatus | null>(null);
  const [displayCapturePermission, setDisplayCapturePermission] = useState<PermissionStatus | null>(null);
  const [storageAccessPermission, setStorageAccessPermission] = useState<PermissionStatus | null>(null);
  const [bluetoothPermission, setBluetoothPermission] = useState<PermissionStatus | null>(null);
  const [usbPermission, setUsbPermission] = useState<PermissionStatus | null>(null);

  const profilesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'deviceProfiles');
  }, [firestore, user]);

  const { data: savedProfiles } = useCollection<DeviceProfile>(profilesQuery);

  useEffect(() => {
    if (hardwareInfo.platform) {
        setDeviceName(hardwareInfo.platform);
    } else if (deviceInfo.userAgent) {
        const match = deviceInfo.userAgent.match(/\(([^)]+)\)/);
        if (match && match[1]) {
            const platform = match[1].split(';')[0];
            setDeviceName(platform);
        } else {
            setDeviceName('Thiết bị không tên');
        }
    }
  }, [hardwareInfo.platform, deviceInfo.userAgent]);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator) {
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

      // New permissions
      checkQueryablePermission('magnetometer', setMagnetometerPermission);
      checkQueryablePermission('midi', setMidiPermission);
      checkQueryablePermission('idle-detection', setIdleDetectionPermission);
      checkQueryablePermission('payment-handler', setPaymentHandlerPermission);
      checkQueryablePermission('window-management', setWindowManagementPermission);

      if ('queryLocalFonts' in window) {
        checkQueryablePermission('local-fonts' as PermissionName, setLocalFontsPermission);
      } else {
        setLocalFontsPermission('unsupported');
      }

      // Special handling for non-Permission API features
      if ('getDisplayMedia' in navigator.mediaDevices) {
        setDisplayCapturePermission('prompt');
      } else {
        setDisplayCapturePermission('unsupported');
      }
      
      if ('hasStorageAccess' in document) {
        document.hasStorageAccess().then(hasAccess => {
          setStorageAccessPermission(hasAccess ? 'granted' : 'prompt');
        }).catch(() => setStorageAccessPermission('unsupported'));
      } else {
        setStorageAccessPermission('unsupported');
      }

      if ('bluetooth' in navigator) {
        setBluetoothPermission('prompt');
      } else {
        setBluetoothPermission('unsupported');
      }
      
      if ('usb' in navigator) {
        setUsbPermission('prompt');
      } else {
        setUsbPermission('unsupported');
      }


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
    toast({
        variant: 'destructive',
        title: "Không được hỗ trợ",
        description: "Tính năng này không được trình duyệt của bạn hỗ trợ hoặc yêu cầu thiết lập đặc biệt (ví dụ: HTTPS)."
    });
  };

  const handleRequestClipboardWrite = async () => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
       handleUnsupported();
       return;
   }
   try {
       await navigator.clipboard.writeText(' ');
       toast({title: 'Đã cấp quyền ghi vào Clipboard (quyền này thường được cấp tự động).'});
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
        toast({title: persisted ? 'Đã cấp quyền Lưu trữ bền bỉ.' : 'Yêu cầu Lưu trữ bền bỉ đã bị từ chối.'});
    } else {
        handleUnsupported();
    }
  };

  const handleRequestScreenWakeLock = async () => {
    if ('wakeLock' in navigator) {
        try {
            const wakeLock = await navigator.wakeLock.request('screen');
            setScreenWakeLockPermission('granted');
            toast({title: 'Đã bật khóa màn hình. Nó sẽ được giải phóng khi bạn rời khỏi trang.'});
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

    const handleRequestDisplayCapture = async () => {
      if ('getDisplayMedia' in navigator.mediaDevices) {
          try {
              const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
              stream.getTracks().forEach(track => track.stop());
              setDisplayCapturePermission('granted');
          } catch (err) {
              setDisplayCapturePermission('denied');
              console.error('Display capture request failed:', err);
          }
      } else {
          handleUnsupported();
      }
  };

  const handleRequestStorageAccess = async () => {
      if ('requestStorageAccess' in document) {
          try {
              await document.requestStorageAccess();
              setStorageAccessPermission('granted');
          } catch (err) {
              setStorageAccessPermission('denied');
              console.error('Storage Access API request failed:', err);
          }
      } else {
          handleUnsupported();
      }
  };

  const handleRequestBluetooth = async () => {
    if ('requestDevice' in (navigator as any).bluetooth) {
        try {
            await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true });
            setBluetoothPermission('granted');
            toast({ title: 'Đã chọn thiết bị Bluetooth (mô phỏng).', description: 'Thực tế sẽ liệt kê các dịch vụ.' });
        } catch (error) {
            setBluetoothPermission('denied');
            console.error('Yêu cầu Bluetooth thất bại:', error);
        }
    } else {
        handleUnsupported();
    }
  };

    const handleRequestUsb = async () => {
        if ('requestDevice' in navigator.usb) {
            try {
                await navigator.usb.requestDevice({ filters: [] });
                setUsbPermission('granted');
                toast({ title: 'Đã chọn thiết bị USB (mô phỏng).', description: 'Thực tế sẽ chỉ định bộ lọc thiết bị.' });
            } catch (error) {
                setUsbPermission('denied');
                console.error('Yêu cầu USB thất bại:', error);
            }
        } else {
            handleUnsupported();
        }
    };

  const handleSaveProfile = () => {
    if (!user) return;

    const permissions = {
        notifications: notificationPermission,
        camera: cameraPermission,
        microphone: micPermission,
        clipboardRead: clipboardReadPermission,
        clipboardWrite: clipboardWritePermission,
        backgroundSync: backgroundSyncPermission,
        persistentStorage: persistentStoragePermission,
        screenWakeLock: screenWakeLockPermission,
        accelerometer: accelerometerPermission,
        gyroscope: gyroscopePermission,
        ambientLightSensor: ambientLightSensorPermission,
        speakerSelection: speakerSelectionPermission,
        nfc: nfcPermission,
        geolocation: location ? 'granted' : (locationError ? 'denied' : 'prompt'),
        magnetometer: magnetometerPermission,
        midi: midiPermission,
        idleDetection: idleDetectionPermission,
        paymentHandler: paymentHandlerPermission,
        windowManagement: windowManagementPermission,
        localFonts: localFontsPermission,
        displayCapture: displayCapturePermission,
        storageAccess: storageAccessPermission,
        bluetooth: bluetoothPermission,
        usb: usbPermission,
    };
    
    const filteredPermissions = Object.fromEntries(Object.entries(permissions).filter(([, v]) => v != null)) as Record<string, string>;

    const profileData: Omit<DeviceProfile, 'id'> = {
        userId: user.uid,
        createdAt: serverTimestamp(),
        deviceName: deviceName || 'Thiết bị không tên',
        deviceInfo,
        hardwareInfo,
        permissions: filteredPermissions,
    };
    
    const collectionRef = collection(firestore, 'users', user.uid, 'deviceProfiles');
    addDocumentNonBlocking(collectionRef, profileData);

    toast({
        title: "Đã lưu hồ sơ thiết bị!",
        description: `Thông tin cho "${profileData.deviceName}" đã được lưu.`,
    });
  };

  const handleDeleteProfile = (profileId: string) => {
    if (!user) return;
    const docRef = doc(firestore, 'users', user.uid, 'deviceProfiles', profileId);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Đã xóa hồ sơ thiết bị.",
    });
  }


  const renderPermissionStatus = (status: PermissionStatus | null, requestFn: () => void) => {
    if (status === 'unsupported') {
      return <Badge variant="secondary">Không hỗ trợ</Badge>;
    }
    if (status === 'granted') {
      return <Badge variant="secondary" className="bg-green-500/10 text-green-700">Đã cho phép</Badge>;
    }
    if (status === 'denied') {
      return <Badge variant="destructive">Đã từ chối</Badge>;
    }
    if (status === 'unknown') {
      return <Badge variant="outline">Không rõ</Badge>;
    }
    return <Button size="sm" onClick={requestFn}>Yêu cầu</Button>;
  };
  
  const renderStoredPermissionStatus = (status: string | null) => {
    if (status === 'unsupported') {
      return <Badge variant="secondary">Không hỗ trợ</Badge>;
    }
    if (status === 'granted') {
      return <Badge variant="secondary" className="bg-green-500/10 text-green-700">Đã cho phép</Badge>;
    }
    if (status === 'denied') {
      return <Badge variant="destructive">Đã từ chối</Badge>;
    }
     if (status === 'prompt') {
      return <Badge variant="outline">Chờ hỏi</Badge>;
    }
    return <Badge variant="secondary">Không rõ</Badge>;
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
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Icons.clipboard />Quyền Truy cập & Tính năng</CardTitle>
                <CardDescription>Các tính năng yêu cầu quyền truy cập vào thiết bị của bạn. Thông tin này không được lưu trữ trừ khi bạn lưu hồ sơ thiết bị.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Globe className="h-4 w-4" />Vị trí địa lý</div>
                        {renderPermissionStatus(location ? 'granted' : (locationError ? 'denied' : 'prompt'), handleGetLocation)}
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
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Bell className="h-4 w-4" />Thông báo đẩy</div>
                        {renderPermissionStatus(notificationPermission, handleRequestNotification)}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Camera className="h-4 w-4" />Máy ảnh</div>
                        {renderPermissionStatus(cameraPermission, () => handleRequestMedia('camera'))}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Mic className="h-4 w-4" />Microphone</div>
                        {renderPermissionStatus(micPermission, () => handleRequestMedia('microphone'))}
                    </div>
                </div>
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><FileImage className="h-4 w-4" />Truy cập Ảnh/Tệp</div>
                        <Badge variant="outline">Qua hành động của bạn</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">
                        Ứng dụng chỉ có thể truy cập các tệp (ảnh, tài liệu) mà bạn chủ động chọn từ hộp thoại của thiết bị khi tải lên.
                    </p>
                </div>
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><ClipboardPaste className="h-4 w-4" />Ghi vào Clipboard</div>
                        {renderPermissionStatus(clipboardWritePermission, handleRequestClipboardWrite)}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Repeat className="h-4 w-4" />Đồng bộ nền</div>
                        {renderPermissionStatus(backgroundSyncPermission, handleUnsupported)}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Database className="h-4 w-4" />Lưu trữ bền bỉ</div>
                        {renderPermissionStatus(persistentStoragePermission, handleRequestPersistentStorage)}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Eye className="h-4 w-4" />Khóa màn hình</div>
                        {renderPermissionStatus(screenWakeLockPermission, handleRequestScreenWakeLock)}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Move3d className="h-4 w-4" />Cảm biến gia tốc</div>
                        {renderPermissionStatus(accelerometerPermission, handleUnsupported)}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Orbit className="h-4 w-4" />Cảm biến con quay</div>
                        {renderPermissionStatus(gyroscopePermission, handleUnsupported)}
                    </div>
                </div>
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Sun className="h-4 w-4" />Cảm biến ánh sáng</div>
                        {renderPermissionStatus(ambientLightSensorPermission, handleUnsupported)}
                    </div>
                </div>
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Speaker className="h-4 w-4" />Chọn loa</div>
                        {renderPermissionStatus(speakerSelectionPermission, handleUnsupported)}
                    </div>
                </div>
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Nfc className="h-4 w-4" />NFC</div>
                        {renderPermissionStatus(nfcPermission, handleUnsupported)}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><LocateFixed className="h-4 w-4" />Cảm biến từ kế</div>
                        {renderPermissionStatus(magnetometerPermission, handleUnsupported)}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Music className="h-4 w-4" />MIDI</div>
                        {renderPermissionStatus(midiPermission, handleUnsupported)}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Timer className="h-4 w-4" />Phát hiện không hoạt động</div>
                        {renderPermissionStatus(idleDetectionPermission, handleUnsupported)}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><CreditCard className="h-4 w-4" />Xử lý thanh toán</div>
                        {renderPermissionStatus(paymentHandlerPermission, handleUnsupported)}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><AppWindow className="h-4 w-4" />Quản lý cửa sổ</div>
                        {renderPermissionStatus(windowManagementPermission, handleUnsupported)}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Type className="h-4 w-4" />Phông chữ cục bộ</div>
                        {renderPermissionStatus(localFontsPermission, handleUnsupported)}
                    </div>
                </div>
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><ScreenShare className="h-4 w-4" />Quay màn hình</div>
                        {renderPermissionStatus(displayCapturePermission, handleRequestDisplayCapture)}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Database className="h-4 w-4" />Truy cập bộ nhớ</div>
                        {renderPermissionStatus(storageAccessPermission, handleRequestStorageAccess)}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Bluetooth className="h-4 w-4" />Bluetooth</div>
                        {renderPermissionStatus(bluetoothPermission, handleRequestBluetooth)}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2"><Usb className="h-4 w-4" />USB</div>
                        {renderPermissionStatus(usbPermission, handleRequestUsb)}
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">Lưu Hồ sơ Thiết bị</CardTitle>
                <CardDescription>Lưu một ảnh chụp nhanh thông tin của thiết bị hiện tại vào tài khoản của bạn.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Label htmlFor="device-name">Tên thiết bị</Label>
                    <Input id="device-name" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder="ví dụ: Laptop của tôi"/>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSaveProfile}>Lưu hồ sơ thiết bị</Button>
            </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">Các thiết bị đã lưu</CardTitle>
                <CardDescription>Xem lại thông tin từ các thiết bị bạn đã lưu trước đây.</CardDescription>
            </CardHeader>
            <CardContent>
                {savedProfiles && savedProfiles.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {savedProfiles.map(profile => (
                            <AccordionItem value={profile.id} key={profile.id}>
                                <AccordionTrigger>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full pr-4">
                                        <span className="font-semibold text-left">{profile.deviceName}</span>
                                        <span className="text-xs text-muted-foreground text-left sm:text-right mt-1 sm:mt-0">
                                            {profile.createdAt ? format(profile.createdAt.toDate(), "HH:mm, dd/MM/yyyy", { locale: vi }) : ''}
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 text-sm p-4">
                                    <h4 className="font-semibold">Thông tin trình duyệt</h4>
                                    <p><span className="font-medium">User Agent:</span> <span className="text-muted-foreground break-all">{profile.deviceInfo.userAgent}</span></p>
                                    <p><span className="font-medium">Màn hình:</span> <span className="text-muted-foreground">{profile.deviceInfo.screen}</span></p>
                                     <h4 className="font-semibold pt-2">Thông tin phần cứng & mạng</h4>
                                     <p><span className="font-medium">Nền tảng:</span> <span className="text-muted-foreground">{profile.hardwareInfo.platform || 'Không có'}</span></p>
                                     <p><span className="font-medium">Pin:</span> <span className="text-muted-foreground">{profile.hardwareInfo.battery ? `${Math.round(profile.hardwareInfo.battery.level)}%` : 'Không có'}</span></p>
                                    <h4 className="font-semibold pt-2">Quyền truy cập</h4>
                                     <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        {Object.entries(profile.permissions).map(([key, value]) => (
                                            <div key={key} className="flex justify-between items-center">
                                                <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                {renderStoredPermissionStatus(value)}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end pt-4">
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm">Xóa Hồ sơ</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Hành động này sẽ xóa vĩnh viễn hồ sơ thiết bị cho "{profile.deviceName}".
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteProfile(profile.id)} className="bg-destructive hover:bg-destructive/90">Xóa</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <p className="text-center text-muted-foreground py-4">Chưa có hồ sơ thiết bị nào được lưu.</p>
                )}
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

    
    
    