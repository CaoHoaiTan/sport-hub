import Link from 'next/link';
import { Users, Shield } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    logoUrl?: string | null;
    manager?: { id: string; fullName: string } | null;
    groupName?: string | null;
    seed?: number | null;
    playerCount?: number;
  };
  className?: string;
}

export function TeamCard({ team, className }: TeamCardProps) {
  return (
    <Link href={ROUTES.teamDetail(team.id)}>
      <Card
        className={cn(
          'group transition-all hover:shadow-md hover:border-primary/20',
          className
        )}
      >
        <CardContent className="flex items-center gap-4 p-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={team.logoUrl ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {team.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold leading-tight truncate group-hover:text-primary transition-colors">
              {team.name}
            </h3>
            {team.manager && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {team.manager.fullName}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {team.groupName && (
              <Badge variant="outline" className="text-[10px]">
                Group {team.groupName}
              </Badge>
            )}
            {team.playerCount != null && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {team.playerCount}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
