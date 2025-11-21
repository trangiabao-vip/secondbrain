'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { Mail, Phone, Globe, Building, Share2 } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { type BusinessCard } from '@/lib/data';
import Link from 'next/link';

function BusinessCardGenerator() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [cardId, setCardId] = useState<string | null>(null);
  const [name, setName] = useState('Nguyễn Văn A');
  const [title, setTitle] = useState('Lập trình viên Full-stack');
  const [company, setCompany] = useState('Công ty Công nghệ ABC');
  const [phone, setPhone] = useState('0123 456 789');
  const [email, setEmail] = useState('nva@email.com');
  const [website, setWebsite] = useState('nva.dev');
  const [accentColor, setAccentColor] = useState('#F59E0B'); // default amber-500
  const [socials, setSocials] = useState({
    github: '',
    linkedin: '',
    facebook: '',
    instagram: '',
    x: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [shareableLink, setShareableLink] = useState('');

  const cardQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'businessCards'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: userCards, isLoading: isCardLoading } = useCollection<BusinessCard>(cardQuery);

  useEffect(() => {
    if (userCards && userCards.length > 0) {
      const card = userCards[0];
      setCardId(card.id);
      setName(card.name);
      setTitle(card.title);
      setCompany(card.company || '');
      setPhone(card.phone || '');
      setEmail(card.email || '');
      setWebsite(card.website || '');
      setAccentColor(card.accentColor || '#F59E0B');
      setSocials(card.socials || {});
      setShareableLink(`${window.location.origin}/card/${card.id}`);
    }
  }, [userCards]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSaveCard = async () => {
    if (!user) return;
    setIsLoading(true);

    const cardData = {
      name,
      title,
      company,
      phone,
      email,
      website,
      accentColor,
      socials,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };

    try {
      if (cardId) {
        // Update existing card
        const cardRef = doc(firestore, 'businessCards', cardId);
        await updateDoc(cardRef, { ...cardData, updatedAt: serverTimestamp() });
        toast({ title: "Đã cập nhật", description: "Danh thiếp của bạn đã được lưu." });
        setShareableLink(`${window.location.origin}/card/${cardId}`);
      } else {
        // Create new card
        const docRef = await addDoc(collection(firestore, 'businessCards'), cardData);
        setCardId(docRef.id);
        setShareableLink(`${window.location.origin}/card/${docRef.id}`);
        toast({ title: "Đã tạo!", description: "Danh thiếp của bạn đã được tạo thành công." });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Lỗi", description: "Không thể lưu danh thiếp." });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableLink);
    toast({ title: 'Đã sao chép!', description: 'Link danh thiếp đã được sao chép.' });
  };
  
  const socialIcons: Record<keyof typeof socials, React.FC<{ className?: string }>> = {
    github: Icons.github,
    linkedin: Icons.linkedin,
    facebook: Icons.facebook,
    instagram: Icons.instagram,
    x: Icons.x,
  };


  if (isCardLoading) {
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <Skeleton className="h-8 w-64 mx-auto mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
                 <div className="md:col-span-2">
                    <Skeleton className="h-8 w-32 mx-auto mb-4" />
                    <Skeleton className="max-w-2xl mx-auto aspect-[1.7]/1" />
                 </div>
            </div>
        </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-center">Trình tạo Danh thiếp Kỹ thuật số</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Thông tin của bạn</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Chức danh</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Công ty</Label>
                <Input id="company" value={company} onChange={e => setCompany(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" value={website} onChange={e => setWebsite(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent-color">Màu nhấn</Label>
                <Input id="accent-color" type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="p-1 h-10"/>
              </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Mạng xã hội</h2>
            </CardHeader>
            <CardContent className="space-y-4">
                {Object.keys(socials).map((key) => (
                    <div className="space-y-2" key={key}>
                        <Label htmlFor={`social-${key}`} className="capitalize">{key}</Label>
                        <Input 
                            id={`social-${key}`} 
                            value={socials[key as keyof typeof socials]} 
                            onChange={e => setSocials({...socials, [key]: e.target.value})}
                            placeholder={`https://.../${key}/your-username`}
                         />
                    </div>
                ))}
            </CardContent>
          </Card>
          <Button onClick={handleSaveCard} disabled={isLoading} className="w-full text-lg py-6">
              {isLoading && <Icons.ai className="mr-2 h-4 w-4 animate-spin" />}
              {cardId ? 'Lưu thay đổi' : 'Tạo danh thiếp'}
          </Button>

          {shareableLink && (
            <Alert>
                <Share2 className="h-4 w-4" />
                <AlertTitle>Link chia sẻ của bạn!</AlertTitle>
                <AlertDescription className="flex flex-col gap-2 mt-2">
                    <Input value={shareableLink} readOnly />
                    <div className="flex gap-2">
                        <Button onClick={copyToClipboard} className="w-full">
                            <Icons.copy className="mr-2" /> Sao chép
                        </Button>
                        <Button variant="secondary" asChild className="w-full">
                            <Link href={shareableLink} target="_blank">
                                Xem trước
                            </Link>
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>
          )}

        </div>

        {/* Preview */}
        <div className="md:col-span-2">
           <h2 className="text-xl font-semibold text-center mb-4">Xem trước trên di động</h2>
            <div className="max-w-sm mx-auto bg-foreground rounded-[2.5rem] border-[10px] border-foreground shadow-2xl overflow-hidden">
                <Card className="bg-background text-foreground rounded-none"
                  style={{ '--preview-accent-color': accentColor } as React.CSSProperties}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 text-4xl mb-4 border-2" style={{ borderColor: accentColor }}>
                            <AvatarFallback>{getInitials(name)}</AvatarFallback>
                        </Avatar>
                        <h3 className="text-2xl font-bold">{name}</h3>
                        <p className="text-lg" style={{ color: accentColor }}>{title}</p>
                        <p className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <Building className="h-4 w-4" />
                            <span>{company}</span>
                        </p>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4 text-sm">
                       <p className="flex items-center gap-3">
                        <Phone className="h-4 w-4" style={{ color: accentColor }}/>
                        <span>{phone}</span>
                      </p>
                       <p className="flex items-center gap-3">
                        <Mail className="h-4 w-4" style={{ color: accentColor }}/>
                        <span>{email}</span>
                      </p>
                       <p className="flex items-center gap-3">
                        <Globe className="h-4 w-4" style={{ color: accentColor }}/>
                        <span>{website}</span>
                      </p>
                    </div>

                     <Separator className="my-6" />

                     <div className="flex justify-center gap-4 text-2xl">
                         {Object.entries(socials).map(([key, value]) => {
                             if (!value) return null;
                             const Icon = socialIcons[key as keyof typeof socials];
                             return (
                                <a key={key} href={value} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[--preview-accent-color]">
                                    <Icon />
                                </a>
                             )
                         })}
                     </div>
                  </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function BusinessCardPage() {
    return (
        <AuthGuard>
            <BusinessCardGenerator />
        </AuthGuard>
    )
}

    