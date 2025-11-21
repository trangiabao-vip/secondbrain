'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { Mail, Phone, Globe, Building } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

const themes = [
  { name: 'Mặc định', bg: 'bg-card', text: 'text-card-foreground', primary: 'text-primary' },
  { name: 'Xanh Navy', bg: 'bg-blue-900', text: 'text-white', primary: 'text-blue-300' },
  { name: 'Xám Tối', bg: 'bg-gray-800', text: 'text-white', primary: 'text-gray-300' },
  { name: 'Kem', bg: 'bg-orange-50', text: 'text-gray-800', primary: 'text-orange-600' },
];

export default function BusinessCardPage() {
  const [name, setName] = useState('Nguyễn Văn A');
  const [title, setTitle] = useState('Lập trình viên Full-stack');
  const [company, setCompany] = useState('Công ty Công nghệ ABC');
  const [phone, setPhone] = useState('0123 456 789');
  const [email, setEmail] = useState('nva@email.com');
  const [website, setWebsite] = useState('nva.dev');
  const [theme, setTheme] = useState('Mặc định');

  const selectedTheme = themes.find(t => t.name === theme) || themes[0];
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6 text-center">Tạo Danh thiếp</h1>
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
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Chủ đề</h2>
            </CardHeader>
            <CardContent>
              <RadioGroup value={theme} onValueChange={setTheme}>
                {themes.map(t => (
                   <div key={t.name} className="flex items-center space-x-2">
                    <RadioGroupItem value={t.name} id={`theme-${t.name}`} />
                    <Label htmlFor={`theme-${t.name}`}>{t.name}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="md:col-span-2">
           <h2 className="text-xl font-semibold text-center mb-4">Xem trước</h2>
            <Card className={cn(
                "max-w-2xl mx-auto aspect-[1.7]/1 shadow-lg rounded-xl overflow-hidden transition-all duration-300",
                 selectedTheme.bg, selectedTheme.text
            )}>
              <div className="h-full w-full p-8 flex flex-col justify-between">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 text-3xl">
                    <AvatarFallback className={cn(selectedTheme.bg, "border")}>{getInitials(name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-2xl font-bold">{name}</h3>
                    <p className={cn("text-lg", selectedTheme.primary)}>{title}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="space-y-2 text-sm">
                  <Separator className="my-4 bg-current opacity-20" />
                   <p className="flex items-center gap-3 font-semibold text-base">
                    <Building className={cn("h-5 w-5", selectedTheme.primary)} />
                    <span>{company}</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      <p className="flex items-center gap-3">
                        <Phone className={cn("h-4 w-4", selectedTheme.primary)} />
                        <span>{phone}</span>
                      </p>
                       <p className="flex items-center gap-3">
                        <Mail className={cn("h-4 w-4", selectedTheme.primary)} />
                        <span>{email}</span>
                      </p>
                       <p className="flex items-center gap-3 col-span-full">
                        <Globe className={cn("h-4 w-4", selectedTheme.primary)} />
                        <span>{website}</span>
                      </p>
                  </div>
                </div>
              </div>
            </Card>
        </div>
      </div>
    </div>
  );
}
