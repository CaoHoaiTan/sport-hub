'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { Loader2, MapPin } from 'lucide-react';

import { ROUTES } from '@/lib/constants';
import { CREATE_VENUE } from '@/graphql/mutations/venue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

const sportOptions = ['football', 'volleyball', 'badminton'] as const;

export default function NewVenuePage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [capacity, setCapacity] = useState('');
  const [sportTypes, setSportTypes] = useState<string[]>([]);
  const [surfaceType, setSurfaceType] = useState('');
  const [amenities, setAmenities] = useState('');

  const [createVenue, { loading }] = useMutation(CREATE_VENUE, {
    onCompleted: () => {
      toast.success('Tạo địa điểm thành công.');
      router.push(ROUTES.venues);
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSportToggle(sport: string) {
    setSportTypes((prev) =>
      prev.includes(sport)
        ? prev.filter((s) => s !== sport)
        : [...prev, sport]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createVenue({
      variables: {
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
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Thêm địa điểm</h1>
        <p className="text-sm text-muted-foreground">
          Tạo địa điểm thi đấu mới.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Thông tin địa điểm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="venue-name">Name</Label>
              <Input
                id="venue-name"
                placeholder="e.g., District 7 Sports Center"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue-address">Địa chỉ</Label>
              <Input
                id="venue-address"
                placeholder="Full street address"
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
                  placeholder="e.g., Ho Chi Minh Thành phố"
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
                  placeholder="Optional"
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
                placeholder="e.g., natural grass, synthetic turf"
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
                placeholder="e.g., parking, changing rooms, lighting"
                value={amenities}
                onChange={(e) => setAmenities(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.venues)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tạo địa điểm
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
