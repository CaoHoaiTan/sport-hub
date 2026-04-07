'use client';

import { useRouter } from 'next/navigation';
import { Menu, Bell, LogOut, User } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/context';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push(ROUTES.login);
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Mở menu</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <UserMenu
          user={user}
          onProfileClick={() => router.push(ROUTES.profile)}
          onLogout={handleLogout}
        />
      </div>
    </header>
  );
}

function NotificationBell() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => router.push(ROUTES.notifications)}
    >
      <Bell className="h-5 w-5" />
      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
      <span className="sr-only">Thông báo</span>
    </Button>
  );
}

interface UserMenuProps {
  user: {
    fullName: string;
    email: string;
    avatarUrl?: string;
    role: string;
  } | null;
  onProfileClick: () => void;
  onLogout: () => void;
}

function UserMenu({ user, onProfileClick, onLogout }: UserMenuProps) {
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
            <AvatarFallback className="text-xs">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onProfileClick}>
          <User className="mr-2 h-4 w-4" />
          Hồ sơ
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
