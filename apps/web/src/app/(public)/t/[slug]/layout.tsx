import { type ReactNode } from 'react';
import Link from 'next/link';
import { Calendar, BarChart3, MessageSquare, LayoutDashboard, UserPlus } from 'lucide-react';

import { getClient } from '@/lib/apollo/rsc-client';
import { GET_PUBLIC_TOURNAMENT } from '@/graphql/queries/public';

interface Props {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function PublicTournamentLayout({ children, params }: Props) {
  const { slug } = await params;

  let tournament = null;
  try {
    const { data } = await getClient().query({
      query: GET_PUBLIC_TOURNAMENT,
      variables: { slug },
    });
    tournament = data?.publicTournament;
  } catch {
    // tournament stays null
  }

  const isRegistrationOpen = tournament?.status === 'registration';

  const tabs = [
    { label: 'Tổng quan', href: `/t/${slug}`, icon: LayoutDashboard },
    ...(isRegistrationOpen
      ? [{ label: 'Đăng ký', href: `/t/${slug}/register`, icon: UserPlus }]
      : []),
    { label: 'Lịch thi đấu', href: `/t/${slug}/schedule`, icon: Calendar },
    ...(tournament?.format !== 'single_elimination' && tournament?.format !== 'double_elimination'
      ? [{ label: 'Bảng xếp hạng', href: `/t/${slug}/standings`, icon: BarChart3 }]
      : []),
    { label: 'Bài viết', href: `/t/${slug}/posts`, icon: MessageSquare },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {tournament ? (
        <div className="space-y-4">
          {tournament.bannerUrl && (
            <div className="relative h-48 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tournament.bannerUrl}
                alt={tournament.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <h1 className="absolute bottom-4 left-4 text-2xl font-bold text-white">
                {tournament.name}
              </h1>
            </div>
          )}
          {!tournament.bannerUrl && (
            <h1 className="text-2xl font-bold tracking-tight">
              {tournament.name}
            </h1>
          )}

          <nav className="flex overflow-x-auto border-b" aria-label="Tournament navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-muted-foreground/30"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          Không tìm thấy giải đấu.
        </div>
      )}

      <div>{children}</div>
    </div>
  );
}
