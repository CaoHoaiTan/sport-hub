'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Trophy,
  Compass,
  MapPin,
  Bell,
  Users,
  BarChart3,
  User,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/lib/auth/context';
import { isAdmin, isOrganizer, type UserRole } from '@/lib/utils/roles';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
    label: 'Giải đấu của tôi',
    href: ROUTES.tournaments,
    icon: Trophy,
    visible: () => true,
  },
  {
    label: 'Khám phá giải đấu',
    href: ROUTES.publicTournaments,
    icon: Compass,
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

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredItems = navItems.filter((item) => item.visible(user?.role));

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'hidden border-r bg-sidebar text-sidebar-foreground md:flex md:flex-col',
          'transition-[width] duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center border-b px-4',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && (
            <Link href={ROUTES.dashboard} className="flex items-center gap-2">
              <Image src="/logo-horizontal.svg" alt="SportHub" width={120} height={28} />
            </Link>
          )}
          {collapsed && (
            <Link href={ROUTES.dashboard}>
              <Image src="/icon.svg" alt="SportHub" width={20} height={20} />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7 text-sidebar-foreground/60 hover:text-sidebar-foreground',
              collapsed && 'hidden'
            )}
            onClick={onToggle}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== ROUTES.dashboard && pathname.startsWith(item.href));
            const Icon = item.icon;

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive &&
                    'bg-sidebar-accent text-sidebar-accent-foreground',
                  !isActive && 'text-sidebar-foreground/70',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        <Separator />

        <div className="p-2">
          {collapsed ? (
            <div className="space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={ROUTES.profile}
                    className={cn(
                      'flex items-center justify-center rounded-lg px-2 py-2 text-sm font-medium transition-colors',
                      'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      pathname === ROUTES.profile &&
                        'bg-sidebar-accent text-sidebar-accent-foreground'
                    )}
                  >
                    <User className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Hồ sơ</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-full text-sidebar-foreground/60 hover:text-sidebar-foreground"
                    onClick={onToggle}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Mở rộng</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <Link
              href={ROUTES.profile}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                pathname === ROUTES.profile &&
                  'bg-sidebar-accent text-sidebar-accent-foreground'
              )}
            >
              <User className="h-4 w-4 shrink-0" />
              <span>Hồ sơ</span>
            </Link>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
