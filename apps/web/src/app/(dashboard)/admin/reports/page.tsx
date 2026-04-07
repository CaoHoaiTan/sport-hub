'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { toast } from 'sonner';
import {
  Shield,
  FileText,
  Download,
  BarChart3,
} from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { isAdmin } from '@/lib/utils/roles';
import { GET_MY_TOURNAMENTS } from '@/graphql/queries/tournament';
import { GRAPHQL_HTTP_URL } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [selectedTournament, setSelectedTournament] = useState<string>('');

  const { data, loading } = useQuery(GET_MY_TOURNAMENTS, {
    skip: !user || !isAdmin(user.role),
  });

  if (!user || !isAdmin(user.role)) {
    return (
      <EmptyState
        icon={Shield}
        title="Từ chối truy cập"
        description="Bạn không có quyền xem trang này."
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const tournaments = data?.myTournaments ?? [];

  function handleExport(type: 'tournament' | 'financial') {
    if (!selectedTournament) {
      toast.error('Vui lòng chọn giải đấu trước.');
      return;
    }
    const endpoint = type === 'tournament'
      ? `${GRAPHQL_HTTP_URL.replace('/graphql', '')}/export/tournament/${selectedTournament}`
      : `${GRAPHQL_HTTP_URL.replace('/graphql', '')}/export/financial/${selectedTournament}`;

    window.open(endpoint, '_blank');
    toast.success(`${type === 'tournament' ? 'Tournament' : 'Financial'} đã bắt đầu xuất báo cáo.`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Báo cáo</h1>
        <p className="text-sm text-muted-foreground">
          Tạo và xuất báo cáo giải đấu.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chọn giải đấu</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedTournament}
            onValueChange={setSelectedTournament}
          >
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Chọn giải đấu" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map(
                (t: { id: string; name: string }) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Báo cáo giải đấu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Bao gồm đội, trận đấu, bảng xếp hạng và kết quả.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('tournament')}
              disabled={!selectedTournament}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Báo cáo giải đấu
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Báo cáo tài chính
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Bao gồm gói thanh toán, giao dịch và tổng hợp doanh thu.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('financial')}
              disabled={!selectedTournament}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Báo cáo tài chính
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
