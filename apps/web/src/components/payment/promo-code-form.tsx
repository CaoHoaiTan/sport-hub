'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { Loader2, Plus, Tag } from 'lucide-react';

import { GET_PROMO_CODES } from '@/graphql/queries/payment';
import { CREATE_PROMO_CODE } from '@/graphql/mutations/payment';
import { formatVND, formatDate } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/empty-state';

interface PromoCodeFormProps {
  tournamentId: string;
}

interface PromoCode {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

export function PromoCodeForm({ tournamentId }: PromoCodeFormProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const { data, loading: listLoading } = useQuery(GET_PROMO_CODES, {
    variables: { tournamentId },
  });

  const [createPromo, { loading }] = useMutation(CREATE_PROMO_CODE, {
    refetchQueries: [{ query: GET_PROMO_CODES, variables: { tournamentId } }],
  });

  const promos: PromoCode[] = data?.promoCodesByTournament ?? [];

  function resetForm() {
    setCode('');
    setDiscountType('percent');
    setDiscountValue('');
    setMaxUses('');
    setValidFrom('');
    setValidUntil('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createPromo({
        variables: {
          input: {
            tournamentId,
            code: code.toUpperCase(),
            discountType,
            discountValue: parseFloat(discountValue),
            maxUses: maxUses ? parseInt(maxUses, 10) : null,
            validFrom: validFrom || null,
            validUntil: validUntil || null,
          },
        },
      });
      toast.success('Đã tạo mã giảm giá.');
      resetForm();
      setOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Tạo mã thất bại';
      toast.error(message);
    }
  }

  function formatDiscount(promo: PromoCode) {
    if (promo.discountType === 'percent') {
      return `${promo.discountValue}%`;
    }
    return formatVND(promo.discountValue);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tạo mã giảm giá
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo mã giảm giá</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="promo-code">Mã code</Label>
                <Input
                  id="promo-code"
                  placeholder="VD: EARLYBIRD2024"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Loại giảm giá</Label>
                  <Select
                    value={discountType}
                    onValueChange={(v) => setDiscountType(v as 'percent' | 'fixed')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Phần trăm (%)</SelectItem>
                      <SelectItem value="fixed">Số tiền cố định (VND)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-value">
                    {discountType === 'percent' ? 'Giảm (%)' : 'Giảm (VND)'}
                  </Label>
                  <Input
                    id="promo-value"
                    type="number"
                    placeholder={discountType === 'percent' ? '10' : '50000'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    required
                    min={0}
                    max={discountType === 'percent' ? 100 : undefined}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo-max-uses">Số lần dùng tối đa</Label>
                <Input
                  id="promo-max-uses"
                  type="number"
                  placeholder="Không giới hạn"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  min={1}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="promo-valid-from">Có hiệu lực từ</Label>
                  <Input
                    id="promo-valid-from"
                    type="datetime-local"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-valid-until">Hết hạn</Label>
                  <Input
                    id="promo-valid-until"
                    type="datetime-local"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Hủy</Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Tạo mã
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {listLoading ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          Đang tải...
        </div>
      ) : promos.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Chưa có mã giảm giá"
          description="Tạo mã giảm giá để khuyến mãi cho các đội tham gia."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {promos.map((promo) => (
            <Card key={promo.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
                    {promo.code}
                  </code>
                  <Badge
                    variant={promo.isActive ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {promo.isActive ? 'Hoạt động' : 'Tắt'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-lg font-bold text-green-600">
                  -{formatDiscount(promo)}
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    Đã dùng: {promo.usedCount}
                    {promo.maxUses != null ? ` / ${promo.maxUses}` : ' (không giới hạn)'}
                  </p>
                  {promo.validFrom && (
                    <p>Từ: {formatDate(promo.validFrom)}</p>
                  )}
                  {promo.validUntil && (
                    <p>Đến: {formatDate(promo.validUntil)}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
