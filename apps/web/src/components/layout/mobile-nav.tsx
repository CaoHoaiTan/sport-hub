'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Trophy,
  MapPin,
  Bell,
  Users,
  BarChart3,
  User,
} from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/lib/auth/context';
import { isAdmin, isOrganizer, type UserRole } from '@/lib/utils/roles';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  visible: (role: UserRole | undefined) => boolean;
}

const navItems: NavItem[] = [
  {
    label: 'Tổng quan',
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
    visible: () => true,
  },
  {
    label: 'Giải đấu',
    href: ROUTES.tournaments,
    icon: Trophy,
    visible: () => true,
  },
  {
    label: 'Địa điểm',
    href: ROUTES.venues,
    icon: MapPin,
    visible: (role) => isOrganizer(role),
  },
  {
    label: 'Thông báo',
    href: ROUTES.notifications,
    icon: Bell,
    visible: () => true,
  },
  {
    label: 'Người dùng',
    href: ROUTES.adminUsers,
    icon: Users,
    visible: (role) => isAdmin(role),
  },
  {
    label: 'Báo cáo',
    href: ROUTES.adminReports,
    icon: BarChart3,
    visible: (role) => isAdmin(role),
  },
];

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredItems = navItems.filter((item) => item.visible(user?.role));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            SportHub
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== ROUTES.dashboard && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent text-accent-foreground',
                  !isActive && 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Separator />

        <div className="px-3 py-4">
          <Link
            href={ROUTES.profile}
            onClick={() => onOpenChange(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              pathname === ROUTES.profile
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground'
            )}
          >
            <User className="h-4 w-4 shrink-0" />
            <span>Hồ sơ</span>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
