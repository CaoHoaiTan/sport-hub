'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  MapPin,
  Pencil,
  Trash2,
  Loader2,
  Users,
  Dumbbell,
  X,
} from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { isOrganizer } from '@/lib/utils/roles';
import { ROUTES } from '@/lib/constants';
import { GET_VENUE } from '@/graphql/queries/venue';
import { UPDATE_VENUE, DELETE_VENUE } from '@/graphql/mutations/venue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

const sportOptions = ['football', 'volleyball', 'badminton'] as const;

export default function VenueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const venueId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [capacity, setCapacity] = useState('');
  const [sportTypes, setSportTypes] = useState<string[]>([]);
  const [surfaceType, setSurfaceType] = useState('');
  const [amenities, setAmenities] = useState('');

  const { data, loading } = useQuery(GET_VENUE, {
    variables: { id: venueId },
    skip: !venueId,
  });

  const [updateVenue, { loading: updating }] = useMutation(UPDATE_VENUE, {
    refetchQueries: [{ query: GET_VENUE, variables: { id: venueId } }],
  });

  const [deleteVenue, { loading: deletingVenue }] = useMutation(DELETE_VENUE);

  const venue = data?.venue;
  const canEdit =
    user &&
    (isOrganizer(user.role) || venue?.createdBy === user.id);

  // Populate form when data loads
  useEffect(() => {
    if (venue) {
      setName(venue.name ?? '');
      setAddress(venue.address ?? '');
      setCity(venue.city ?? '');
      setCapacity(venue.capacity ? String(venue.capacity) : '');
      setSportTypes(venue.sportTypes ?? []);
      setSurfaceType(venue.surfaceType ?? '');
      setAmenities(venue.amenities?.join(', ') ?? '');
    }
  }, [venue]);

  function handleSportToggle(sport: string) {
    setSportTypes((prev) =>
      prev.includes(sport)
        ? prev.filter((s) => s !== sport)
        : [...prev, sport]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateVenue({
        variables: {
          id: venueId,
          input: {
            name,
            address,
            city,
            capacity: capacity ? parseInt(capacity, 10) : null,
            sportTypes,
            surfaceType: surfaceType || null,
            amenities: amenities
              ? amenities.split(',').map((a) => a.trim())
              : [],
          },
        },
      });
      toast.success('Cập nhật địa điểm thành công.');
      setIsEditing(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Cập nhật thất bại';
      toast.error(message);
    }
  }

  async function handleDelete() {
    try {
      await deleteVenue({ variables: { id: venueId } });
      toast.success('Đã xóa địa điểm.');
      router.push(ROUTES.venues);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Xóa thất bại';
      toast.error(message);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Không tìm thấy địa điểm.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{venue.name}</h1>
          <p className="text-sm text-muted-foreground">
            Chi tiết địa điểm thi đấu
          </p>
        </div>
        {canEdit && !isEditing && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        /* Edit mode */
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Chỉnh sửa địa điểm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="venue-name">Tên</Label>
                <Input
                  id="venue-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue-address">Địa chỉ</Label>
                <Input
                  id="venue-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="venue-city">Thành phố</Label>
                  <Input
                    id="venue-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue-capacity">Sức chứa</Label>
                  <Input
                    id="venue-capacity"
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    min={0}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Môn thể thao</Label>
                <div className="flex flex-wrap gap-4">
                  {sportOptions.map((sport) => (
                    <label
                      key={sport}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={sportTypes.includes(sport)}
                        onCheckedChange={() => handleSportToggle(sport)}
                      />
                      <span className="text-sm capitalize">{sport}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue-surface">Loại sân</Label>
                <Input
                  id="venue-surface"
                  value={surfaceType}
                  onChange={(e) => setSurfaceType(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue-amenities">
                  Tiện ích (phân cách bằng dấu phẩy)
                </Label>
                <Input
                  id="venue-amenities"
                  value={amenities}
                  onChange={(e) => setAmenities(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form to original values
                    if (venue) {
                      setName(venue.name ?? '');
                      setAddress(venue.address ?? '');
                      setCity(venue.city ?? '');
                      setCapacity(venue.capacity ? String(venue.capacity) : '');
                      setSportTypes(venue.sportTypes ?? []);
                      setSurfaceType(venue.surfaceType ?? '');
                      setAmenities(venue.amenities?.join(', ') ?? '');
                    }
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Hủy
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Lưu
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* View mode */
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Thông tin địa điểm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Địa chỉ</p>
                <p className="text-sm font-medium">{venue.address}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Thành phố</p>
                <p className="text-sm font-medium">{venue.city}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              {venue.capacity && (
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sức chứa</p>
                    <p className="text-sm font-medium">{venue.capacity}</p>
                  </div>
                </div>
              )}
              {venue.surfaceType && (
                <div>
                  <p className="text-xs text-muted-foreground">Loại sân</p>
                  <p className="text-sm font-medium">{venue.surfaceType}</p>
                </div>
              )}
            </div>

            {venue.sportTypes?.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Môn thể thao
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {venue.sportTypes.map((sport: string) => (
                      <Badge
                        key={sport}
                        variant="outline"
                        className="capitalize"
                      >
                        <Dumbbell className="mr-1 h-3 w-3" />
                        {sport}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {venue.amenities?.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Tiện ích
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {venue.amenities.map((amenity: string) => (
                      <Badge key={amenity} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa địa điểm"
        description="Bạn có chắc muốn xóa địa điểm này? Hành động này không thể hoàn tác."
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Xóa"
        isLoading={deletingVenue}
      />
    </div>
  );
}
