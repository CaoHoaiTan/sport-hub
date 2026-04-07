'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  Settings,
  Loader2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { isOrganizer } from '@/lib/utils/roles';
import { ROUTES } from '@/lib/constants';
import { GET_TOURNAMENT } from '@/graphql/queries/tournament';
import {
  UPDATE_TOURNAMENT,
  DELETE_TOURNAMENT,
} from '@/graphql/mutations/tournament';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { TournamentStatusBadge } from '@/components/tournament/tournament-status-badge';
import { useState } from 'react';

const sportLabels: Record<string, string> = {
  football: 'Bóng đá',
  volleyball: 'Bóng chuyền',
  badminton: 'Cầu lông',
};

const formatLabels: Record<string, string> = {
  round_robin: 'Vòng tròn',
  single_elimination: 'Loại trực tiếp',
  double_elimination: 'Loại trực tiếp (kép)',
  group_stage_knockout: 'Vòng bảng + Loại trực tiếp',
};

const settingsSchema = z.object({
  name: z.string().min(1, 'Tên giải đấu không được để trống'),
  description: z.string().optional(),
  maxTeams: z.coerce.number().int().min(2, 'Tối thiểu 2 đội').optional(),
  registrationStart: z.string().optional(),
  registrationEnd: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  pointsForWin: z.coerce.number().int().min(0),
  pointsForDraw: z.coerce.number().int().min(0),
  pointsForLoss: z.coerce.number().int().min(0),
  entryFee: z.coerce.number().min(0),
  bannerUrl: z.string().optional(),
  rulesText: z.string().optional(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toISO(datetimeLocal: string | undefined): string | null {
  if (!datetimeLocal) return null;
  const d = new Date(datetimeLocal);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export default function TournamentSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, loading } = useQuery(GET_TOURNAMENT, {
    variables: { id },
    skip: !id,
  });

  const [updateTournament, { loading: updating }] = useMutation(
    UPDATE_TOURNAMENT,
    {
      refetchQueries: [{ query: GET_TOURNAMENT, variables: { id } }],
    }
  );

  const [deleteTournament, { loading: deleting }] = useMutation(
    DELETE_TOURNAMENT
  );

  const tournament = data?.tournament;
  const canManage = user && isOrganizer(user.role);
  const isLocked =
    tournament?.status === 'completed' || tournament?.status === 'cancelled';

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: '',
      description: '',
      maxTeams: undefined,
      registrationStart: '',
      registrationEnd: '',
      startDate: '',
      endDate: '',
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      entryFee: 0,
      bannerUrl: '',
      rulesText: '',
    },
  });

  // Populate form when tournament data loads
  useEffect(() => {
    if (tournament) {
      form.reset({
        name: tournament.name ?? '',
        description: tournament.description ?? '',
        maxTeams: tournament.maxTeams ?? undefined,
        registrationStart: toDatetimeLocal(tournament.registrationStart),
        registrationEnd: toDatetimeLocal(tournament.registrationEnd),
        startDate: toDatetimeLocal(tournament.startDate),
        endDate: toDatetimeLocal(tournament.endDate),
        pointsForWin: tournament.pointsForWin ?? 3,
        pointsForDraw: tournament.pointsForDraw ?? 1,
        pointsForLoss: tournament.pointsForLoss ?? 0,
        entryFee: tournament.entryFee ?? 0,
        bannerUrl: tournament.bannerUrl ?? '',
        rulesText: tournament.rulesText ?? '',
      });
    }
  }, [tournament, form]);

  async function onSubmit(values: SettingsValues) {
    try {
      await updateTournament({
        variables: {
          id,
          input: {
            name: values.name,
            description: values.description || null,
            maxTeams: values.maxTeams || null,
            registrationStart: toISO(values.registrationStart),
            registrationEnd: toISO(values.registrationEnd),
            startDate: toISO(values.startDate),
            endDate: toISO(values.endDate),
            pointsForWin: values.pointsForWin,
            pointsForDraw: values.pointsForDraw,
            pointsForLoss: values.pointsForLoss,
            entryFee: values.entryFee,
            bannerUrl: values.bannerUrl || null,
            rulesText: values.rulesText || null,
          },
        },
      });
      toast.success('Cập nhật giải đấu thành công.');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Cập nhật thất bại';
      toast.error(message);
    }
  }

  async function handleDelete() {
    try {
      await deleteTournament({ variables: { id } });
      toast.success('Đã xóa giải đấu.');
      router.push(ROUTES.tournaments);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Xóa thất bại';
      toast.error(message);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Không tìm thấy giải đấu.
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Read-only info */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="capitalize">
          {sportLabels[tournament.sport] ?? tournament.sport}
        </Badge>
        <Badge variant="secondary">
          {formatLabels[tournament.format] ?? tournament.format}
        </Badge>
        <TournamentStatusBadge status={tournament.status} />
      </div>

      {isLocked && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Giải đấu đã {tournament.status === 'completed' ? 'kết thúc' : 'bị hủy'}. Không thể chỉnh sửa.
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên giải đấu *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLocked} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        disabled={isLocked}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bannerUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://example.com/banner.jpg"
                        disabled={isLocked}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lịch trình</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="registrationStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mở đăng ký</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          disabled={isLocked}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="registrationEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Đóng đăng ký</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          disabled={isLocked}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày bắt đầu</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          disabled={isLocked}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày kết thúc</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          disabled={isLocked}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Rules & Points */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quy định</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="maxTeams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số đội tối đa</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        min={2}
                        disabled={isLocked}
                      />
                    </FormControl>
                    <FormDescription>
                      Để trống nếu không giới hạn.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="pointsForWin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Điểm thắng</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          min={0}
                          disabled={isLocked}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pointsForDraw"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Điểm hòa</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          min={0}
                          disabled={isLocked}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pointsForLoss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Điểm thua</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          min={0}
                          disabled={isLocked}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="rulesText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Điều lệ</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={5}
                        placeholder="Nhập điều lệ giải đấu..."
                        disabled={isLocked}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Entry Fee */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Phí tham gia</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="entryFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lệ phí (VNĐ)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        min={0}
                        step={1000}
                        disabled={isLocked}
                      />
                    </FormControl>
                    <FormDescription>
                      Đặt 0 cho giải đấu miễn phí.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Save button */}
          {!isLocked && (
            <div className="flex justify-end">
              <Button type="submit" disabled={updating}>
                {updating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Lưu thay đổi
              </Button>
            </div>
          )}
        </form>
      </Form>

      {/* Danger Zone */}
      {!isLocked && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Vùng nguy hiểm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Xóa giải đấu sẽ xóa tất cả dữ liệu liên quan bao gồm đội, trận
              đấu, và bảng xếp hạng. Hành động này không thể hoàn tác.
            </p>
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa giải đấu
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa giải đấu"
        description="Bạn có chắc muốn xóa giải đấu này? Tất cả đội, trận đấu và dữ liệu liên quan sẽ bị xóa vĩnh viễn."
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Xóa vĩnh viễn"
        isLoading={deleting}
      />
    </div>
  );
}
