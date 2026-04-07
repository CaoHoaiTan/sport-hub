'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Shield, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/auth/context';
import { isAdmin } from '@/lib/utils/roles';
import { formatDate } from '@/lib/utils/format';
import { GET_USERS } from '@/graphql/queries/user';
import { UPDATE_USER_ROLE, TOGGLE_USER_ACTIVE } from '@/graphql/mutations/user';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

const PAGE_SIZE = 20;

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  organizer: 'Người tổ chức',
  team_manager: 'Quản lý đội',
  player: 'Vận động viên',
  referee: 'Trọng tài',
};

const roleVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  organizer: 'secondary',
  team_manager: 'outline',
  player: 'outline',
  referee: 'outline',
};

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [cursor, setCursor] = useState<string | null>(null);
  const [roleConfirm, setRoleConfirm] = useState<{
    userId: string;
    userName: string;
    newRole: string;
  } | null>(null);

  const { data, loading, fetchMore } = useQuery(GET_USERS, {
    variables: { pagination: { first: PAGE_SIZE, after: null } },
    skip: !user || !isAdmin(user.role),
  });

  const [updateRole, { loading: updatingRole }] = useMutation(UPDATE_USER_ROLE, {
    refetchQueries: [{ query: GET_USERS, variables: { pagination: { first: PAGE_SIZE, after: null } } }],
  });

  const [toggleActive, { loading: toggling }] = useMutation(TOGGLE_USER_ACTIVE, {
    refetchQueries: [{ query: GET_USERS, variables: { pagination: { first: PAGE_SIZE, after: null } } }],
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
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const edges = data?.users?.edges ?? [];
  const pageInfo = data?.users?.pageInfo;
  const totalCount = data?.users?.totalCount ?? 0;
  const users: UserRow[] = edges.map(
    (edge: { node: UserRow }) => edge.node
  );

  async function handleRoleChange() {
    if (!roleConfirm) return;
    try {
      await updateRole({
        variables: { userId: roleConfirm.userId, role: roleConfirm.newRole },
      });
      toast.success(
        `Đã đổi vai trò của ${roleConfirm.userName} thành ${roleLabels[roleConfirm.newRole]}.`
      );
      setRoleConfirm(null);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Thao tác thất bại';
      toast.error(message);
    }
  }

  async function handleToggleActive(userId: string, userName: string) {
    try {
      await toggleActive({ variables: { userId } });
      toast.success(`Đã cập nhật trạng thái của ${userName}.`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Thao tác thất bại';
      toast.error(message);
    }
  }

  const columns = [
    {
      key: 'fullName',
      header: 'Họ tên',
      render: (row: Record<string, unknown>) => (
        <span className="font-medium">{row.fullName as string}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (row: Record<string, unknown>) => (
        <span className="text-sm text-muted-foreground">{row.email as string}</span>
      ),
    },
    {
      key: 'role',
      header: 'Vai trò',
      render: (row: Record<string, unknown>) => {
        const r = row as unknown as UserRow;
        const isSelf = r.id === user?.id;
        if (isSelf) {
          return (
            <Badge variant={roleVariants[r.role]} className="capitalize text-[10px]">
              {roleLabels[r.role] ?? r.role}
            </Badge>
          );
        }
        return (
          <Select
            value={r.role}
            onValueChange={(newRole) => {
              if (newRole !== r.role) {
                setRoleConfirm({
                  userId: r.id,
                  userName: r.fullName,
                  newRole,
                });
              }
            }}
          >
            <SelectTrigger className="h-7 w-[150px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="organizer">Người tổ chức</SelectItem>
              <SelectItem value="team_manager">Quản lý đội</SelectItem>
              <SelectItem value="player">Vận động viên</SelectItem>
              <SelectItem value="referee">Trọng tài</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      render: (row: Record<string, unknown>) => {
        const r = row as unknown as UserRow;
        const isSelf = r.id === user?.id;
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={r.isActive}
              disabled={isSelf || toggling}
              onCheckedChange={() => handleToggleActive(r.id, r.fullName)}
            />
            <span className={`text-xs ${r.isActive ? 'text-success' : 'text-destructive'}`}>
              {r.isActive ? 'Hoạt động' : 'Đã khóa'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Ngày tham gia',
      render: (row: Record<string, unknown>) => (
        <span className="text-sm">{formatDate(row.createdAt as string)}</span>
      ),
    },
  ];

  function handleLoadMore() {
    if (!pageInfo?.endCursor) return;
    const nextCursor = pageInfo.endCursor;
    setCursor(nextCursor);
    fetchMore({
      variables: {
        pagination: { first: PAGE_SIZE, after: nextCursor },
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          users: {
            ...fetchMoreResult.users,
            edges: [...prev.users.edges, ...fetchMoreResult.users.edges],
          },
        };
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} người dùng
          </p>
        </div>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Không tìm thấy người dùng"
          description="Chưa có người dùng đăng ký."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={users as unknown as Record<string, unknown>[]}
            isLoading={loading}
            keyExtractor={(row) => row.id as string}
          />
          <Pagination
            hasNextPage={pageInfo?.hasNextPage ?? false}
            onLoadMore={handleLoadMore}
          />
        </>
      )}

      {/* Role change confirmation */}
      <ConfirmDialog
        open={roleConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setRoleConfirm(null);
        }}
        title="Đổi vai trò"
        description={
          roleConfirm
            ? `Bạn có chắc muốn đổi vai trò của ${roleConfirm.userName} thành "${roleLabels[roleConfirm.newRole]}"?`
            : ''
        }
        onConfirm={handleRoleChange}
        confirmLabel="Xác nhận"
        isLoading={updatingRole}
      />
    </div>
  );
}
