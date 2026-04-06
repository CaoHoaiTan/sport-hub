'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Shield, Users } from 'lucide-react';

import { useAuth } from '@/lib/auth/context';
import { isAdmin } from '@/lib/utils/roles';
import { formatDate } from '@/lib/utils/format';
import { GET_USERS } from '@/graphql/queries/user';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';

const PAGE_SIZE = 20;

const roleVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  organizer: 'secondary',
  team_manager: 'outline',
  player: 'outline',
  referee: 'outline',
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [cursor, setCursor] = useState<string | null>(null);

  const { data, loading, fetchMore } = useQuery(GET_USERS, {
    variables: { pagination: { first: PAGE_SIZE, after: null } },
    skip: !user || !isAdmin(user.role),
  });

  if (!user || !isAdmin(user.role)) {
    return (
      <EmptyState
        icon={Shield}
        title="Access Denied"
        description="You do not have permission to view this page."
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
  const users = edges.map(
    (edge: { node: Record<string, unknown> }) => edge.node
  );

  const columns = [
    {
      key: 'fullName',
      header: 'Name',
      render: (row: Record<string, unknown>) => (
        <span className="font-medium">{row.fullName as string}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (row: Record<string, unknown>) => (
        <span className="text-sm">{row.email as string}</span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row: Record<string, unknown>) => {
        const role = row.role as string;
        return (
          <Badge
            variant={roleVariants[role] ?? 'outline'}
            className="capitalize text-[10px]"
          >
            {role.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row: Record<string, unknown>) => (
        <Badge variant={row.isActive ? 'success' : 'destructive'} className="text-[10px]">
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (row: Record<string, unknown>) =>
        formatDate(row.createdAt as string),
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
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} total users
          </p>
        </div>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="There are no registered users yet."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={users}
            isLoading={loading}
            keyExtractor={(row) => row.id as string}
          />
          <Pagination
            hasNextPage={pageInfo?.hasNextPage ?? false}
            onLoadMore={handleLoadMore}
          />
        </>
      )}
    </div>
  );
}
