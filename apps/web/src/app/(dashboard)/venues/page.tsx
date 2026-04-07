'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { MapPin, Plus, Users, Dumbbell } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { isOrganizer } from '@/lib/utils/roles';
import { ROUTES } from '@/lib/constants';
import { GET_VENUES } from '@/graphql/queries/venue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';

export default function VenuesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canCreate = user && isOrganizer(user.role);

  const { data, loading } = useQuery(GET_VENUES);

  const venues = data?.venues ?? [];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Địa điểm</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý địa điểm và cơ sở thể thao.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => router.push(ROUTES.venueNew)}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm địa điểm
          </Button>
        )}
      </div>

      {venues.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No venues"
          description="Thêm địa điểm để phân bổ cho các trận đấu."
          action={
            canCreate
              ? { label: 'Thêm địa điểm', onClick: () => router.push(ROUTES.venueNew) }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map(
            (venue: {
              id: string;
              name: string;
              address: string;
              city: string;
              capacity: number | null;
              sportTypes: string[];
            }) => (
              <Link key={venue.id} href={ROUTES.venueDetail(venue.id)}>
              <Card
                className="transition-all hover:shadow-md hover:border-primary/20 cursor-pointer"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{venue.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                      {venue.address}, {venue.city}
                    </span>
                  </div>
                  {venue.capacity && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>Sức chứa: {venue.capacity}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {venue.sportTypes?.map((sport: string) => (
                      <Badge
                        key={sport}
                        variant="outline"
                        className="text-[10px] capitalize"
                      >
                        <Dumbbell className="mr-1 h-2.5 w-2.5" />
                        {sport}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
